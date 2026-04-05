# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars, watch parties. No ads/algorithms. Cinema Black design (Velvet Red #C41E3A, cream #FDF8F3, dark #0D0D0F).

## Active Sprints
- **Sprint 013**: Auth Polish + Accessibility Polish (2026-04-05) — COMPLETE
- **Sprint 012**: Embedding infrastructure (CTM-242-248) — COMPLETE
- **Sprint 011**: Watch Party social layer (CTM-229-235) — COMPLETE

## Embedding Infrastructure
- Architecture: Vercel + Cloud Run hybrid (Next.js on Vercel → BGE-small/LanceDB on Cloud Run)
- Text model: BAAI/bge-small-en-v1.5 (384 dims) via LanceDB native embedder
- Video model: OpenAI CLIP ViT-B/32 (512 dims) for frame embedding
- Privacy: Zero external data transmission — family content never leaves our stack
- Cloud Run: min-instances=1, 2vCPU/4GB, ~$10-15/month
- Local test: embedding service on localhost:8080 (all endpoints verified ✅)
- Repo: embedding-service/ (Dockerfile, FastAPI, pytest)
- Video embedding: ffmpeg extracts key frames (1 per 5s) → CLIP encodes → LanceDB video_slices table
- Separate LanceDB tables: text docs (384-dim) + video_slices (512-dim)

## Linear Tickets
| ID | Title | Status |
|----|-------|--------|
| CTM-242 | Embedding infrastructure | done |
| CTM-243 | Wire embedding service into Next.js API routes | done |
| CTM-244 | Search UI component | done |
| CTM-245 | Suggestions UI — auto-tagging | done |
| CTM-246 | Video embedding pipeline Phase 1 (CLIP + 5s frames) | done |
| CTM-247 | Video Phase 2 — scene detection + multi-frame | todo |
| CTM-248 | Video Phase 3 — VLM captions | todo |
| CTM-238 | Albums UI | done |
| CTM-38 | What's Happening Now — ranked family activity UI | done |

## Key Features
- Family TV sync playback: leader/follower, UTC-anchored
- Watch Party: presence, reactions, chat via Socket.IO 4 + Redis
- Semantic search: hybrid RRF+BM25, family-scoped (family_id enforced)
- Video search: CLIP frame embeddings, 5s key frame sampling, timestamp per result
- Albums: full CRUD UI + API

## Tech Stack
Next.js 16.2.1 + Turbopack | Clerk v7 | Neon Postgres | Vercel Blob | Socket.IO + Redis | LanceDB | Sentry | GitHub Actions

## Quality
Build passes ✅ | Tests: 890 passed, 5 failed (pre-existing invite.test.ts) | Deploy gate: enabled ✅

## Open Issues (Known)
- `invite.test.ts`: 5 failing tests — token field missing in mocks (root-owned file, unfixable by team)
- `src/components/__tests__/`, `src/lib/activity/__tests__/`: root-owned dirs blocking `git checkout -f main`
- `albums` table: restored Apr 4 (was removed in bad merge 88e07bb)
- SLO alerting: inactive

## CTM-219 Invite Validation O(n)→O(1) — UNRESOLVED (3-sprint carry-over)
- **Risk**: DoS vector — attacker creates many invites, slow validation for all users
- **Fix needed**: Add `lookup_hash` (SHA-256) column with UNIQUE index, bcrypt verify after O(1) lookup
- **Status**: NOT DONE — no completion evidence in git log
- Owner: needs assignment

## Embedding Service — Ops
- Service dir: `/home/openclaw/familytv/embedding-service/`
- Venv: `.venv/`, Port: 8080, Host: 0.0.0.0
- Model: BAAI/bge-small-en-v1.5 (384 dims), LanceDB at `/tmp/familytv_vectors`
- Start: `source .venv/bin/activate && nohup python -m uvicorn src.main:app --host 0.0.0.0 --port 8080 >> /tmp/embedding-service.log 2>&1 &`
- Health: `curl http://localhost:8080/health`
- Logs: `/tmp/embedding-service.log`

## Working Credentials
- Clerk dev: srconway0@gmail.com / MikesKey1928! (verified)
- DB: Neon Postgres (familytv vercel project — DATABASE_URL in .env.local)

## Team (Linear)
- **sean conway** (id: 309cc7af-180b-4ea6-981e-275eb952e632) — sole team member, Ctmedia team
