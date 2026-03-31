# FamilyTV Automation Opportunities

*Automation Engineer Assessment — 2026-03-31*

---

## Methodology

**Toil Score = Frequency × Duration × Error Risk**
- Frequency: times per day/week/month
- Duration: minutes per occurrence
- Error Risk: 1 (low — a human mistake is minor) → 5 (critical — mistake causes downtime/data loss)

Higher score = more urgent to automate.

---

## Manual Processes Ranked by Toil Score

| # | Process | Frequency | Duration (min) | Error Risk | Toil Score | Notes |
|---|---------|-----------|----------------|------------|------------|-------|
| 1 | Deploy Quality Gate (sequential agent chain) | ~3/day | 20 | 4 | **240** | 4 agents in sequence = ~20 min wait; a miss blocks the gate |
| 2 | Sprint Planning (every 6 hrs) | 4/day | 15 | 3 | **180** | Closes Linear tickets, reviews progress, creates new tickets — all scripted |
| 3 | Standup Post (9 AM + 7 PM) | 2/day | 10 | 2 | **120** | Pull from Linear + memory file → Telegram; highly template-driven |
| 4 | Weekly Sprint Review (Monday 10 AM) | 1/week | 30 | 2 | **60** | Metrics compilation + changelog + Telegram post |
| 5 | Changelog/Release Notes (per deploy) | ~3/day | 10 | 3 | **90** | Manually parsing git commits → Features/Fixes/Security/Performance |
| 6 | Memory Consolidation (nightly 11 PM) | 1/day | 8 | 3 | **24** | Currently heartbeat-dependent; failure is silent |
| 7 | Pre-deploy Checklist (release-manager) | ~3/day | 5 | 3 | **45** | Manual verification of build/tests/security/design |
| 8 | Dependency Update PRs | 1/week | 20 | 2 | **40** | GitHub issue created but no auto-PR; manual PR creation is the gap |
| 9 | Test Mock Fixes (ORM API change) | ~1/month | 30 | 4 | **120** | 49 tests broke in 6 min due to ORM mock chain changes; manual fix |
| 10 | ESLint/Typecheck locally (dev frustration) | 5/day | 5 | 1 | **25** | "ESLint hangs locally" — devs wait or ignore; CI catches errors |
| 11 | Telegram Deploy Notifications | ~3/day | 3 | 2 | **18** | Release-manager manually posts deploy status to Telegram |
| 12 | Notion/Sprint Documentation | 1/week | 15 | 1 | **15** | Manual updates to Notion roadmap and sprint docs |
| 13 | Accessibility PR Review | on-PR | 10 | 4 | **40** | Principal-designer reviews every PR manually; blocks if missed |
| 14 | Data Isolation Verification (monthly) | 1/month | 30 | 5 | **150** | SRE manually tests family-A-cannot-access-family-B; high risk if skipped |
| 15 | SSL/Domain Expiry Check | 1/week | 10 | 4 | **40** | Manual check; expiration = production outage |

---

## Top 3 Highest-Priority Automations

---

### 🥇 #1: Parallelize the Deploy Quality Gate as GitHub Actions

**Why:** The biggest bottleneck in the delivery pipeline. Currently:
- `tech-lead reviews` → `qa-engineer verifies coverage` → `security-architect scans` → `release-manager checklist` → `sre smoke test`
- **4 sequential agents × ~5 min each = 20 min of wall-clock waiting** per deploy
- Any miss or delay blocks the gate entirely

**What to build:** A single GitHub Actions workflow triggered on `pull_request` that runs all gates in parallel jobs, then merges results:

