# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars, watch parties. No ads/algorithms. Cinema Black design (Velvet Red #C41E3A, cream #FDF8F3, dark #0D0D0F).

## Active Sprints
- **Sprint 011**: Watch Party social layer (CTM-229-235) — PR #35 merged, test failures remain
- **Sprint 012**: Embedding infrastructure (CTM-242) + Search/Suggestions UI (CTM-243-245) + Video (CTM-246-248)

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
Build passes | E2E: landing 9/9, auth 3/3 | Coverage: ~86% (target 97%+)

## Known Issues
- ~15 test failures in ActivityFeed, WhatsHappeningNow, family-presence, family-activity-filter (from Sprint 011)
- CTM-209: Clerk rename (founder action in Clerk dashboard)
- CTM-219: invite O(n)→O(1) (DoS vector, carried from March)
- Clerk test mode: development mode — E2E tests time out (known infra gap)
- ESLint hangs locally (CI not affected)
- SLO alerting inactive
