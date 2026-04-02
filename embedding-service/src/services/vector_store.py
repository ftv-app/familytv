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
    """LanceDB row schema for indexed documents."""

    id: str
    text: str
    family_id: str
    type: str | None = None
    vector: Vector(settings.EMBEDDING_DIM)


# ─── VectorStore ──────────────────────────────────────────────────────────────


class VectorStore:
    """In-process LanceDB store for embedding vectors.

    The table is opened once and reused across requests.
    """

    TABLE_NAME = "documents"

    def __init__(self) -> None:
        self._db: lancedb.LanceDBConnection | None = None
        self._table: Any = None
        self._db_path: str = settings.LANCE_DB_PATH

    def _ensure_db_path(self) -> Path:
        """Ensure the database directory exists."""
        path = Path(self._db_path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def load(self) -> None:
        """Open (or create) the LanceDB database and table."""
        db_path = self._ensure_db_path()
        logger.info("Opening LanceDB at: %s", db_path)

        self._db = lancedb.connect(str(db_path))

        # Register the embedding function so LanceDB can auto-embed on insert
        embedding_function = SentenceTransformerEmbeddings(
            name=settings.MODEL_NAME,
        )

        # Check if table already exists
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
        """Insert documents into the table.

        Args:
            documents: List of dicts with keys: id, text, family_id, type (optional).
                       The 'vector' field is auto-computed by LanceDB's embedding function.

        Returns:
            Number of documents inserted.
        """
        if not documents:
            return 0
        self.table.add(documents)
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
            formatted.append({
                "id": row["id"],
                "text": row["text"],
                "score": float(row.get("_score", 0.0)),
                "type": row.get("type"),
            })

        return formatted

    def close(self) -> None:
        """Close the database connection."""
        if self._db is not None:
            self._db.close()
            self._db = None
            self._table = None
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