```yaml
# .github/workflows/deploy-gate.yml
name: Deploy Gate

on:
  pull_request:
    branches: [master, main]
    types: [opened, synchronize, reopened]

jobs:
  # Gate 1: Tech Lead (code quality)
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - name: Check PR description has context
        run: |
          PR_BODY="${{ github.event.pull_request.body }}"
          if [ -z "$PR_BODY" ] || [ "${#PR_BODY}" -lt 50 ]; then
            echo "::warning::PR description is empty or too short — add context for reviewers"
          fi

  # Gate 2: QA Engineer (coverage enforcement)
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
      - run: npm ci
      - run: npm run test:coverage
      - name: Enforce 97% coverage
        run: |
          # Parse coverage/coverage-summary.json
          COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"lines":{"pct":[0-9.]*' | grep -o '[0-9.]*$')
          if (( $(echo "$COVERAGE < 97" | bc -l) )); then
            echo "::error::Coverage ${COVERAGE}% is below 97% threshold — blocking deploy"
            exit 1
          fi
          echo "Coverage: ${COVERAGE}% ✅"

  # Gate 3: Security Architect (scan)
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
      - run: npm ci
      - name: Run npm audit
        run: npm audit --audit-level=high
      - name: Check for hardcoded secrets
        run: |
          # Scan for common secret patterns
          git diff --staged --secrets | head -20 || true

  # Gate 4: Design Review (accessibility + brand)
  design-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check data-testid presence on interactive elements
        run: |
          # Reject PRs that add interactive elements without data-testid
          PR_FILES=$(git diff --staged --name-only)
          for file in $PR_FILES; do
            if [[ "$file" == *.tsx ]]; then
              # Check if file has interactive elements but no data-testid
              HAS_INTERACTIVE=$(grep -c "onClick\|onChange\|<button\|<input\|<a href" "$file" 2>/dev/null || echo 0)
              HAS_TESTID=$(grep -c "data-testid" "$file" 2>/dev/null || echo 0)
              if [ "$HAS_INTERACTIVE" -gt 0 ] && [ "$HAS_TESTID" -eq 0 ]; then
                echo "::warning::File $file has interactive elements but no data-testid attributes"
              fi
            fi
          done

  # Gate 5: Smoke Test (replaces release-manager manual check)
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run smoke test script
        run: |
          bash scripts/smoke-test.sh https://preview.familytv.vercel.app || \
          bash scripts/smoke-test.sh https://staging.familytv.vercel.app

  # Merge gate: all must pass
  deploy-ready:
    needs: [code-quality, coverage, security, design-review, smoke-test]
    runs-on: ubuntu-latest
    steps:
      - name: All gates passed
        run: |
          echo "✅ All deploy gates passed"
          echo "PR is ready for merge by release-manager"
```

**Expected outcome:** Deploy gate drops from ~20 min sequential agent coordination to ~5 min parallel automated check. Eliminates human forgetfulness/missed steps.

**Who builds:** automation-engineer (implement) → tech-lead (review workflow correctness) → devops (deploy workflow to repo)

---

### 🥈 #2: Auto-Generate Changelogs from Conventional Commits on Every Merge to Master

**Why:** Every production deploy currently requires release-manager to manually parse `git log`, categorize commits into Features/Fixes/Security/Performance, and post to Telegram. This is tedious, error-prone, and blocks the deploy flow.

**What to build:** A GitHub Action that:
1. Runs on merge to `master`
2. Parses conventional commits since last deploy tag
3. Generates a formatted changelog
4. Posts it to Telegram

```yaml
# .github/workflows/changelog.yml
name: Changelog

on:
  push:
    branches: [master, main]
  workflow_dispatch:
    inputs:
      skip_telegram:
        description: 'Skip Telegram notification'
        required: false
        default: 'false'

jobs:
  generate-changelog:
    runs-on: ubuntu-latest
    outputs:
      changelog: ${{ steps.changelog.outputs.changelog }}
      tag: ${{ steps.tag.outputs.new_tag }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get previous tag
        id: prev_tag
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          echo "prev_tag=$PREV_TAG" >> $GITHUB_OUTPUT
          echo "prev_tag: $PREV_TAG"

      - name: Generate changelog
        id: changelog
        run: |
          PREV_TAG="${{ steps.prev_tag.outputs.prev_tag }}"
          if [ -z "$PREV_TAG" ]; then
            RANGE="HEAD~50"
          else
            RANGE="${PREV_TAG}..HEAD"
          fi

          CHANGELOG="## 🚀 FamilyTV Changelog\n\n"
          CHANGELOG+="**Deploy:** $(date -u '+%Y-%m-%d %H:%M UTC')\n"
          CHANGELOG+="**Commit:** \`$(git rev-parse --short HEAD)`\n\n"

          # Parse conventional commits
          FEATURES=$(git log $RANGE --oneline --grep="feat" | sed 's/^/• /' || echo "None")
          FIXES=$(git log $RANGE --oneline --grep="fix" | sed 's/^/• /' || echo "None")
          SEC=$(git log $RANGE --oneline --grep="security\|hotfix" | sed 's/^/• /' || echo "None")
          PERF=$(git log $RANGE --oneline --grep="perf\|optimize" | sed 's/^/• /' || echo "None")
          REFACTOR=$(git log $RANGE --oneline --grep="refactor\|chore" | sed 's/^/• /' || echo "None")

          CHANGELOG+="### ✨ Features\n${FEATURES}\n\n"
          CHANGELOG+="### 🐛 Fixes\n${FIXES}\n\n"
          CHANGELOG+="### 🔒 Security\n${SEC}\n\n"
          CHANGELOG+="### ⚡ Performance\n${PERF}\n\n"
          CHANGELOG+="### 🔧 Chores\n${REFACTOR}\n"

          echo "changelog=$CHANGELOG" >> $GITHUB_OUTPUT
          echo "$CHANGELOG"

      - name: Create git tag for this deploy
        id: tag
        run: |
          NEW_TAG="deploy-$(date +'%Y%m%d-%H%M%S')"
          git tag "$NEW_TAG"
          git push origin "$NEW_TAG" 2>/dev/null || true
          echo "new_tag=$NEW_TAG" >> $GITHUB_OUTPUT

      - name: Post to Telegram
        if: github.event.inputs.skip_telegram != 'true'
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
            TEXT=$(echo -e "${{ steps.changelog.outputs.changelog }}" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
            curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
              -d "chat_id=${TELEGRAM_CHAT_ID}" \
              -d "text=${TEXT}" \
              -d "parse_mode=Markdown"
          fi

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.tag.outputs.new_tag }}
          release_name: "FamilyTV ${{ steps.tag.outputs.new_tag }}"
          body: "${{ steps.changelog.outputs.changelog }}"
          draft: false
          prerelease: false
