#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FamilyTV Embedding Service — Local Development Script
# Builds the Docker image, runs the container, and runs smoke tests.
#
# Usage:
#   ./scripts/local-dev.sh          # Full run (build + test)
#   ./scripts/local-dev.sh build   # Build only
#   ./scripts/local-dev.sh test    # Test only (container must be running)
#   ./scripts/local-dev.sh clean   # Stop and remove container + images
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

IMAGE_NAME="familytv-embeddings"
IMAGE_TAG="latest"
CONTAINER_NAME="familytv-embeddings-dev"
PORT=8080
MODEL_NAME="${MODEL_NAME:-BAAI/bge-small-en-v1.5}"
LANCE_DB_PATH="${LANCE_DB_PATH:-/tmp/familytv_vectors}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_pass()  { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail()  { echo -e "${RED}[FAIL]${NC} $1"; }

# ── Helpers ───────────────────────────────────────────────────────────────────
wait_for_health() {
    local max_wait=120
    local elapsed=0
    log_info "Waiting for /health endpoint to become available..."
    while true; do
        if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
            log_info "Health endpoint ready after ${elapsed}s"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        if ((elapsed >= max_wait)); then
            log_error "Health endpoint did not become available within ${max_wait}s"
            return 1
        fi
    done
}

cleanup_container() {
    log_info "Stopping and removing container '${CONTAINER_NAME}'..."
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm   "${CONTAINER_NAME}" > /dev/null 2>&1 || true
}

# ── Commands ───────────────────────────────────────────────────────────────────

cmd_build() {
    log_info "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
    docker build \
        --platform linux/amd64 \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        -f Dockerfile \
        .
    log_pass "Image built successfully"
}

cmd_run() {
    cleanup_container
    log_info "Starting container '${CONTAINER_NAME}' on port ${PORT}"
    docker run -d \
        --name "${CONTAINER_NAME}" \
        --platform linux/amd64 \
        -p "${PORT}:8080" \
        -e MODEL_NAME="${MODEL_NAME}" \
        -e LANCE_DB_PATH="${LANCE_DB_PATH}" \
        -e LOG_LEVEL=info \
        "${IMAGE_NAME}:${IMAGE_TAG}"

    log_info "Container started. Model will download on first request if not pre-cached."
    wait_for_health
}

cmd_test() {
    log_info "Running smoke tests against http://localhost:${PORT}"

    local failed=0

    # Test 1: Health
    if curl -sf "http://localhost:${PORT}/health" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='healthy', d; print('model:', d['model'], '| vectors:', d['vector_count'])"; then
        log_pass "GET /health"
    else
        log_fail "GET /health"
        ((failed++))
    fi

    # Test 2: Embed
    if curl -sf -X POST "http://localhost:${PORT}/embed/" \
        -H "Content-Type: application/json" \
        -d '{"texts": ["hello world"], "family_id": "test_family"}' \
        | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['embeddings'])==1; assert len(d['embeddings'][0])==384; print('dimension:', len(d['embeddings'][0]))"; then
        log_pass "POST /embed (single text)"
    else
        log_fail "POST /embed (single text)"
        ((failed++))
    fi

    # Test 3: Index
    if curl -sf -X POST "http://localhost:${PORT}/index" \
        -H "Content-Type: application/json" \
        -d '{"items": [{"id": "smoke_001", "text": "smoke test document", "family_id": "smoke_family", "type": "photo"}]}' \
        | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['indexed']==1; print('indexed:', d['indexed'])"; then
        log_pass "POST /index"
    else
        log_fail "POST /index"
        ((failed++))
    fi

    # Test 4: Search
    if curl -sf -X POST "http://localhost:${PORT}/search" \
        -H "Content-Type: application/json" \
        -d '{"query": "smoke test", "family_id": "smoke_family", "limit": 5}' \
        | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['results'])>=1; assert d['results'][0]['id']=='smoke_001'; print('found:', d['results'][0]['id'])"; then
        log_pass "POST /search (family scoped)"
    else
        log_fail "POST /search (family scoped)"
        ((failed++))
    fi

    # Test 5: Family isolation
    if ! curl -sf -X POST "http://localhost:${PORT}/search" \
        -H "Content-Type: application/json" \
        -d '{"query": "smoke test", "family_id": "wrong_family", "limit": 5}' \
        | python3 -c "import sys,json; d=json.load(sys.stdin); ids=[r['id'] for r in d['results']]; assert 'smoke_001' not in ids; print('no leakage — family isolation works')"; then
        log_pass "POST /search (family isolation)"
    else
        log_fail "POST /search (family isolation — data leaked!)"
        ((failed++))
    fi

    # Test 6: Batch embed
    texts_json=$(python3 -c "import json; print(json.dumps({'texts': [f'batch item {i}' for i in range(10)], 'family_id': 'batch_family'}))")
    if curl -sf -X POST "http://localhost:${PORT}/embed/" \
        -H "Content-Type: application/json" \
        -d "${texts_json}" \
        | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['embeddings'])==10; print('batch: 10 embeddings OK')"; then
        log_pass "POST /embed (batch of 10)"
    else
        log_fail "POST /embed (batch of 10)"
        ((failed++))
    fi

    # Summary
    echo ""
    if ((failed == 0)); then
        log_pass "All smoke tests passed!"
        return 0
    else
        log_error "${failed} test(s) failed"
        return 1
    fi
}

cmd_clean() {
    cleanup_container
    log_info "Removing image '${IMAGE_NAME}:${IMAGE_TAG}'"
    docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null 2>&1 || true
    log_pass "Clean complete"
}

cmd_shell() {
    docker exec -it "${CONTAINER_NAME}" /bin/bash
}

# ── Main ───────────────────────────────────────────────────────────────────────

COMMAND="${1:-all}"

case "${COMMAND}" in
    build)
        cmd_build
        ;;
    run)
        cmd_run
        ;;
    test)
        cmd_test
        ;;
    clean)
        cmd_clean
        ;;
    shell)
        cmd_shell
        ;;
    all)
        cmd_build
        cmd_run
        cmd_test
        echo ""
        log_info "To stop: docker stop ${CONTAINER_NAME}"
        log_info "To re-test: ./scripts/local-dev.sh test"
        log_info "To shell: ./scripts/local-dev.sh shell"
        ;;
    *)
        echo "Usage: $0 {build|run|test|clean|shell|all}"
        exit 1
        ;;
esac
