# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars, watch parties. No ads/algorithms. Cinema Black design (Velvet Red #C41E3A, cream #FDF8F3, dark #0D0D0F).

## Active Sprints
- **Sprint 013**: Watch Party Integration & March Debt Resolution (CTM-231-232, CTM-253-256) — 16h overdue
- **Sprint 012**: Embedding infrastructure (CTM-242-248) — COMPLETE
- **Sprint 011**: Watch Party social layer (CTM-229-235) — COMPLETE (PR #35 merged)

## Embedding Infrastructure
- Architecture: Vercel + Cloud Run hybrid (Next.js on Vercel → BGE-small/LanceDB on Cloud Run)
- Text model: BAAI/bge-small-en-v1.5 (384 dims) via LanceDB native embedder
- Video model: OpenAI CLIP ViT-B/32 (512 dims) for frame embedding
- Privacy: Zero external data transmission — family content never leaves our stack
- Cloud Run: min-instances=1, 2vCPU/4GB, ~$10-15/month
- Local test: embedding service on localhost:8080 (all endpoints verified ✅)
- Repo: embedding-service/ (Dockerfile, FastAPI, pytest)
- Docs: research/embeddings.md, research/embedding-hosting.md, research/video-embedding.md
- Video embedding: ffmpeg extracts key frames (1 per 5s) → CLIP encodes → LanceDB video_slices table
- Separate LanceDB tables: text docs (384-dim auto-embed) + video_slices (512-dim explicit)

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

## Key Features
- Family TV sync playback: leader/follower, UTC-anchored. Spec: src/lib/family-tv-sync.md
- Watch Party: presence, reactions, chat. Socket.IO 4 + Redis. PRD: research/family-watch-party-prd.md
- Semantic search: hybrid RRF+BM25, family-scoped (family_id enforced on every query)
- Video search: CLIP frame embeddings, 5s key frame sampling, timestamp returned per result

## Tech Stack
Next.js 16.2.1 + Turbopack | Clerk v7 | Neon Postgres | Vercel Blob | Socket.IO + Redis | LanceDB | Sentry | GitHub Actions

## Quality
Build passes | E2E: landing 9/9, auth 3/3 | Coverage: ~86% → target 97%+ (CTM-212)

## Sprint Management
**Current Sprint:** Watch Party Integration & March Debt Resolution — 16h overdue
**Sprint 013:** Activity Stories Feed UI + What's Happening Now + Mobile Nav Polish + Empty State CTAs

### Open Tickets (Sprint 013)
| ID | Title | Assignee | Status | Priority | Notes |
|----|-------|----------|--------|----------|-------|
| CTM-231 | Watch Party — Live Chat | — | In Progress | 2 | Blocked by PR #35 |
| CTM-232 | Watch Party — Quick Reactions | — | In Progress | 2 | Blocked by PR #35 |
| CTM-253 | Activity Stories Feed UI | sean conway | Todo | 2 | Design spec ready |
| CTM-254 | Empty State CTAs | sean conway | Todo | 3 | Design spec ready |
| CTM-255 | What's Happening Now — Widget UI | — | Todo | 3 | Spec complete: design/whats-happening-now.md ✅ |
| CTM-256 | Mobile Navigation Polish | sean conway | Todo | 3 | |

### Recently Completed (Sprint 011-012)
| ID | Title | Status |
|----|-------|--------|
| CTM-229 | Watch Party — WebSocket Server | Done |
| CTM-235 | Watch Party — Mobile Responsive Polish | Done |
| CTM-242 | Embedding infrastructure | Done |
| CTM-243 | Wire embedding service into Next.js API routes | Done |
| CTM-244 | Search UI component | Done |
| CTM-245 | Suggestions UI — auto-tagging | Done |
| CTM-246 | Video embedding pipeline Phase 1 (CLIP + 5s frames) | Done |

### Blockers
- CTM-231, CTM-232: Waiting for PR #35 test fixes (qa-engineer working on chat-handler + reaction-handler mocks)
- CTM-255: Cannot start until architect writes design/whats-happening-now.md
- ~15 test failures in ActivityFeed, WhatsHappeningNow, family-presence, family-activity-filter

### Team Members (Linear)
- **sean conway** (id: 309cc7af-180b-4ea6-981e-275eb952e632) — sole team member in Linear team Ctmedia

## CTM-212 Test Infrastructure
Scaffolding added to make it easy to write tests for API routes and components.

**Files created:**
- `src/test/fixtures/index.ts` — `factories` object + named exports for: user, family, membership, post, comment, reaction, invite, familyInvite, calendarEvent, familySyncState
- `src/test/api-helpers.ts` — `apiFetch()`, `createMockAuth()`, `expectStatus()`, `jsonBody()`, `expectJson()`, `insertMembership/insertFamily/insertPost()` for integration tests
- `src/test/component-factories.tsx` — `mockClerkUser()`, `mockUseUserSignedIn/SignedOut()`, `mockFamilyContext()`, `mockPostData()`, `renderWithAuth()`, `renderWithFamily()`, `renderWithAll()`

**CI fix:** Removed `continue-on-error: true` from `.github/workflows/ci.yml` test:coverage step so the 97% threshold actually blocks merges.

**Note:** `component-factories.tsx` uses `jest.fn()` which is vitest-compatible. The 15 pre-existing test failures (WhatsHappeningNow, family-activity-filter, family-presence) are unrelated and tracked separately.

## Known Issues
- ~15 test failures in ActivityFeed, WhatsHappeningNow, family-presence, family-activity-filter (from Sprint 011)
- CTM-209: Clerk rename (founder action in Clerk dashboard)
- Clerk test mode: development mode — E2E tests time out (known infra gap)
- ESLint hangs locally (CI not affected)
- SLO alerting inactive

## CTM-219 Implementation
**P0 Security Fix**: Replaced O(n) invite scan with O(1) hash lookup to mitigate DoS vector.

### Problem
- Old invite validation iterated ALL invites for a family to find a match (O(n))
- Attacker could create many invites, causing slow validation for all users

### Solution
- Added `lookup_hash` column (SHA-256 of invite code) with UNIQUE index
- Invite creation stores both `invite_code_hash` (bcrypt) and `lookup_hash` (SHA-256)
- Validation queries use indexed `lookup_hash` for O(1) lookup, THEN bcrypt verify

### Files Changed
- `src/db/schema.ts`: Added `lookupHash` column + `family_invites_lookup_hash_idx` unique index
- `drizzle/0001_add_lookup_hash_to_family_invites.sql`: Migration with backfill note
- `src/app/api/families/[familyId]/invites/route.ts`: Creates invite with `lookupHash`
- `src/app/api/families/invites/[code]/route.ts`: Validates using O(1) hash lookup
- `src/app/api/families/invites/[code]/accept/route.ts`: Accepts using O(1) hash lookup
- `src/__tests__/api/family-invites.test.ts`: Unit tests for O(1) lookup logic

### Security Notes
- SHA-256 is for INDEX LOOKUP only, not security
- Bcrypt (12 rounds) remains for secure storage
- Lookup hash is useless without the original code (one-way)
- Index is conditional (`WHERE lookup_hash != ''`) to handle edge cases

## Embedding Service — Ops Notes (2026-04-03)
- Service: `/home/openclaw/familytv/embedding-service/`
- Venv: `.venv/` (already gitignored)
- Port: 8080, Host: 0.0.0.0
- Model: BAAI/bge-small-en-v1.5 (384 dims), LanceDB at /tmp/familytv_vectors

### Starting / Restarting
```bash
# Quick start (if not running):
/home/openclaw/familytv/embedding-service/start.sh

# Or manually:
cd /home/openclaw/familytv/embedding-service
source .venv/bin/activate
nohup python -m uvicorn src.main:app --host 0.0.0.0 --port 8080 >> /tmp/embedding-service.log 2>&1 &

# Health check:
curl http://localhost:8080/health
```

### Logs
- `/tmp/embedding-service.log`

### Systemd (production)
```bash
sudo cp /home/openclaw/familytv/embedding-service/familytv-embedding.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now familytv-embedding
# Restart: sudo systemctl restart familytv-embedding
```

### If it dies
The model takes ~10-15s to load at startup. Check `tail -f /tmp/embedding-service.log`.