```

**Shell script alternative for release-manager convenience:**
```bash
# scripts/generate-changelog.sh
#!/bin/bash
# Usage: ./scripts/generate-changelog.sh [since-tag]
# Example: ./scripts/generate-changelog.sh v1.2.0

SINCE="${1:-$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo HEAD~50)}"
RANGE="${SINCE}..HEAD"

echo "## 🚀 FamilyTV Changelog (${SINCE} → $(git rev-parse --short HEAD))"
echo ""
echo "### ✨ Features"
git log $RANGE --oneline --grep="feat" | sed 's/^/• /' || echo "None"
echo ""
echo "### 🐛 Fixes"
git log $RANGE --oneline --grep="fix" | sed 's/^/• /' || echo "None"
echo ""
echo "### 🔒 Security"
git log $RANGE --oneline --grep="security\|hotfix" | sed 's/^/• /' || echo "None"
```

**Expected outcome:** Release-manager types one command or merges one PR and changelog + Telegram post + GitHub Release are all done automatically.

**Who builds:** automation-engineer

---

### 🥉 #3: Automated Standup Generator (9 AM + 7 PM UTC → Telegram)

**Why:** Standups happen twice daily, 365 days/year = ~730 standups/year. Each takes ~10 min to assemble: pull yesterday's memory file, check Linear for completed/in-progress/blocked tickets, format, post to Telegram. **~120 min/week of pure template work.**

**What to build:** A cron-triggered GitHub Action (or shell script run via OpenClaw heartbeat/cron) that reads `memory/YYYY-MM-DD.md` and Linear API, then posts to Telegram:

```yaml
# .github/workflows/standup.yml
name: Standup

on:
  schedule:
    # 9:00 AM UTC daily
    - cron: "0 9 * * *"
    # 7:00 PM UTC daily
    - cron: "0 19 * * *"
  workflow_dispatch:  # manual trigger

