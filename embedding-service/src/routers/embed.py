"""POST /embed — embed text(s) into vectors."""

import logging

from fastapi import APIRouter, HTTPException

from src.models import EmbedRequest, EmbedResponse
from src.services.embedder import get_embedder

router = APIRouter(prefix="/embed", tags=["embedding"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest) -> EmbedResponse:
    """Embed a list of texts using the configured BGE model.

    The model runs on CPU. Batch processing is used for efficiency.
    """
    embedder = get_embedder()

    try:
        embeddings = embedder.encode(request.texts)
    except Exception as exc:
        logger.exception("Embedding encoding failed")
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}") from exc

    return EmbedResponse(
        embeddings=embeddings,
        model=embedder.model_name,
        dimension=embedder.dimension,
    )
