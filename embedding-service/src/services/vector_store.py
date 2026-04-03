"""LanceDB vector store with family_id scoping."""

import logging
import os
from pathlib import Path
from typing import Any

import lancedb
from lancedb.embeddings import SentenceTransformerEmbeddings, EmbeddingFunctionConfig
from lancedb.pydantic import LanceModel, Vector

from src.config import settings

logger = logging.getLogger(__name__)

# ─── LanceDB schema ────────────────────────────────────────────────────────────


class Document(LanceModel):
    """LanceDB row schema for indexed documents (text only)."""

    id: str
    text: str
    family_id: str
    type: str | None = None
    vector: Vector(384)  # auto-computed by BGE-small


# ─── VectorStore ──────────────────────────────────────────────────────────────


class VectorStore:
    """In-process LanceDB store for embedding vectors.

    The table is opened once and reused across requests.
    """

    TABLE_NAME = "documents"
    VIDEO_TABLE_NAME = "video_slices"

    def __init__(self) -> None:
        self._db: lancedb.LanceDBConnection | None = None
        self._table: Any = None
        self._video_table: Any = None
        self._db_path: str = settings.LANCE_DB_PATH

    def _ensure_db_path(self) -> Path:
        """Ensure the database directory exists."""
        path = Path(self._db_path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def load(self) -> None:
        """Open (or create) the LanceDB database and tables."""
        db_path = self._ensure_db_path()
        logger.info("Opening LanceDB at: %s", db_path)

        self._db = lancedb.connect(str(db_path))

        # Text table: auto-embed with BGE-small
        embedding_function = SentenceTransformerEmbeddings(
            name=settings.MODEL_NAME,
        )

        table_names = self._db.table_names()

        if self.TABLE_NAME in table_names:
            self._table = self._db.open_table(self.TABLE_NAME)
            logger.info("Opened existing table '%s', count: %d", self.TABLE_NAME, self.count())
        else:
            self._table = self._db.create_table(
                self.TABLE_NAME,
                schema=Document,
                embedding_functions=[EmbeddingFunctionConfig(
                    source_column="text",
                    vector_column="vector",
                    function=embedding_function,
                )],
            )
            logger.info("Created new table '%s'", self.TABLE_NAME)

        # Video slices table: explicit CLIP vectors, no auto-embedding
        if self.VIDEO_TABLE_NAME in table_names:
            self._video_table = self._db.open_table(self.VIDEO_TABLE_NAME)
            logger.info("Opened video table, count: %d", self.video_count())
        else:
            import pyarrow as pa
            video_schema = pa.schema([
                ("id", pa.string()),
                ("text", pa.string()),
                ("family_id", pa.string()),
                ("type", pa.string()),
                ("vector", pa.list_(pa.float32())),
                ("video_id", pa.string()),
                ("timestamp", pa.float64()),
                ("frame_index", pa.int32()),
            ])
            self._video_table = self._db.create_table(self.VIDEO_TABLE_NAME, schema=video_schema)
            logger.info("Created new video table '%s'", self.VIDEO_TABLE_NAME)

    @property
    def video_table(self) -> Any:
        """Return the video slices table."""
        if self._video_table is None:
            raise RuntimeError("VectorStore not loaded. Call load() first.")
        return self._video_table

    def video_count(self) -> int:
        """Return total number of video slices."""
        return len(self.video_table)

    def insert_video_slices(self, slices: list[dict[str, Any]]) -> int:
        """Insert pre-computed video slice vectors (CLIP, 512-dim).

        Args:
            slices: List of dicts with: id, text, family_id, type, vector, video_id, timestamp, frame_index

        Returns:
            Number of slices inserted.
        """
        if not slices:
            return 0
        import pyarrow as pa
        arrays = {
            "id": [d["id"] for d in slices],
            "text": [d["text"] for d in slices],
            "family_id": [d["family_id"] for d in slices],
            "type": [d.get("type", "video") for d in slices],
            "vector": [d["vector"] for d in slices],
            "video_id": [d["video_id"] for d in slices],
            "timestamp": [d.get("timestamp", 0.0) for d in slices],
            "frame_index": [d.get("frame_index", 0) for d in slices],
        }
        schema = pa.schema([
            ("id", pa.string()),
            ("text", pa.string()),
            ("family_id", pa.string()),
            ("type", pa.string()),
            ("vector", pa.list_(pa.float32())),
            ("video_id", pa.string()),
            ("timestamp", pa.float64()),
            ("frame_index", pa.int32()),
        ])
        table = pa.table(arrays, schema=schema)
        self.video_table.add(table)
        logger.debug("Inserted %d video slices", len(slices))
        return len(slices)

    @property
    def table(self) -> Any:
        """Return the cached LanceDB table."""
        if self._table is None:
            raise RuntimeError("VectorStore not loaded. Call load() first.")
        return self._table

    def count(self) -> int:
        """Return total number of vectors in the table."""
        return len(self.table)

    def insert(self, documents: list[dict[str, Any]]) -> int:
        """Insert text documents into the table with auto-embedding.

        Args:
            documents: List of dicts with keys: id, text, family_id, type.
                       vector is auto-computed by BGE-small.

        Returns:
            Number of documents inserted.
        """
        if not documents:
            return 0

        # Strip any extra fields LanceDB doesn't know about
        text_docs = [
            {k: v for k, v in doc.items() if k in ("id", "text", "family_id", "type")}
            for doc in documents
        ]

        # LanceDB auto-embeds via the embedding function registered on the table
        self.table.add(text_docs)
        logger.debug("Inserted %d documents", len(documents))
        return len(documents)

    def search(
        self,
        query_vector: list[float],
        family_id: str,
        limit: int = 10,
        type_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        """Vector similarity search with mandatory family_id scoping.

        Args:
            query_vector: Pre-computed query embedding.
            family_id: REQUIRED family ID to scope the search.
            limit: Maximum number of results.
            type_filter: Optional document type to filter by.

        Returns:
            List of result dicts with id, text, score, type.
        """
        # Build WHERE clause — family_id is always required
        where_clauses = [f"family_id = '{family_id}'"]
        if type_filter is not None:
            where_clauses.append(f"type = '{type_filter}'")
        where_clause = " AND ".join(where_clauses)

        results = (
            self.table.search(query_vector)
            .where(where_clause)
            .limit(limit)
            .select(["id", "text", "family_id", "type"])
            .to_list()
        )

        # LanceDB returns scores alongside columns
        formatted = []
        for row in results:
            item = {
                "id": row["id"],
                "text": row["text"],
                "score": float(row.get("_score", 0.0)),
                "type": row.get("type"),
            }
            # Include video metadata if present
            if row.get("video_id"):
                item["video_id"] = row["video_id"]
            if row.get("timestamp") is not None:
                item["timestamp"] = row["timestamp"]
            if row.get("frame_index") is not None:
                item["frame_index"] = row["frame_index"]
            formatted.append(item)

        return formatted

    def close(self) -> None:
        """Close the database connection."""
        if self._db is not None:
            self._db.close()
            self._db = None
            self._table = None
            self._video_table = None
            logger.info("LanceDB connection closed")


# Singleton instance
_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Return the global VectorStore singleton."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
        _vector_store.load()
    return _vector_store