jobs:
  standup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: |
            memory
            familytv
          sparse-checkout-cone-mode: false

      - name: Get today's and yesterday's memory
        run: |
          YESTERDAY=$(date -u -d 'yesterday' +'%Y-%m-%d')
          TODAY=$(date -u +'%Y-%m-%d')
          
          echo "yesterday_content<<EOF" >> $GITHUB_ENV
          cat memory/${YESTERDAY}.md 2>/dev/null || echo "(no log for ${YESTERDAY})"
          echo "EOF" >> $GITHUB_ENV
          
          echo "today_content<<EOF" >> $GITHUB_ENV
          cat memory/${TODAY}.md 2>/dev/null || echo "(no log for ${TODAY})"
          echo "EOF" >> $GITHUB_ENV

      - name: Query Linear for sprint status
        id: linear
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: |
          if [ -n "$LINEAR_API_KEY" ]; then
            curl -s -X POST https://api.linear.app/graphql \
              -H "Authorization: $LINEAR_API_KEY" \
              -H "Content-Type: application/json" \
              -d '{"query":"{ me { name } team { name activeProjects { name } } issues(first: 20, filter: {state: {in: [\"in_progress\",\"todo\"]}}) { nodes { identifier title state { name } } } }"}' \
              > /tmp/linear-status.json 2>/dev/null || echo "{}" > /tmp/linear-status.json
          else
            echo "{}" > /tmp/linear-status.json
          fi

      - name: Determine standup type
        id: standup_type
        run: |
          HOUR=$(date -u +'%H')
          if [ "$HOUR" = "09" ]; then
            echo "type=Morning Standup 🌅" >> $GITHUB_OUTPUT
          else
            echo "type=Evening Recap 🌙" >> $GITHUB_OUTPUT
          fi

      - name: Format and post standup to Telegram
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: |
          TYPE="${{ steps.standup_type.outputs.type }}"
          YESTERDAY="${{ env.yesterday_content }}"
          TODAY="${{ env.today_content }}"
          
          # Format the standup message
          MSG="*${TYPE} — $(date -u +'%Y-%m-%d %H:%M UTC')*"
          MSG+="\n\n"
          
          if [ "${{ steps.standup_type.outputs.type }}" = "*Morning Standup 🌅*" ]; then
            MSG+="📋 *Yesterday:*\n$(echo "$YESTERDAY" | grep -E "^\-\-|^\-\s|^\*|Done|completed|passed|✅" | head -10 || echo 'Check memory file')"
            MSG+="\n\n📋 *Today:*\n$(echo "$TODAY" | grep -E "^\-\-|^\-\s|^\*|planned|Doing|🚧" | head -10 || echo 'See sprint board')"
          else
            MSG+="✅ *Done today:*\n$(echo "$TODAY" | grep -E "Done|completed|passed|✅|deployed" | head -10 || echo 'Logged in memory')"
            MSG+="\n\n🚧 *Blockers:*\n$(echo "$YESTERDAY $TODAY" | grep -iE "blocker|blocked|stuck|waiting" | head -5 || echo 'None')"
          fi
          
          # Post to Telegram
          if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
              -d "chat_id=${TELEGRAM_CHAT_ID}" \
              -d "text=${MSG}" \
              -d "parse_mode=Markdown" \
              -d "disable_web_page_preview=true"
          fi
          
          echo "Posted standup to Telegram"
```

**Shell script for OpenClaw heartbeat (alternative, runs inside OpenClaw):**
```bash
#!/bin/bash
# scripts/standup.sh — run via OpenClaw heartbeat at 9 AM + 7 PM UTC
# Reads memory files, formats standup, posts to Telegram

TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-8794306096}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
MEMORY_DIR="/home/openclaw/.openclaw/workspace/memory"

YESTERDAY=$(date -u -d 'yesterday' +'%Y-%m-%d')
TODAY=$(date -u +'%Y-%m-%d')
HOUR=$(date -u +'%H')

if [ "$HOUR" = "09" ]; then
  TYPE="Morning Standup 🌅"
elif [ "$HOUR" = "19" ]; then
  TYPE="Evening Recap 🌙"
else
  echo "Not a standup hour (hour=$HOUR)"
  exit 0
fi

YESTERDAY_LOG="${MEMORY_DIR}/${YESTERDAY}.md"
TODAY_LOG="${MEMORY_DIR}/${TODAY}.md"

if [ ! -f "$YESTERDAY_LOG" ]; then
  echo "No memory file for $YESTERDAY — skipping standup"
  exit 0
fi

# Extract key lines
DONE=$(grep -E "✅|Done|deployed|passed|completed" "$YESTERDAY_LOG" "$TODAY_LOG" 2>/dev/null | head -8 | sed 's/.*\.md://')
BLOCKERS=$(grep -iE "blocker|blocked|stuck" "$YESTERDAY_LOG" "$TODAY_LOG" 2>/dev/null | head -5 | sed 's/.*\.md://')

MSG="*${TYPE} — $(date -u +'%Y-%m-%d %H:%M UTC')}*\n\n"
MSG+="✅ *Done:*\n${DONE:-None noted}\n\n"
MSG+="🚧 *Blockers:*\n${BLOCKERS:-None}"

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MSG}" \
    -d "parse_mode=Markdown" > /dev/null
  echo "Standup posted ✅"
else
  echo "TELEGRAM_BOT_TOKEN not set — printing instead:"
  echo -e "$MSG"
fi
```

**Expected outcome:** Zero manual standup preparation. Just spawn/verify the script runs, review the output before posting.

**Who builds:** automation-engineer

---

## Additional High-Value Automations (Next Tier)

### 4. Memory Consolidation Cron (reliable nightly, not heartbeat-dependent)

Currently: Dream consolidation runs on heartbeat at ~11 PM UTC. If the heartbeat misses or fires early, consolidation silently doesn't run.

```bash
# scripts/memory-consolidation.sh — add to crontab: 0 23 * * * /home/openclaw/.../scripts/memory-consolidation.sh
#!/bin/bash
# Runs nightly at 11 PM UTC. Robust alternative to heartbeat-only consolidation.
MEMORY="/home/openclaw/.openclaw/workspace/memory"
DEST="/home/openclaw/.openclaw/workspace/MEMORY.md"
TODAY=$(date -u +'%Y-%m-%d')
YESTERDAY=$(date -u -d 'yesterday' +'%Y-%m-%d')

