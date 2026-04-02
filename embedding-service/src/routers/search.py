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


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    """Hybrid search combining vector similarity + BM25 with RRF fusion.

    Every search is scoped to the requesting family_id.
    """
    try:
        results = hybrid_search(
            query=request.query,
            family_id=request.family_id,
            limit=request.limit,
            type_filter=request.type,
        )
    except Exception as exc:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc

    return SearchResponse(
        results=[
            SearchResult(id=r["id"], text=r["text"], score=r["score"], type=r.get("type"))
            for r in results
        ]
    )
