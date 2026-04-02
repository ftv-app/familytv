# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars, watch parties. No ads/algorithms. Cinema Black design (Velvet Red #C41E3A, cream #FDF8F3, dark #0D0D0F).

## Active Sprints
- **Sprint 011**: Watch Party social layer (CTM-229-235) — PR #35 merged
- **Sprint 012**: Embedding infrastructure (CTM-242) + Search/Suggestions UI (CTM-243-245)

## Embedding Infrastructure
- Architecture: Vercel + Cloud Run hybrid (Next.js on Vercel → BGE-small/LanceDB on Cloud Run)
- Model: BAAI/bge-small-en-v1.5 (384 dims) via LanceDB native embedder
- Privacy: Zero external data transmission — family content never leaves our stack
- Cloud Run: min-instances=1, 2vCPU/4GB, ~$10-15/month
- Local test: embedding service on localhost:8080 (all endpoints verified ✅)
- Repo: embedding-service/ (Dockerfile, FastAPI, pytest)
- Linear: CTM-242 (embedding infra), CTM-243 (API routes), CTM-244 (search UI), CTM-245 (suggestions UI)
- Docs: research/embeddings.md, research/embedding-hosting.md

## Key Features
- Family TV sync playback: leader/follower, UTC-anchored. Spec: src/lib/family-tv-sync.md
- Watch Party: presence, reactions, chat. Socket.IO 4 + Redis. PRD: research/family-watch-party-prd.md
- Semantic search: hybrid RRF+BM25, family-scoped (family_id enforced on every query)

## Tech Stack
Next.js 16.2.1 + Turbopack | Clerk v7 | Neon Postgres | Vercel Blob | Socket.IO + Redis | LanceDB | Sentry | GitHub Actions

## Quality
Build passes | 820+ unit tests | E2E: landing 9/9, auth 3/3 | Coverage: ~86% (target 97%+)

## Reference Files
- Tech stack & arch: reference/tech-stack.md
- Principles: reference/learned-principles.md
- Security review: research/security-review-family-tv.md (all fixed)
- SLOs: research/family-tv-slos.md
- Design brief: design/family-tv-design-brief.md
- Embeddings: research/embeddings.md, research/embedding-hosting.md

## Known Issues
- CTM-209: Clerk rename (founder action in Clerk dashboard)
- CTM-219: invite O(n)→O(1) (DoS vector, carried from March)
- ~15 test failures in ActivityFeed, WhatsHappeningNow, family-presence, family-activity-filter
- ESLint hangs locally (CI not affected)
- SLO alerting inactive
