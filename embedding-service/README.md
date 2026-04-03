# FamilyTV Embedding Service

BGE-small embedding microservice with LanceDB vector storage. Designed for Cloud Run with warm instances.

## Quick Start

### Local with Docker

```bash
# Build (multi-stage, ~2 GB final image)
docker build -t familytv-embeddings:latest .

# Run
docker run --rm -p 8080:8080 \
  -e MODEL_NAME="BAAI/bge-small-en-v1.5" \
  -e LANCE_DB_PATH="/tmp/familytv_vectors" \
  -e LOG_LEVEL=info \
  familytv-embeddings:latest

# Service starts on http://localhost:8080
# First request will download the model (~130 MB) if not pre-cached in the image.
```

### Local with Docker (pre-cached model, faster startup)

```bash
# Use Dockerfile.local-test which pre-downloads the model at build time
docker build -f Dockerfile.local-test -t familytv-embeddings:local .
docker run --rm -p 8080:8080 familytv-embeddings:local
```

### Local without Docker

```bash
# Requires Python 3.12
pip install -r requirements.txt
MODEL_NAME="BAAI/bge-small-en-v1.5" LANCE_DB_PATH="/tmp/familytv_vectors" \
  uvicorn src.main:app --host 0.0.0.0 --port 8080
```

## Environment Variables

| Variable         | Default                    | Description                            |
|------------------|----------------------------|----------------------------------------|
| `MODEL_NAME`     | `BAAI/bge-small-en-v1.5`  | HuggingFace sentence-transformers model|
| `LANCE_DB_PATH`  | `/tmp/familytv_vectors`   | Path for LanceDB data directory       |
| `PORT`           | `8080`                     | HTTP server port                       |
| `HOST`           | `0.0.0.0`                  | HTTP server bind address               |
| `LOG_LEVEL`      | `info`                     | Logging level (debug, info, warning)   |
| `MAX_BATCH_SIZE` | `32`                       | Max batch size for embedding           |

## API Endpoints

### `GET /health`
Liveness/readiness probe. Returns model name and vector count.

```bash
curl http://localhost:8080/health
```

### `POST /embed`
Embed text(s) into vectors using BGE-small.

```bash
curl -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{"texts": ["sunset at the beach", "birthday party"], "family_id": "f1"}'
```

### `POST /index`
Index documents (auto-embeds text via LanceDB's sentence-transformers integration).

```bash
curl -X POST http://localhost:8080/index \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "photo_123", "text": "kids playing in the garden", "family_id": "f1", "type": "photo"}
    ]
  }'
```

### `POST /search`
Hybrid search (vector + BM25 via RRF fusion), family_id scoped.

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "outdoor fun", "family_id": "f1", "limit": 10}'
```

## Architecture

- **Model**: `BAAI/bge-small-en-v1.5` — 384-dim embeddings, CPU-friendly (~50ms/batch)
- **Vector Store**: LanceDB (embedded, in-process SQLite under the hood)
- **API Framework**: FastAPI + uvicorn
- **Search**: Hybrid — vector similarity + BM25 via Reciprocal Rank Fusion
- **Family Scoping**: Every query filters by `family_id` in LanceDB's WHERE clause
- **Startup**: Model loaded once via FastAPI lifespan; LanceDB table opened once and reused

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests (requires the service to already be running)
pytest tests/ -v

# Or run against a live container
docker run -d --name embed-test -p 8080:8080 familytv-embeddings:latest
pytest tests/ -v --tb=short
docker stop embed-test
```

## Load Testing

```bash
# Install locust
pip install locust

# Run load test (headless, 50 users, 10 spawn/s, 60s)
locust -f scripts/load_test.py --host=http://localhost:8080 \
    --headless -u 50 -r 10 -t 60s --csv=results

# Interactive UI
locust -f scripts/load_test.py --host=http://localhost:8080
```

## Cloud Run Deployment

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/familytv-embeddings:latest .

# Or use the Cloud Run optimized Dockerfile
docker build -f cloudrun/Dockerfile -t gcr.io/PROJECT_ID/familytv-embeddings:latest .
docker push gcr.io/PROJECT_ID/familytv-embeddings:latest

# Deploy to Cloud Run
gcloud run services replace cloudrun/service.yaml

# Or with gcloud CLI
gcloud run deploy familytv-embeddings \
  --image=gcr.io/PROJECT_ID/familytv-embeddings:latest \
  --region=us-central1 \
  --platform=managed \
  --min-instances=1 \
  --max-instances=10 \
  --cpu=2 \
  --memory=4Gi \
  --no-allow-unauthenticated \
  --set-env-vars="MODEL_NAME=BAAI/bge-small-en-v1.5,LANCE_DB_PATH=/tmp/familytv_vectors"
```

## Performance Notes

- **Cold start**: With `min-instances=1` the container stays warm. If `min-instances=0` is used, the first request after idle pays ~10–20s to load the model.
- **Batch embedding**: `POST /embed` accepts up to 100 texts and processes them in a single forward pass. Prefer batching over many single-item requests.
- **Memory**: Model (~130 MB) + LanceDB index loaded once at startup. 4 GB RAM provides headroom for concurrent requests.
- **CPU**: BGE-small runs efficiently on 2 vCPU without GPU. ~50ms per batch of 32 on 2 vCPU.

## Security

- `family_id` is **required** on all `/embed`, `/index`, and `/search` requests. Missing `family_id` returns HTTP 422.
- Every LanceDB query uses a WHERE clause filtering by `family_id`. No cross-family data leakage.
- Container runs as non-root (`appuser`, UID 1000).
- No secrets or credentials in the image (all via env vars or Cloud Run Secret Manager).
