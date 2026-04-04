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
12. **Deploy gates are not suggestions — they block or they don't exist** — CI that sometimes passes when tests fail is worse than no gate (false confidence). Gate must be non-negotiable and self-testing.
13. **Security debt doesn't queue — it compounds** — a deferred security fix is an expanding attack surface, not a scheduled item. Fix known security issues before new feature work begins.
14. **Merged ≠ Deployed** — track production deployment explicitly. Use a release checklist to confirm before declaring a feature "done."
15. **UX walkthroughs are not optional** — 30-min live browser inspection catches bugs that hours of testing miss. Non-negotiable part of every sprint, not a one-time event.
16. **Push to master ≠ problem solved** — for critical pipeline blockers, wait for CI confirmation before marking resolved.
