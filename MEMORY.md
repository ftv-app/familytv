# FamilyTV — Durable Memory

## Project
FamilyTV: private family social media — photos, videos, calendars. Privacy-first: no ads, no algorithms, no strangers. Differentiator: Cinema Black design + "Family TV" synchronized playback.

## Tech Stack
Next.js 16.2.1 + Turbopack · shadcn/ui v4 + Tailwind CSS v4 · Neon Postgres (raw SQL) · Clerk v7 · Vercel Blob · Vercel Hosting · vitest + Playwright · Sentry

## Credentials (1Password: "FamilyTV Ops")
Linear: lin_api_V1K... | Sentry: sntryu_04d... | Vercel/GitHub/Notion: env vars

## GitHub
`ftv-app/familytv` — USE THIS REPO. The `SeanConway102/FamilyTV` is deleted/inaccessible.

## Design System (Cinema Black)
Cinema Black #0D0D0F · Velvet Red #C41E3A · Broadcast Gold #D4AF37 · Forest #2D5A4A · Cream #FDF8F3 · Theater Charcoal #1A1A1E
Oswald + Source Sans 3 + JetBrains Mono · Film grain (3-5%) · Broadcast-smooth motion

## Major Feature: Family TV (Synchronized Playback)
Leader/follower model, UTC-anchored. Phase 1 MVP: 89 pts / 7-8 wks. Anti-creepy: playback-only + Solo Mode.
Spec: `src/lib/family-tv-sync.md`

## Current Sprint
**Sprint 008 🚀** — focus indicators, mobile hamburger, empty state CTAs, activity stories design, events tests, competitive analysis
**Tests: 188 unit ✅** | Coverage: 99.24% stmts / 97.32% branches (97%+ bar met ✅)
**Sprint 006 ✅** — CTM-204/205/206/207/208/210/213/214/215/216/217/218/219 (13 issues)

## Security (ALL FIXED ✅)
CTM-214: family membership on comments/reactions · CTM-215: invite token plaintext → O(1) hash lookup · CTM-216: bcrypt cost 12 · CTM-218: PII error boundary
Full review: `research/security-review-family-tv.md` + `research/family-tv-slos.md`

## Quality Bar
TDD mandatory · 0 E2E failures · 97% coverage · `data-testid` on all interactive elements · "Would I feel proud showing this to my family?" — if no, doesn't ship

## CLI
`vercel deploy --prod --token=$VERCEL_TOKEN` · `npm test` · `npx playwright test` · `npm run dev`

## Known Issues / Actions Needed
- Clerk Dashboard: rename "My Application" → FamilyTV (CTM-209, founder action)
- ESLint hangs locally (CI catches errors)

## New Today (2026-03-31)
- **Bugs fixed**: sign-in redirect loop, private blob 403, calendar crash, share CTA, CSP blocking Clerk, invite page blank
- **Blob store**: `familytv-store` (iad1), `BLOB_READ_WRITE_TOKEN` live on all environments
- **New route**: `/api/media` — private blob proxy (serves private Vercel Blobs with auth)
- **3 automations shipped**: `deploy-gate.yml` (parallel quality gates), `changelog.yml` (conventional commits → Telegram+Release), `standup.yml` + `standup.sh` (automated standups)
- **Process change**: 97% coverage (raised from 80%), data-testid mandatory on all interactive elements

## Operating Tempo
6-hr sprints · Daily reflection → memory/YYYY-MM-DD.md · Weekly consolidation · Monthly self-assessment

## Learned Principles
1. **Quality > Speed** at our stage — polished core beats feature-complete mediocrity (from Marty Cagan/Eric Ries research, confirmed by founder feedback March 2026)
2. **QA subagent works** — fixed 49 failing tests in 6 minutes; use for test failures going forward
3. **Middleware.ts is redundant** in Next.js 16 (proxy.ts handles it); removing fixed deploy
4. **Pre-commit hooks prevent critical file deletion** — middleware.ts was accidentally deleted March 30; a hook blocks deletion of critical files (middleware.ts, layout.tsx, page.tsx, next.config.ts) before commit. Saved ~6 min per incident.
5. **SLOs without alerting are wishes** — 99.9% availability + p95 < 2s + <0.1% error rate targets exist but no burn alerts are active. Must activate alerting before relying on SLOs.
6. **Push daily — 3 unpushed commits = drift risk** — multiple agents in codebase makes unpushed state dangerous. Daily push is now a team rule.
7. **Synchronized playback is uncontested moat** — no competitor (Google Photos, TimeTree, FamilyWall, Cozi, Cluster) offers anything like Family TV. Window is open now. Ship TV Guide to give it structure before competitors notice.
8. **data-testid is non-negotiable** — every interactive element needs `data-testid` from day 1; adding after the fact blocks PRs and wastes time (2026-03-31, confirmed by E2E selector failures).
9. **CSP must allow Clerk CDN** — `script-src 'self' 'unsafe-eval' 'unsafe-inline'` blocks Clerk JS on private routes. Add `https://*.clerk.accounts.dev https://*.clerk.com` explicitly.
10. **Private blob = private access + proxy** — Vercel private blobs return 403 when accessed directly. Need `/api/media` proxy that adds `Authorization: Bearer` header server-side.

## Key Research Files (in Notion + familytv/research/)
`research/family-tv-prd.md` · `family-tv-phase1.md` · `family-tv-user-stories.md` · `sync-latency-research.md` · `family-tv-positioning.md` · `family-tv-moat.md` · `family-tv-slos.md` · `design/family-tv-design-brief.md`