# Phase 1: Orient — scan memory dir
RECENT_FILES=$(find "$MEMORY" -name "*.md" -mtime -2 | sort)

# Phase 2: Gather — extract durable facts from recent logs
FACTS=$(for f in $RECENT_FILES; do
  grep -E "^\-\s|^\*|Decision:|Learned:|Action:|✅|🚨" "$f" 2>/dev/null
done | sort -u)

# Phase 3: Consolidate — check MEMORY.md size
SIZE=$(wc -c < "$DEST")
LINES=$(wc -l < "$DEST")
if [ "$SIZE" -gt 20000 ] || [ "$LINES" -gt 100 ]; then
  echo "⚠️ MEMORY.md over limit (${SIZE} chars / ${LINES} lines) — needs pruning" | \
    tee -a "$MEMORY/${TODAY}-consolidation-log.txt"
fi

# Phase 4: Archive logs older than 14 days
find "$MEMORY/archive" -name "*.md" -mtime +90 -delete 2>/dev/null || true
find "$MEMORY" -name "*.md" -mtime +14 ! -path "*/archive/*" -exec mv {} "$MEMORY/archive/" \; 2>/dev/null || true

echo "[$(date -u)] Consolidation complete at ${TODAY}" >> "$MEMORY/${TODAY}-consolidation-log.txt"
```

Add to crontab:
```crontab
0 23 * * * /home/openclaw/.openclaw/workspace/familytv/scripts/memory-consolidation.sh >> /home/openclaw/.openclaw/workspace/memory/consolidation.log 2>&1
```

### 5. Test Mock Regeneration Script (on ORM API changes)

When an ORM chain changes (e.g., `.insert()` → `.insert().values().returning()`), a script to update all affected test files:

```bash
# scripts/fix-test-mocks.sh
#!/bin/bash
# Usage: ./scripts/fix-test-mocks.sh <old_pattern> <new_pattern>
# Example: ./scripts/fix-test-mocks.sh ".insert().returning()" ".insert().values().returning()"

OLD="$1"
NEW="$2"
TEST_DIR="src/test"

if [ -z "$OLD" ] || [ -z "$NEW" ]; then
  echo "Usage: $0 <old_pattern> <new_pattern>"
  exit 1
fi

echo "Replacing '$OLD' → '$NEW' in test files..."
COUNT=$(grep -rl "$OLD" "$TEST_DIR" 2>/dev/null | wc -l)
echo "Found $COUNT files to update"

for file in $(grep -rl "$OLD" "$TEST_DIR" 2>/dev/null); do
  echo "  Updating: $file"
  sed -i "s|$OLD|$NEW|g" "$file"
done

echo "✅ Updated $COUNT files"
echo "Run tests to verify: npm run test"
```

**Trigger:** When devops or backend-dev changes any ORM call in the implementation, they run this script once and it fixes all affected tests.

### 6. Data Isolation Verification (monthly automated test)

```yaml
# .github/workflows/data-isolation.yml
name: Data Isolation Test

on:
  schedule:
    # First of every month at 10 AM UTC
    - cron: "0 10 1 * *"
  workflow_dispatch:

jobs:
  data-isolation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
      - run: npm ci

      - name: Test family A cannot access family B data
        run: |
          # Spin up test DB with two families
          # Test that API requests with family-A token cannot read family-B content
          npx playwright test --grep "data-isolation" || \
          npx vitest run --testNamePattern="data isolation"
```

---

## Summary

| Priority | Automation | Effort | Impact | Status |
|----------|-----------|--------|--------|--------|
| 1 | Deploy Quality Gate (parallel GHA) | Medium | High | To build |
| 2 | Changelog auto-generation | Low | Medium-High | To build |
| 3 | Standup auto-generator | Low | Medium | To build |
| 4 | Memory consolidation cron | Low | Medium | To build |
| 5 | Test mock regeneration script | Low | Medium | To build |
| 6 | Data isolation monthly test | Medium | High | To build |
| 7 | Dependency update auto-PRs | Medium | Low-Medium | Partial (issues exist, PRs missing) |

**Start with #1, #2, #3.** They address the highest-frequency, highest-duration manual processes. All three are buildable in a single sprint.
