# FamilyTV — Project Memory

## Product
Private family social media. Invite-only, video/image sharing, shared calendars. No ads/algorithms. Cinema Black design.

## Sprint 011 (Active)
Watch Party social layer: CTM-229 WebSocket, CTM-230 presence, CTM-231 chat, CTM-232 reactions, CTM-233 security, CTM-234 E2E, CTM-235 mobile

## Key Features
- Family TV sync playback: leader/follower, UTC-anchored. Spec: src/lib/family-tv-sync.md
- Watch Party: presence, reactions, chat. Socket.IO 4 + Redis. PRD: research/family-watch-party-prd.md

## Quality
188 unit tests | 99.24% stmts / 97.32% branches | 97% bar | TDD mandatory

## Reference Files
- Tech stack & arch: reference/tech-stack.md
- Principles: reference/learned-principles.md
- Security review: research/security-review-family-tv.md (all fixed)
- SLOs: research/family-tv-slos.md
- Design brief: design/family-tv-design-brief.md

## Known Issues
- Clerk rename (CTM-209, founder action) | ESLint hangs locally | SLO alerting inactive
