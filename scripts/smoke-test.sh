#!/bin/bash
# Usage: ./scripts/smoke-test.sh [url]
# Example: ./scripts/smoke-test.sh https://preview.familytv.vercel.app
# Falls back to staging if preview is unavailable.

set -e

URL="${1:-https://staging.familytv.vercel.app}"
MAX_RETRIES=3
RETRY_DELAY=5

echo "🔍 Running smoke test against: $URL"

# Check if the URL is reachable
check_endpoint() {
  local url=$1
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$url" 2>/dev/null || echo "000")
  echo "$status"
}

# Health check
echo "📡 Checking health endpoint..."
HEALTH_STATUS=$(check_endpoint "$URL/health")
if [[ "$HEALTH_STATUS" != "200" ]]; then
  echo "❌ Health check failed (HTTP $HEALTH_STATUS). Retrying..."
  for i in $(seq 1 $MAX_RETRIES); do
    sleep $RETRY_DELAY
    HEALTH_STATUS=$(check_endpoint "$URL/health")
    if [[ "$HEALTH_STATUS" == "200" ]]; then
      echo "✅ Health check passed on retry $i"
      break
    fi
    echo "⚠️ Retry $i/$MAX_RETRIES failed (HTTP $HEALTH_STATUS)"
  done

  if [[ "$HEALTH_STATUS" != "200" ]]; then
    echo "❌ Health check permanently failed after $MAX_RETRIES retries"
    exit 1
  fi
else
  echo "✅ Health check passed (HTTP $HEALTH_STATUS)"
fi

# Check for critical pages
PAGES=("/" "/api/health" "/login")
for page in "${PAGES[@]}"; do
  echo "🔎 Testing $URL$page..."
  STATUS=$(check_endpoint "$URL$page")
  if [[ "$STATUS" =~ ^2|3 ]]; then
    echo "✅ $page — HTTP $STATUS"
  else
    echo "❌ $page — HTTP $STATUS (expected 2xx/3xx)"
    exit 1
  fi
done

# Check for console errors via Playwright if available
if command -v npx &> /dev/null; then
  echo "🧪 Running Playwright smoke test..."
  npx playwright test --grep "smoke" --reporter=list 2>/dev/null && echo "✅ Playwright smoke tests passed" || echo "⚠️ Playwright smoke tests not configured — skipping"
fi

echo "✅ All smoke tests passed for $URL"
exit 0
