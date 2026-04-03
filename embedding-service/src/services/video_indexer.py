"""Video indexing: extract key frames and embed them with CLIP."""

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from src.services.clip_embedder import encode_images_batch
from src.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)

FFMPEG_PATH = "/tmp/ffmpeg-7.0.2-amd64-static/ffmpeg"


def extract_key_frames(
    video_path: str,
    output_dir: str,
    interval_seconds: float = 5.0,
) -> list[str]:
    """Extract one key frame every `interval_seconds` from a video.

    Uses ffmpeg fps filter to extract frames at regular intervals.

    Args:
        video_path: Path or URL to video file
        output_dir: Directory to write extracted frames
        interval_seconds: Extract one frame every N seconds

    Returns:
        List of paths to extracted frame images (JPEG)
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Use fps filter: 1 frame every `interval_seconds` seconds
    # fps = 1/interval — e.g. 0.2 = 1 frame per 5 seconds
    fps_fraction = 1.0 / interval_seconds
    vf_arg = f"fps={fps_fraction},scale=640:480"

    cmd = [
        FFMPEG_PATH,
        "-i", video_path,
        "-vf", vf_arg,
        "-vsync", "0",
        f"{output_dir}/frame_%04d.jpg",
    ]

    logger.info("Extracting key frames: ffmpeg %s -i %s -vf %s ...", FFMPEG_PATH, video_path, vf_arg)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 min max per video
        )
        if result.returncode != 0:
            logger.warning("ffmpeg stderr: %s", result.stderr[:500])
    except (subprocess.TimeoutExpired, Exception) as e:
        logger.error("Frame extraction failed: %s", e)
        raise

    frames = sorted(Path(output_dir).glob("frame_*.jpg"))
    logger.info("Extracted %d frames to %s", len(frames), output_dir)
    return [str(f) for f in frames]


def get_frame_timestamps(video_path: str, interval_seconds: float = 5.0) -> list[float]:
    """Get the timestamp (in seconds) for each extracted frame.

    Matches the frame extraction order.
    """
    timestamps = []
    t = 0.0
    while True:
        timestamps.append(t)
        t += interval_seconds
        if t > 3600:  # cap at 1 hour
            break
    return timestamps


def index_video(
    video_url: str,
    video_id: str,
    family_id: str,
    interval_seconds: float = 5.0,
    video_type: str = "video",
) -> dict[str, Any]:
    """Download (or use local) video, extract frames, embed, store in LanceDB.

    Args:
        video_url: URL or local path to video
        video_id: Unique ID for this video in our DB
        family_id: REQUIRED family ID for row-level security
        interval_seconds: Frame extraction interval
        video_type: Content type (video, live, etc.)

    Returns:
        Summary dict: { indexed: int, video_id, frame_count }
    """
    if not family_id:
        raise ValueError("family_id is required for video indexing")

    store = get_vector_store()

    # Create temp dir for frames
    temp_dir = tempfile.mkdtemp(prefix="video_frames_")

    try:
        # Download video to temp file if it's a URL
        video_path = video_url
        if video_url.startswith("http"):
            logger.info("Downloading video from %s", video_url)
            temp_video = tempfile.mktemp(suffix=".mp4")
            subprocess.run(
                ["curl", "-s", "-L", video_url, "-o", temp_video],
                timeout=120,
                check=True,
            )
            video_path = temp_video

        # Extract key frames
        frames = extract_key_frames(video_path, temp_dir, interval_seconds)
        if not frames:
            raise RuntimeError("No frames extracted from video")

        timestamps = get_frame_timestamps(video_path, interval_seconds)

        # Encode all frames in one batch
        logger.info("Encoding %d frames with CLIP...", len(frames))
        embeddings = encode_images_batch(frames[:len(timestamps)])

        # Build documents for LanceDB
        documents = []
        for i, (frame_path, embedding) in enumerate(zip(frames, embeddings)):
            ts = timestamps[i] if i < len(timestamps) else i * interval_seconds
            documents.append({
                "id": f"{video_id}_slice_{i:04d}",
                "text": f"video:{video_id}:{ts:.1f}s",
                "family_id": family_id,
                "type": video_type,
                "vector": embedding,
                # Extra metadata stored alongside
                "video_id": video_id,
                "timestamp": ts,
                "frame_index": i,
            })

        # Index into LanceDB video_slices table
        indexed = store.insert_video_slices(documents)
        logger.info("Indexed %d slices for video %s", indexed, video_id)

        return {
            "indexed": indexed,
            "video_id": video_id,
            "family_id": family_id,
            "frame_count": len(frames),
        }

    finally:
        # Cleanup temp dir
        shutil.rmtree(temp_dir, ignore_errors=True)
