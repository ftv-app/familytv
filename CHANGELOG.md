# Changelog

All notable family-shared moments and platform improvements land here.

## [Unreleased] — 2026-04-03

### Added
- **Watch Party** — real-time in-timeline chat via Socket.IO, fully responsive on mobile (PR #35)
- **"What's Happening Now"** — smart ranking backend spec landed; feed freshness on the roadmap
- **Activity Stories Feed redesign** — warm polaroid aesthetic for post cards (CTM-37)
- **Empty state CTAs** — friendly first-run prompts help new families get oriented (CTM-40)

### Fixed
- **Invite validation** — O(n) → O(1) lookup, DoS attack vector eliminated (CTM-219)
- **Deploy gate restored** — `json-summary` Vitest reporter re-enabled, CI unblocked (CTM-36)
- **14 pre-existing test failures resolved** — test infrastructure scaffolded, 97% coverage (CTM-212)

### Changed
- **Embedding search wired into family feed** — SearchBar + SearchResults now surface in the main feed
- **Private semantic search** — embedding microservice powers private, contextual search across your family's content
- **Video embedding Phase 1** — CLIP model + 5s key frame extraction pipeline active
