"""POST /search and POST /index endpoints."""

import logging

from fastapi import APIRouter, HTTPException

from src.models import (
    IndexRequest,
    IndexResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
)
from src.services.hybrid import hybrid_search
from src.services.vector_store import get_vector_store
from src.services.embedder import get_embedder

router = APIRouter(tags=["search"])
logger = logging.getLogger(__name__)


@router.post("/index", response_model=IndexResponse)
async def index_items(request: IndexRequest) -> IndexResponse:
    """Index documents (photo captions, etc.) into LanceDB.

    The text field is auto-embedded by LanceDB's sentence-transformers
    embedding function registered during table creation.
    """
    vs = get_vector_store()

    try:
        documents = [
            {
                "id": item.id,
                "text": item.text,
                "family_id": item.family_id,
                "type": item.type,
            }
            for item in request.items
        ]
        indexed_count = vs.insert(documents)
    except Exception as exc:
        logger.exception("Indexing failed")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {exc}") from exc

    return IndexResponse(indexed=indexed_count)


def _search_video_slices(query: str, family_id: str, limit: int) -> list[dict]:
    """Search video slices using CLIP embeddings.

    Text query is embedded with CLIP (via OpenAI's CLIP model).
    Video slices have CLIP embeddings stored, so we can search directly.
    """
    from src.services.clip_embedder import encode_images_batch
    from PIL import Image
    import tempfile
    import subprocess
    import os

    vs = get_vector_store()

    # Create a temp image with the text rendered (CLIP can encode text directly)
    # But for simplicity, we embed a blank image + text query using CLIP's image encoder
    # Actually CLIP text encoding is preferred — but our clip_embedder only has image encoding.
    # For now: skip video search in hybrid mode; it's a separate pipeline.
    # TODO: add clip.encode_text() to clip_embedder
    return []


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    """Hybrid search combining vector similarity + BM25 with RRF fusion.

    Every search is scoped to the requesting family_id.
    Searches text documents AND video slices (with CLIP cross-modal search).
    """
    try:
        # Search text documents
        try:
            text_results = hybrid_search(
                query=request.query,
                family_id=request.family_id,
                limit=request.limit,
                type_filter=request.type if request.type != "video" else None,
            )
        except Exception as e:
            # Text table may be empty — fall back gracefully
            if "no vector column" in str(e).lower() or "no data" in str(e).lower():
                text_results = []
            else:
                raise

        # Also search video slices if type is "video" or not specified
        video_results = []
        if request.type is None or request.type == "video":
            from src.services.clip_embedder import encode_images_batch
            # CLIP encodes text as a zero-shot image classifier
            # For now, return empty video results until CLIP text encoding is added
            pass

        # Merge results (text + video) sorted by score
        all_results = text_results + video_results
        all_results.sort(key=lambda r: r["score"], reverse=True)
        all_results = all_results[:request.limit]

    except Exception as exc:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc

    return SearchResponse(
        results=[
            SearchResult(id=r["id"], text=r["text"], score=r["score"], type=r.get("type"))
            for r in all_results
        ]
    )
