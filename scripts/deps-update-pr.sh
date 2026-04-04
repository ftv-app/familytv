#!/bin/bash
# scripts/deps-update-pr.sh — Update all deps and open a PR automatically
# Usage: ./scripts/deps-update-pr.sh [--dry-run]
#
# What it does:
#   1. Checks for outdated packages via npm-check-updates
#   2. If updates exist and not --dry-run:
#      a. Upgrades package.json
#      b. Runs `npm install` to lock
#      c. Runs `make ci` to verify nothing broke
#      d. Commits with conventional message
#      e. Opens a GitHub PR via gh CLI
#   3. If --dry-run: just prints what would change
#
# Requires: gh CLI authenticated (`gh auth status`)
# Exit codes: 0 = success, 1 = nothing to update, 2 = CI failed, 3 = not authenticated

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 Dry run mode — no changes will be made"
fi

echo "=== Dependency Update PR ==="
echo "Started: $(date -u '+%Y-%m-%d %H:%M UTC')"

# Check gh CLI auth
if ! gh auth status &>/dev/null; then
  echo "❌ gh CLI is not authenticated. Run 'gh auth login' first."
  echo "   Falling back to commit-only (no PR will be created)."
  GH_AUTH=false
else
  GH_AUTH=true
fi

# Check for outdated packages
echo "🔍 Checking for outdated packages..."
UPDATES=$(npx npm-check-updates --upgrade --upgradeAll --packageFile package.json 2>&1) || true
echo "$UPDATES"

# Detect if there are actual updates (npm-check-updates exits 0 with "All dependencies are already up-to-date")
if echo "$UPDATES" | grep -qE "^\[INFO\] (0 packages|System)"; then
  echo "✅ All dependencies are already up-to-date — nothing to do."
  exit 0
fi

if $DRY_RUN; then
  echo "✅ Dry run complete — would have updated the above packages."
  exit 0
fi

# Apply updates
echo "📦 Applying updates..."
npx npm-check-updates --upgrade --upgradeAll --packageFile package.json

# Install to update lock file
echo "🔒 Running npm install..."
npm install

# Verify build + tests still pass
echo "🧪 Running CI pipeline..."
if ! npm run build &>/dev/null; then
  echo "❌ Build failed after update — rolling back."
  git checkout package.json package-lock.json
  exit 2
fi

if ! npm run test &>/dev/null; then
  echo "❌ Tests failed after update — rolling back."
  git checkout package.json package-lock.json
  exit 2
fi

# Commit
git add package.json package-lock.json
if ! git diff --staged --quiet; then
  git commit -m "chore(deps): update dependencies

Updated via scripts/deps-update-pr.sh
$(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "✅ Committed: $(git log -1 --oneline)"
else
  echo "⚠️  No changes to commit (packages already up-to-date after install)."
  exit 0
fi

# Open PR
if $GH_AUTH; then
  echo "🚀 Opening GitHub PR..."
  PR_URL=$(gh pr create \
    --title "chore(deps): update dependencies $(date -u '+%Y-%m-%d')" \
    --body "## Dependency Update

Automated dependency update run on $(date -u '+%Y-%m-%d %H:%M UTC').

### What changed
$(echo "$UPDATES" | grep -E "^\[INFO\]|^\[UPGRADE\]" | head -30)

### CI Status
- Build: ✅ Passed
- Tests: ✅ Passed

---
*This PR was created automatically by scripts/deps-update-pr.sh*" \
    --label "dependencies" \
    --label "automated" \
    --assignee @me \
    2>&1) || true

  if [[ "$PR_URL" =~ ^https:// ]]; then
    echo "✅ PR created: $PR_URL"
  else
    echo "⚠️  PR URL not detected — check https://github.com/ftv-app/familytv/pulls"
  fi
else
  echo "⚠️  gh not authenticated — commit created but no PR opened."
  echo "   Push and create PR manually, or run 'gh auth login'."
fi

echo "=== Done: $(date -u '+%Y-%m-%d %H:%M UTC') ==="
