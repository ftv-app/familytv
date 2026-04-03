"""Pydantic request/response schemas."""

from pydantic import BaseModel, Field, field_validator
from typing import Annotated


# ─────────────────────────────────────────────────────────────────────────────
# Embed
# ─────────────────────────────────────────────────────────────────────────────


class EmbedRequest(BaseModel):
    """Request body for POST /embed."""

    texts: Annotated[list[str], Field(min_length=1, max_length=100, description="List of texts to embed")]
    family_id: Annotated[str, Field(min_length=1, description="Family ID for access scoping")]

    @field_validator("texts")
    @classmethod
    def strip_empty_strings(cls, v: list[str]) -> list[str]:
        stripped = [t.strip() for t in v]
        if not any(stripped):
            raise ValueError("texts cannot all be empty")
        return stripped


class EmbedResponse(BaseModel):
    """Response body for POST /embed."""

    embeddings: list[list[float]]
    model: str
    dimension: int


# ─────────────────────────────────────────────────────────────────────────────
# Index
# ─────────────────────────────────────────────────────────────────────────────


class IndexItem(BaseModel):
    """Single item to index."""

    id: Annotated[str, Field(min_length=1, description="Unique document ID")]
    text: Annotated[str, Field(min_length=1, description="Text content to embed")]
    family_id: Annotated[str, Field(min_length=1, description="Family ID for access scoping")]
    type: Annotated[str | None, Field(default=None, description="Optional document type (e.g. photo, video)")]


class IndexRequest(BaseModel):
    """Request body for POST /index."""

    items: Annotated[list[IndexItem], Field(min_length=1, max_length=500, description="Items to index")]


class IndexResponse(BaseModel):
    """Response body for POST /index."""

    indexed: int


# ─────────────────────────────────────────────────────────────────────────────
# Search
# ─────────────────────────────────────────────────────────────────────────────


class SearchRequest(BaseModel):
    """Request body for POST /search."""

    query: Annotated[str, Field(min_length=1, description="Search query text")]
    family_id: Annotated[str, Field(min_length=1, description="Family ID for access scoping")]
    limit: Annotated[int, Field(default=10, ge=1, le=100, description="Max results to return")]
    type: Annotated[str | None, Field(default=None, description="Optional filter by document type")]


class SearchResult(BaseModel):
    """Single search result item."""

    id: str
    text: str
    score: float
    type: str | None = None


class SearchResponse(BaseModel):
    """Response body for POST /search."""

    results: list[SearchResult]


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    """Response body for GET /health."""

    status: str
    model: str
    vector_count: int
