# Automation TODO

## Priority 2: Auto-Sync Unpushed Commits

### Problem
- 2026-03-31: 3 unpushed commits on familytv/ not synced to origin
- Commits sitting locally risk being lost
- Creates divergence between local and remote branches

### Proposed Solution
GitHub Action that runs on push to `main`:
1. Check if local branch is ahead of remote
2. If so, automatically push to origin
3. Send notification (Slack/Telegram) if push fails

### Implementation Spec

```yaml
# .github/workflows/auto-sync.yml
name: Auto-sync unpushed commits

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GH_TOKEN }}
      
      - name: Check unpushed commits
        id: check
        run: |
          UPSTREAM=origin/${{ github.ref_name }}
          LOCAL=$(git rev-parse @)
          REMOTE=$(git rev-parse "$UPSTREAM")
          if [ "$LOCAL" != "$REMOTE" ]; then
            echo "unpushed=true" >> $GITHUB_OUTPUT
            git push
          fi
```

### Time Saved
- Manual: ~2 min per occurrence (git push)
- Automation: 0 min, runs automatically
- Frequency: ~3x/week average

---

## Priority 3: Auto-Fix Common Test Failures

### Problem
- 2026-03-30: 49 tests failed, QA subagent fixed them in 6 minutes
- Many test failures are repetitive (missing Suspense boundaries, import issues)
- CI takes full run before发现问题

### Proposed Solution
Pre-PR check that auto-fixes known patterns:
1. Missing `use client` directive
2. Missing `Suspense` wrapper for `useSearchParams`
3. Outdated mock data after schema changes
4. Import path typos

### Implementation Spec

```bash
# scripts/auto-fix-tests.sh
#!/bin/bash
set -e

echo "🔧 Checking for common test failures..."

# Fix 1: Add missing Suspense boundaries
grep -r "useSearchParams" src --include="*.tsx" | grep -v Suspense | while read f; do
  echo "⚠️  $f uses useSearchParams without Suspense"
done

# Fix 2: Auto-add 'use client' to components that need it
npx next lint --fix 2>/dev/null || true

# Run tests and capture output
npm run test 2>&1 | tee test-output.txt

# If failures are from known patterns, auto-fix
if grep -q "Suspense" test-output.txt; then
  echo "🔧 Attempting to fix Suspense boundaries..."
  # Add Suspense fixes here
fi
```

### Time Saved
- Manual: 6 min to fix 49 tests
- Automation: ~30 sec automatic fixing + notification
- Frequency: ~1x/week (when regressions occur)

---

## Notes

- These are specs only, not yet implemented
- Auto-sync should use a dedicated service account with minimal permissions
- Auto-fix should have dry-run mode and always notify on changes
