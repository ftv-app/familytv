# Testing Guide — FamilyTV Embedding Service

This guide covers all curl commands to verify the service works correctly before deployment.

## Prerequisites

```bash
# Build the container
docker build -t familytv-embeddings:latest .

# Start the container
docker run --rm -d --name familytv-embeddings \
  -p 8080:8080 \
  -e MODEL_NAME="BAAI/bge-small-en-v1.5" \
  -e LANCE_DB_PATH="/tmp/familytv_vectors" \
  familytv-embeddings:latest

# Wait for startup (~10–30s for first model download)
sleep 30

# Verify health is ready
curl http://localhost:8080/health
```

Expected health response:
```json
{"status":"healthy","model":"BAAI/bge-small-en-v1.5","vector_count":0}
```

---

## Test 1: Health Check

```bash
curl -s http://localhost:8080/health | python -m json.tool
```

**Expected**: `{"status": "healthy", "model": "BAAI/bge-small-en-v1.5", "vector_count": N}`

---

## Test 2: Embed Single Text

```bash
curl -s -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{"texts": ["hello world"], "family_id": "test_family"}' | python -m json.tool
```

**Expected**: Response with `embeddings` (list of one 384-dim vector), `model`, `dimension`.

---

## Test 3: Embed Multiple Texts

```bash
curl -s -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "sunset at the beach",
      "birthday party with family",
      "kids playing in the garden"
    ],
    "family_id": "test_family"
  }' | python -m json.tool
```

**Expected**: 3 embedding vectors returned, each 384 dimensions.

---

## Test 4: Embed — Missing Family ID (should fail)

```bash
curl -s -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"]}' | python -m json.tool
```

**Expected**: HTTP 422 with validation error.

---

## Test 5: Index Documents

```bash
curl -s -X POST http://localhost:8080/index \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "photo_001", "text": "sunset over the ocean waves", "family_id": "test_family", "type": "photo"},
      {"id": "photo_002", "text": "birthday cake with candles", "family_id": "test_family", "type": "photo"},
      {"id": "video_001", "text": "hiking in the mountains", "family_id": "test_family", "type": "video"}
    ]
  }' | python -m json.tool
```

**Expected**: `{"indexed": 3}`

---

## Test 6: Search — Basic

```bash
curl -s -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ocean sunset",
    "family_id": "test_family",
    "limit": 5
  }' | python -m json.tool
```

**Expected**: `photo_001` appears at or near the top with a high score.

---

## Test 7: Search — Type Filter

```bash
curl -s -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "celebration",
    "family_id": "test_family",
    "limit": 10,
    "type": "photo"
  }' | python -m json.tool
```

**Expected**: All results have `"type": "photo"`.

---

## Test 8: Search — Family Isolation

```bash
# First, index something for family_isolation_a
curl -s -X POST http://localhost:8080/index \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "private_001", "text": "private family financial document", "family_id": "family_isolation_a", "type": "document"}
    ]
  }'

# Now search as family_isolation_b — should return nothing
curl -s -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "private family financial document",
    "family_id": "family_isolation_b",
    "limit": 10
  }' | python -m json.tool
```

**Expected**: `{"results": []}` — family B cannot see family A's data.

---

## Test 9: Search — Missing Family ID (should fail)

```bash
curl -s -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 5}' | python -m json.tool
```

**Expected**: HTTP 422 with validation error.

---

## Test 10: Health — Vector Count Increasing

```bash
# Before indexing
curl -s http://localhost:8080/health

# After indexing 3 items
curl -s -X POST http://localhost:8080/index \
  -H "Content-Type: application/json" \
  -d '{"items": [{"id": "hc_001", "text": "test", "family_id": "hc_family", "type": "photo"}]}'

# After indexing
curl -s http://localhost:8080/health
```

**Expected**: vector_count increases by 1 after indexing.

---

## Test 11: Embed — Deterministic Output

```bash
# Same input should produce identical normalized embeddings
curl -s -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{"texts": ["deterministic test"], "family_id": "det"}' > /tmp/emb1.json

curl -s -X POST http://localhost:8080/embed/ \
  -H "Content-Type: application/json" \
  -d '{"texts": ["deterministic test"], "family_id": "det"}' > /tmp/emb2.json

diff /tmp/emb1.json /tmp/emb2.json && echo "PASS: embeddings are identical"
```

**Expected**: No diff output (embeddings are identical across calls).

---

## Test 12: Large Batch Embedding

```bash
# Generate 50 texts and embed them in one request
python3 -c "
import json, subprocess
texts = [f'batch test document number {i} with some extra words' for i in range(50)]
payload = json.dumps({'texts': texts, 'family_id': 'batch_test'})
result = subprocess.run(['curl', '-s', '-X', 'POST', 'http://localhost:8080/embed/',
    '-H', 'Content-Type: application/json', '-d', payload], capture_output=True, text=True)
data = json.loads(result.stdout)
print(f'Batch of {len(data[\"embeddings\"])} embeddings, dim={len(data[\"embeddings\"][0])}')
print(f'Model: {data[\"model\"]}')
"
```

**Expected**: 50 embeddings, each 384 dimensions, model is BAAI/bge-small-en-v1.5.

---

## Stop Container

```bash
docker stop familytv-embeddings
```

---

## All Tests Summary

| # | Test                          | Command                              | Pass Criteria                        |
|---|-------------------------------|--------------------------------------|--------------------------------------|
| 1 | Health                        | `GET /health`                        | 200, status=healthy                  |
| 2 | Embed single                  | `POST /embed` (1 text)               | 200, 1×384 vector                   |
| 3 | Embed multiple                | `POST /embed` (3 texts)              | 200, 3×384 vectors                   |
| 4 | Embed missing family_id       | `POST /embed` (no family_id)         | 422 validation error                 |
| 5 | Index documents               | `POST /index`                        | 200, indexed=N                       |
| 6 | Search basic                  | `POST /search`                       | 200, results returned                |
| 7 | Search type filter            | `POST /search` with type=            | 200, all types match                 |
| 8 | Family isolation              | Family B searches Family A's data    | Empty results                        |
| 9 | Search missing family_id      | `POST /search` (no family_id)       | 422 validation error                 |
|10 | Health vector count           | Health before/after index            | Count increases                      |
|11 | Embedding determinism         | Same text → same vector              | Identical vectors                    |
|12 | Large batch                   | `POST /embed` (50 texts)             | 50×384 vectors, no crash             |
