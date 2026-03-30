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
  # Use -L to follow redirects; get final status after all redirects
  local status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "${BASE_URL}${path}" 2>/dev/null)
  # 200 = OK (or final destination after redirect)
  # 307/302 = redirect chain incomplete (should not happen with -L)
  # 401 = Clerk auth required (unauthenticated /dashboard redirects to /sign-in which is OK)
  if [ "$status" = "200" ] || [ "$status" = "401" ] || [ "$status" = "307" ] || [ "$status" = "302" ]; then
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
check_page "/dashboard" "Dashboard (auth-gated, expects redirect to sign-in)"
check_page "/robots.txt" "Robots.txt"
check_page "/sitemap.xml" "Sitemap"
check_page "/tv" "TV Player"

echo ""
if [ $FAILURES -eq 0 ]; then
  echo "✅ All checks passed"
else
  echo "❌ $FAILURES failure(s)"
  echo -e "$RESULTS"
fi

exit $FAILURES
