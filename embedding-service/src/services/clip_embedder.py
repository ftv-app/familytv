"""CLIP-based image embedder for video frames."""

import logging
from pathlib import Path
from typing import Any

import torch
import clip
from PIL import Image

logger = logging.getLogger(__name__)

# Global model cache (loaded once per process)
_model = None
_preprocess = None


def load_clip_model():
    """Load CLIP ViT-B/32 model. Cached after first call."""
    global _model, _preprocess
    if _model is None:
        logger.info("Loading CLIP ViT-B/32 model...")
        _model, _preprocess = clip.load("ViT-B/32", device="cpu")
        logger.info("CLIP model loaded. Device: cpu")
    return _model, _preprocess


def encode_image(image_path: str | Path) -> list[float]:
    """Encode a single image to a CLIP embedding vector.

    Args:
        image_path: Path to image file (PNG, JPG, etc.)

    Returns:
        512-dimensional embedding as list of floats
    """
    model, preprocess = load_clip_model()
    image = Image.open(image_path).convert("RGB")
    image_input = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        # Normalize to unit length (CLIP default)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

    return image_features[0].tolist()


def encode_images_batch(image_paths: list[str | Path]) -> list[list[float]]:
    """Encode multiple images in a single forward pass (more efficient).

    Args:
        image_paths: List of image file paths

    Returns:
        List of 512-dimensional embeddings
    """
    if not image_paths:
        return []

    model, preprocess = load_clip_model()
    images = [Image.open(p).convert("RGB") for p in image_paths]
    inputs = torch.stack([preprocess(img) for img in images])

    with torch.no_grad():
        features = model.encode_image(inputs)
        features = features / features.norm(dim=-1, keepdim=True)

    return [f.tolist() for f in features]
