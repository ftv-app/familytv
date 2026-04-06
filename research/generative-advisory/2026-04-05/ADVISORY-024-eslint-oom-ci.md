# ADVISORY 024: ESLint OOM crashing CI — all deploy gates failing
**Severity:** P1 | **Generated:** 2026-04-05 | **Time Horizon:** Now

## Signal
- Every CI run on main since ~20:00 UTC Apr 4 is marked FAIL despite code being correct
- Root cause: `npm run lint` exhausts the 3GB heap on ubuntu-latest runner after ~70s
- Local reproduction: `npm run lint` crashes with `FATAL ERROR: Ineffective mark-compacts near heap limit`
- ESLint is processing the full repo including node_modules, build artifacts, and large test directories
- All Changelog and CI jobs failing: last 20+ commits blocked

## Evidence
```
[547050:0x45640000] 71728 ms: Mark-Compact (reduce) 1936.2 (1962.1) -> 1922.8 (1934.9) MB
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----
1: 0x72dece node::OOMErrorHandler(char const*, v8::OOMDetails...)
Aborted (core dumped)
```

## Risk
- Deploy gate is BLOCKED — no code can be deployed to production
- Changelog workflow broken — no release notes being generated
- Sprint 014 (Core Engagement Loop) is at risk before first commit
- Standing merge policy is useless if CI can't pass

## Recommendation
**Fix (in order of effort):**

### Option A — Quickest (XS effort, high impact)
Add `NODE_OPTIONS="--max-old-space-size=6144"` to the CI lint step:
```yaml
- run: NODE_OPTIONS="--max-old-space-size=6144" npm run lint
  continue-on-error: true
```

### Option B — Proper fix (S effort)
Scope ESLint to only `src/` directory in CI, exclude `node_modules`, build, and test fixtures:
```yaml
- run: npx eslint src/app src/components src/lib src/app/api
  continue-on-error: true
```

### Option C — Best long-term (M effort)
Split lint into parallel jobs: API routes, components, lib, test files — each with its own memory budget.

## Status
- [ ] OPEN — needs tech-lead or backend-dev to fix CI config
