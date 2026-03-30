#!/bin/bash
# FamilyTV Smoke Test — runs against production
# Checks critical pages load without errors

BASE_URL="${1:-https://familytv.vercel.app}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-8794306096}"
FAILURES=0
RESULTS=""

check_page() {
  local path="$1"
  local name="$2"
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}${path}" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo "✅ $name ($status)"
  else
    echo "❌ $name ($status)"
    FAILURES=$((FAILURES + 1))
    RESULTS="${RESULTS}❌ ${name}: HTTP ${status}\n"
  fi
}

echo "=== FamilyTV Smoke Test — $(date -u '+%Y-%m-%d %H:%M UTC') ==="
echo "Target: $BASE_URL"
echo ""

check_page "/" "Landing page"
check_page "/sign-in" "Sign in"
check_page "/sign-up" "Sign up"
check_page "/onboarding" "Onboarding"
check_page "/dashboard" "Dashboard"
check_page "/robots.txt" "Robots.txt"
check_page "/sitemap.xml" "Sitemap"

echo ""
if [ $FAILURES -eq 0 ]; then
  echo "✅ All checks passed"
else
  echo "❌ $FAILURES failure(s)"
  echo -e "$RESULTS"
fi

exit $FAILURES
