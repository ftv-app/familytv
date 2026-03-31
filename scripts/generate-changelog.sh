#!/bin/bash
# Usage: ./scripts/generate-changelog.sh [since-tag]
# Example: ./scripts/generate-changelog.sh v1.2.0
# If no tag is provided, uses the previous tag or HEAD~50 as fallback.

set -euo pipefail

SINCE="${1:-$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo HEAD~50)}"
RANGE="${SINCE}..HEAD"

echo "## 🚀 FamilyTV Changelog (${SINCE} → $(git rev-parse --short HEAD))"
echo ""
echo "**Generated:** $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""
echo "### ✨ Features"
git log "$RANGE" --oneline --grep="feat" | sed 's/^/• /' || echo "  None"
echo ""
echo "### 🐛 Fixes"
git log "$RANGE" --oneline --grep="fix" | sed 's/^/• /' || echo "  None"
echo ""
echo "### 🔒 Security"
git log "$RANGE" --oneline --grep="security\|hotfix" | sed 's/^/• /' || echo "  None"
echo ""
echo "### ⚡ Performance"
git log "$RANGE" --oneline --grep="perf\|optimize" | sed 's/^/• /' || echo "  None"
echo ""
echo "### 🔧 Chores"
git log "$RANGE" --oneline --grep="refactor\|chore" | sed 's/^/• /' || echo "  None"
echo ""
echo "---"
echo "Run with: ./scripts/generate-changelog.sh [tag]"
