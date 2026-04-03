# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
# Use uv for fast Python package installs.

FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Pre-install Python dependencies into a virtualenv
COPY requirements.txt .
RUN uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install --no-cache-dir -r requirements.txt

# Download the sentence-transformers model cache
# This is done here so it doesn't re-download on every container start
ENV TRANSFORMERS_CACHE=/app/model_cache
RUN . /opt/venv/bin/activate && \
    python -c "from sentence_transformers import SentenceTransformer; \
               SentenceTransformer('BAAI/bge-small-en-v1.5')"


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────

FROM python:3.12-slim AS runtime

# Security: run as non-root
RUN groupadd --gid 1000 appgroup && \
    useradd  --uid 1000 --gid appgroup --shell /bin/bash appuser

WORKDIR /app

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/model_cache /app/model_cache

ENV PATH="/opt/venv/bin:$PATH" \
    TRANSFORMERS_CACHE="/app/model_cache" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy source code
COPY src/ ./src/

# Switch to non-root user
USER appuser

# Default env vars (can be overridden at runtime)
ENV MODEL_NAME="BAAI/bge-small-en-v1.5" \
    LANCE_DB_PATH="/tmp/familytv_vectors" \
    PORT=8080 \
    HOST=0.0.0.0 \
    LOG_LEVEL=info

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8080/health').raise_for_status()"

# Run with uvicorn (single worker; model is pre-loaded via lifespan)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
