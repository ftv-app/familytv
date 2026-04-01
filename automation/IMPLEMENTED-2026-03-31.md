# Automation Implemented: 2026-03-31

## What Was Automated

**Pre-commit hook to protect critical files from accidental deletion**

## Problem

- 2026-03-30: `middleware.ts` was accidentally deleted
- No pre-commit hook existed to prevent this
- Deleting critical files breaks builds and CI

## Solution

Created `.git/hooks/pre-commit` that blocks commits attempting to delete:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/template.tsx`
- `middleware.ts`
- `next.config.ts`
- `vitest.config.ts`
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

## How It Works

1. Hook runs before every `git commit`
2. Checks staged files for deletions (`git diff --cached --diff-filter=D`)
3. If any critical file is being deleted, blocks the commit with error
4. Shows which file was blocked and instructs to use `--no-verify` if intentional

## Usage

```bash
# Normal commit (works if no critical files deleted)
git commit -m "your message"

# If you intentionally need to delete a critical file
git commit --no-verify -m "intentional deletion"
```

## Time Saved

- **Before**: QA subagent spent 6 minutes fixing 49 failing tests caused by middleware.ts deletion
- **After**: Hook prevents deletion in the first place, saving 6+ minutes per incident
- **Frequency**: ~1 accidental deletion per month (based on history)
- **Annual savings**: ~72 minutes + reduced CI reruns

## Files Changed

- `.git/hooks/pre-commit` (created)
- `.git/config` (removed corrupted hooksPath that was set to `--version/_`)
