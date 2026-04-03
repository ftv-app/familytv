# ─── Cloud Run Optimized Dockerfile ──────────────────────────────────────────
# Multi-stage build with:
#   - Model pre-cached at build time (no cold-start download)
#   - uv for fast installs
#   - Non-root user
#   - Gunicorn for multi-worker HTTP handling
#
# Build:
#   gcloud builds submit --tag gcr.io/PROJECT_ID/familytv-embeddings:latest .
#
# Or locally:
#   docker build -f cloudrun/Dockerfile -t familytv-embeddings:cloudrun .

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────

FROM python:3.12-slim AS builder

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install all dependencies (including dev for testing)
COPY requirements.txt .
RUN uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install --no-cache-dir -r requirements.txt

# Pre-download the model into a shared cache dir
# This is embedded in the image so Cloud Run doesn't pay download cost on first request
ENV TRANSFORMERS_CACHE=/app/model_cache \
    HF_HOME=/app/model_cache
RUN . /opt/venv/bin/activate && \
    python -c " \
        from sentence_transformers import SentenceTransformer; \
        SentenceTransformer('BAAI/bge-small-en-v1.5'); \
        print('Model pre-cached successfully')"

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────

FROM python:3.12-slim AS runtime

# Install gunicorn for multi-worker HTTP
RUN apt-get update && apt-get install -y --no-install-recommends \
        gunicorn \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash appuser

WORKDIR /app

# Copy virtualenv and model cache from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/model_cache /app/model_cache

ENV PATH="/opt/venv/bin:$PATH" \
    TRANSFORMERS_CACHE="/app/model_cache" \
    HF_HOME="/app/model_cache" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONOPTIMIZE=1 \
    MODEL_NAME="BAAI/bge-small-en-v1.5" \
    LANCE_DB_PATH="/tmp/familytv_vectors" \
    PORT=8080 \
    HOST=0.0.0.0

# Copy source
COPY src/ ./src/

USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8080/health').raise_for_status()"

# Gunicorn: 2 workers (1 per vCPU), threads=1, timeout=30s
# Model is loaded once per worker via uvicorn lifespan inside gunicorn worker
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "2", \
     "--threads", "1", \
     "--timeout", "30", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "src.main:app"]
