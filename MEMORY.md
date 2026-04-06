# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars, watch parties. No ads/algorithms. Cinema Black design (Velvet Red #C41E3A, cream #FDF8F3, dark #0D0D0F).

## Active Sprints
- **Sprint EVE 2026-04-06**: Media Upload + Watch Party Completion — IN PROGRESS (CTM-230 ✅, CTM-239 ✅)
- **Sprint PM 2026-04-06**: Tags + Tailwind + Nav Fixes — COMPLETE ✅
- **Sprint AM 2026-04-06**: Tagging Core + Emoji Alignment — COMPLETE ✅
- **Sprint 014**: Dashboard Warmth + Competitive Intelligence — COMPLETE ✅
- **Sprint 013**: Auth Polish + Accessibility Polish — COMPLETE ✅
- **Sprint 012**: Embedding infrastructure — COMPLETE ✅
- **Sprint 011**: Watch Party social layer — COMPLETE ✅

## CTM-230 Watch Party Presence — SHIPPED ✅ (2026-04-06 EVE)
- Socket.IO + Redis backend: `2af5f62` — RedisPresenceManager, 30s TTL, horizontal-scaling-ready
- Presence UI: `a73c17b` — Clerk auth + family membership check + correct roomId format wired
- Room format: `family:{familyId}:video:{videoId}:session:{sessionId}`
- Redis key pattern: `presence:{roomId}:{oderId}` → JSON user data; `presence:{roomId}` → Redis Set
- Enable Redis adapter: `NEXT_PUBLIC_USE_REDIS_ADAPTER=true` + `REDIS_URL` or `UPSTASH_REDIS_REST_URL`
- Components: PresenceStrip (desktop), PresenceCollapsed (mobile), PresencePopover (mobile)

## CTM-239 Media Upload — BACKEND DONE ✅ (2026-04-06 EVE)
- `POST /api/upload` handler: `72b5dc8` + `9ed4aaa`
- Vercel Blob confirmed present (`BLOB_READ_WRITE_TOKEN` in env)
- Storage path: `{familyId}/{userId}/{timestamp}-{random}.{ext}`, access: private
- Albums integration: albumId column on posts table
- Remaining: `GET /api/media?url=xxx` + `GET /api/albums/:id/media` proxy routes — ⚠️ NOT yet shipped

## CTM-241 Tags Browse — SHIPPED ✅ (2026-04-06 PM)
- `GET /api/tags?familyId=` — family-scoped tag listing with post counts
- `/app/family/[familyId]/tags` — tag grid with click-to-filter-feed
- Tag filter banner in feed: `210e653`
- Components: tag-browse-client.tsx, TagChip, TagInput

## Embedding Infrastructure
- Architecture: Vercel + Cloud Run hybrid (Next.js on Vercel → BGE-small/LanceDB on Cloud Run)
- Text model: BAAI/bge-small-en-v1.5 (384 dims) via LanceDB native embedder
- Video model: OpenAI CLIP ViT-B/32 (512 dims) for frame embedding
- Privacy: Zero external data transmission — family content never leaves our stack
- Cloud Run: min-instances=1, 2vCPU/4GB, ~$10-15/month
- Local test: embedding service on localhost:8080 (all endpoints verified ✅)
- Repo: embedding-service/ (Dockerfile, FastAPI, pytest)

## Linear Tickets (Current)
| ID | Title | Status |
|----|-------|--------|
| CTM-248 | Video Phase 3 — VLM captions | todo — blocked on VLM API credentials |
| CTM-247 | Video Phase 2 — scene detection + multi-frame | todo |
| CTM-239 | Media Upload | done (handler done, proxy routes remaining) |
| CTM-241 | Tags Browse | done |
| CTM-240 | Tagging core | done |
| CTM-38 | What's Happening Now | done |
| CTM-230 | Watch Party Presence | done |

## Tech Stack
Next.js 16.2.1 + Turbopack | Clerk v7 | Neon Postgres | Vercel Blob | Socket.IO 4 + Redis | LanceDB | Sentry | GitHub Actions

## Quality
Build passes ✅ | Tests: 1057/1059 passed (2 root-owned test regressions, not code bugs) | Deploy gate: enabled ✅

## Open Issues (Known)
- `albums` table: restored Apr 4 (was removed in bad merge 88e07bb)
- Albums API (`/api/albums`): 500 on production — data/schema issue
- Settings page: Duplicate "The Conways" entries — data issue
- SLO alerting: inactive
- VLM API: CTM-248 blocked on founder-provided credentials

## CTM-219 Invite Validation O(n)→O(1) — RESOLVED ✅
- **Fix**: `237e1b2` + `9274869` — O(1) hash lookup + secret token required for invite acceptance
- **Verified**: 2026-04-05

## Embedding Service — Ops
- Service dir: `/home/openclaw/familytv/embedding-service/`
- Venv: `.venv/`, Port: 8080, Host: 0.0.0.0
- Model: BAAI/bge-small-en-v1.5 (384 dims), LanceDB at `/tmp/familytv_vectors`
- Start: `source .venv/bin/activate && nohup python -m uvicorn src.main:app --host 0.0.0.0 --port 8080 >> /tmp/embedding-service.log 2>&1 &`
- Health: `curl http://localhost:8080/health`

## Working Credentials
- Clerk dev: srconway0@gmail.com / MikesKey1928! (verified)
- DB: Neon Postgres (familytv vercel project — DATABASE_URL in .env.local)

## Learned Principles (Daily Reviews)
- **Fix tests before building on them.** When a test suite is failing, fix the tests first. Working around failing tests means building on a false foundation.
- **After any merge, run full test suite before declaring done.** Silent test failures after merge mean regressions go undetected.
- **UX walkthroughs are not optional.** A 30-min live inspection catches bugs that hours of testing miss. Non-negotiable part of every sprint.
- **Merged ≠ Deployed.** Track production deployment explicitly. Wait for CI confirmation before closing pipeline tickets.
- **Security tickets unfixed for 3+ sprints need immediate escalation.** Force an owner and deadline or close it.
- **Route hrefs are user-facing behavior.** Every navigation link should be verified against the routing spec at PR review time.
- **Duplicate components eventually produce divergent behavior.** Check for existing similar components before creating new ones.
- **If the tool can't reach it, the process can't trust it.** Deploy gate workflow, smoke-test scripts, and coverage config must be co-located in the same repo as the code.
- **A fix not tested in production is a fix that might break production.** Validate every automation with a real trigger before calling it done.
- **Velocity without CI health is borrowed time.** Known-failing tests are debt that compounds. Assign owner + deadline or close the gap.

## Team (Linear)
- **sean conway** (id: 309cc7af-180b-4ea6-981e-275eb952e632) — sole team member, Ctmedia team
