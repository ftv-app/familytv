"""POST /video-embed — index a video for semantic search."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.video_indexer import index_video

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["video"])


class VideoEmbedRequest(BaseModel):
    """Request to index a video for search."""

    video_url: str = Field(..., description="URL to video file (Vercel Blob URL or local path)")
    video_id: str = Field(..., description="Unique ID for this video in our database")
    family_id: str = Field(..., description="REQUIRED: family ID for row-level security")
    interval_seconds: float = Field(
        default=5.0,
        ge=1.0,
        le=60.0,
        description="Extract one key frame every N seconds (default 5s)"
    )
    video_type: str = Field(default="video", description="Content type")


class VideoEmbedResponse(BaseModel):
    """Response from video indexing."""

    indexed: int
    video_id: str
    family_id: str
    frame_count: int


@router.post("/video-embed")
def video_embed(req: VideoEmbedRequest) -> dict[str, Any]:
    """Index a video: extract key frames, embed with CLIP, store in LanceDB.

    Extracts one key frame every `interval_seconds` (default 5s) using ffmpeg.
    Each frame is embedded with CLIP ViT-B/32 (512-dim).
    All slices are stored with family_id for row-level security.
    """
    if not req.family_id:
        raise HTTPException(status_code=400, detail="family_id is required")

    try:
        result = index_video(
            video_url=req.video_url,
            video_id=req.video_id,
            family_id=req.family_id,
            interval_seconds=req.interval_seconds,
            video_type=req.video_type,
        )
        return VideoEmbedResponse(**result).model_dump()
    except Exception as e:
        logger.error("Video indexing failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Video indexing failed: {str(e)}")
