"""Embedding service using BAAI/bge-small-en-v1.5 via sentence-transformers."""

import gc
import logging
from contextlib import contextmanager
from typing import Any

from sentence_transformers import SentenceTransformer

from src.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    """Loads and runs the BGE embedding model.

    The model is loaded once at startup and reused for all requests.
    """

    def __init__(self) -> None:
        self._model: SentenceTransformer | None = None
        self._model_name: str = settings.MODEL_NAME

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def dimension(self) -> int:
        """Return embedding dimension (cached after first encode)."""
        assert self._model is not None, "Model not loaded"
        return self._model.get_sentence_embedding_dimension()

    def load(self) -> None:
        """Load the model into memory. Called once at startup via lifespan."""
        logger.info("Loading embedding model: %s", self._model_name)
        self._model = SentenceTransformer(self._model_name)
        logger.info(
            "Embedding model loaded. Dimension: %d",
            self._model.get_sentence_embedding_dimension(),
        )

    def encode(self, texts: list[str], batch_size: int | None = None) -> list[list[float]]:
        """Encode a batch of texts into embedding vectors.

        Args:
            texts: List of input strings.
            batch_size: Override default batch size (defaults to MAX_BATCH_SIZE from config).

        Returns:
            List of embedding vectors (list of floats), one per input text.
        """
        if self._model is None:
            raise RuntimeError("Embedder model not loaded. Call load() first.")

        batch_size = batch_size or settings.MAX_BATCH_SIZE

        embeddings = self._model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,  # cosine similarity = dot product
        )

        # Force garbage collection after large batches
        if len(texts) > batch_size:
            gc.collect()

        # Convert numpy to Python list of floats
        return [row.tolist() for row in embeddings]

    @contextmanager
    def batch_context(self):
        """Optional context manager for memory-sensitive batch processing."""
        try:
            yield
        finally:
            gc.collect()

    def unload(self) -> None:
        """Release the model from memory."""
        if self._model is not None:
            del self._model
            self._model = None
            gc.collect()
            logger.info("Embedding model unloaded")


# Singleton instance shared across requests
_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    """Return the global Embedder singleton, loading it if necessary."""
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
        _embedder.load()
    return _embedder
