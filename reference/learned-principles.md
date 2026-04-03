# Learned Principles

1. **Quality > Speed** — polished core beats feature-complete mediocrity (Cagan/Ries, confirmed March 2026)
2. **QA subagent works** — fixed 49 failing tests in 6 min; use for test failures
3. **Middleware.ts redundant** in Next.js 16 (proxy.ts handles it); removing fixed deploy
4. **Pre-commit hooks prevent critical file deletion** — hook blocks deletion of middleware.ts, layout.tsx, page.tsx, next.config.ts
5. **SLOs without alerting are wishes** — 99.9% avail + p95 <2s targets exist but no burn alerts active
6. **Push daily** — 3 unpushed commits = drift risk with multiple agents
7. **Synchronized playback is uncontested moat** — no competitor offers Family TV. Ship TV Guide before competitors notice.
8. **data-testid non-negotiable** — every interactive element from day 1
9. **CSP must allow Clerk CDN** — add clerk.accounts.dev and clerk.com explicitly
10. **Private blob = proxy required** — Vercel private blobs return 403 directly; /api/media proxy adds auth
11. **Always deploy after every change** — push + deploy after every commit, no batching
