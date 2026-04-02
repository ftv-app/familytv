"""FamilyTV Embedding Service — FastAPI application with lifespan management."""

import logging
import os
import sys

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.models import HealthResponse
from src.routers import embed, search
from src.services.embedder import get_embedder
from src.services.vector_store import get_vector_store

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Load model and vector store once at startup; clean up on shutdown."""
    logger.info("FamilyTV Embedding Service starting up...")
    logger.info("  MODEL_NAME    = %s", settings.MODEL_NAME)
    logger.info("  LANCE_DB_PATH = %s", settings.LANCE_DB_PATH)
    logger.info("  MAX_BATCH_SIZE = %d", settings.MAX_BATCH_SIZE)

    # Load embedding model (blocks startup — intentional for warm containers)
    embedder = get_embedder()
    logger.info("Embedding model ready: %s (dim=%d)", embedder.model_name, embedder.dimension)

    # Load (or create) LanceDB store
    vs = get_vector_store()
    logger.info("LanceDB vector store ready. Total vectors: %d", vs.count())

    logger.info("Startup complete. Service is healthy.")
    yield

    # Shutdown: release resources
    logger.info("Shutting down FamilyTV Embedding Service...")
    vs.close()
    logger.info("Shutdown complete.")


# ─── FastAPI App ───────────────────────────────────────────────────────────────


app = FastAPI(
    title="FamilyTV Embedding Service",
    description="BGE-small embedding + LanceDB vector search with family_id scoping",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — restrict in production; open for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(embed.router)
app.include_router(search.router)


# ─── Global exception handler ─────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Never leak stack traces to clients."""
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ─── Health check ─────────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    """Liveness/readiness probe. Used by Cloud Run min-instance warm-up."""
    embedder = get_embedder()
    vs = get_vector_store()
    return HealthResponse(
        status="healthy",
        model=embedder.model_name,
        vector_count=vs.count(),
    )


# ─── Entry point ───────────────────────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL,
        workers=1,  # Single worker; model is shared via lifespan
    )
