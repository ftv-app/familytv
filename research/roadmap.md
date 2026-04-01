# FamilyTV Roadmap — 3-Month Rolling Plan
**Updated:** 2026-03-31
**Based on:** Competitive analysis + Sprint velocity
**Current state:** Sprint 009 (in progress) — TV player + Cinema Black just deployed

---

## Context & Velocity Assumptions

- **Sprint cadence:** 2-week sprints
- **Sprint velocity:** ~1 major feature area per sprint (based on Sprint 009 completing TV player + Cinema Black + invite validation + auth middleware)
- **Test health:** 184/188 passing (97.9%) — 4 failing tests are mock setup issues, not product bugs
- **3 unpushed commits** on local branch (pending deploy)
- **Competitive position:** Synchronized video playback is uncontested; window of ~3–6 months before Cluster or others may notice

---

## Roadmap: April – June 2026

### April 2026

#### Sprint 009 (current, ending ~2026-03-31 / 2026-04-07)
**Status:** In progress
**Deliverables (from prior sprint deploy):**
- ✅ TV player with synchronized playback (WebSocket-based)
- ✅ Cinema Black design system (TV mode UI)
- ✅ Invite validation fix
- ✅ Auth middleware
- ⏳ 3 commits unpushed (pending push)

**Next sprint actions:**
- Push unpushed commits
- Fix 4 mock-setup test failures (low effort, high signal)
- Begin Phase 1 cleanup + Phase 2 kickoff

---

#### Sprint 010: Phase 1 Completion + Phase 2 Foundation
**Dates:** ~2026-04-07 – 2026-04-21

**Phase 1 cleanup (must-close):**
- [ ] Broadcaster handoff UX — "I'm choosing next" claim-the-remote flow
- [ ] Solo mode UX — prominent "Watch Alone" toggle with yellow badge
- [ ] Presence indicators — "who's watching now" avatars
- [ ] Catch-up mode — "started X minutes ago" banner + "Join Live" CTA
- [ ] Reconnection flow — yellow banner, silent resume vs. explicit catch-up choice

**Phase 2 foundation:**
- [ ] Up Next queue data model (up to 10 items, family-scoped)
- [ ] POST/PATCH/DELETE endpoints for queue management
- [ ] Frontend: queue drawer component (slide-up panel)

**Tests:** Expand sync + presence test coverage to 200+ tests

---

#### Sprint 011: TV Guide + Scheduling
**Dates:** ~2026-04-21 – 2026-05-05

**TV Guide (Phase 2 core):**
- [ ] TV Guide UI panel — Now Playing + Up Next list (mobile-first, thumb-friendly)
- [ ] "Program Director" algorithm — recently-added, seasonal, variety-enforcement
- [ ] Daily lineup refresh at midnight local time
- [ ] "Goes on the air immediately" toggle (family admin setting) — new videos hit the channel instantly
- [ ] Notification trigger on new video entering the channel

**Scheduling polish:**
- [ ] Scheduled future video posts — queue videos for future play
- [ ] "Added by [Name] (TZ)" timestamp in Guide view

**Tests:** TV Guide flow tests, scheduling rule tests

---

#### Sprint 012: Multi-Channel Architecture + Phase 3 Kickoff
**Dates:** ~2026-05-05 – 2026-05-19

**Multi-channel foundation (Phase 3):**
- [ ] Multi-channel data model (up to 5 channels per family, main channel + sub-channels)
- [ ] Channel subscription model (opt in/out per sub-channel)
- [ ] Channel naming / callsign customization
- [ ] Channel navigation UI — swipe left/right between channels

**Phase 2 completeness:**
- [ ] Per-channel notification settings
- [ ] "Channel surf" gesture (channel up/down)
- [ ] Full TV Guide on desktop + TV-size screens (Oswald font, large channel callsign)

**Tests:** Multi-channel routing tests, subscription change tests

---

### May 2026

#### Sprint 013: Phase 3 — Full Multi-Channel
**Dates:** ~2026-05-19 – 2026-06-02

**Phase 3 feature complete:**
- [ ] Sub-channel creation (admin only, up to 4 sub-channels)
- [ ] Per-channel Up Next queue (each channel has its own schedule)
- [ ] Per-channel broadcaster state (each channel independently synced)
- [ ] "Notify me on [channel name]" per-channel toggle
- [ ] Sub-channel onboarding tooltip for new family members

**Competitive response:** With Cluster not yet in this space and TimeTree retreating, this sprint establishes FamilyTV as *the* family video channel platform before competitors can react.

---

#### Sprint 014: Phase 4 — PiP + Ambient Viewing
**Dates:** ~2026-06-02 – 2026-06-16

**Picture-in-Picture:**
- [ ] PiP window (draggable to any corner, expandable)
- [ ] PiP persists during navigation (calendar, gallery, family roster views)
- [ ] PiP audio muted by default, tap to unmute
- [ ] "Continue in PiP?" prompt when navigating away from TV screen

**Background playback:**
- [ ] Continue audio when phone is locked
- [ ] Lock screen controls (iOS/Android media session)

**Tests:** PiP persistence tests, media session tests

---

#### Sprint 015: Phase 4 — Casting + Polish
**Dates:** ~2026-06-16 – 2026-06-30

**Casting:**
- [ ] Chromecast support (cast button on player)
- [ ] AirPlay support (iOS)
- [ ] Video on big screen, controls on phone (companion mode)

**Polish sprint:**
- [ ] Performance: sync latency target <500ms end-to-end (measure + optimize)
- [ ] Accessibility: captions, screen reader support, font scaling
- [ ] Onboarding: first-time family setup wizard (create channel, invite members)
- [ ] Error states: all failure modes have human-readable messaging

---

## What This Roadmap Doesn't Cover (Future)

These are intentionally deferred beyond June 2026 based on current competitive landscape:

- **Monetization / premium tiers** — competitive landscape (FamilyWall $7.99/mo) shows families will pay. Defer until Phase 1–3 are stable and user base established.
- **Email integration (invites + notifications)** —PRD item, low urgency vs. core viewing experience.
- **Viewing analytics for video creators** — explicitly deferred (anti-surveillance design principle). Revisit only if creators request it.
- **WebRTC peer-to-peer video delivery** — PRD mentions this for media delivery (vs. sync server). Complex; defer beyond Q2.

---

## Competitive Adjustments Made

| Change | Reason |
|--------|--------|
| Prioritized Phase 2 (TV Guide) ahead of Phase 3 (multi-channel) | TimeTree is retreating from family coordination; TV Guide gives sync experience narrative structure that Google Photos cannot match |
| Multi-channel moved from Q2 to Q2/Q3 boundary | Cluster hasn't moved on this yet; no urgency to rush. But watch Cluster Q3. |
| Phase 4 (PiP/casting) pushed to June | Competitive window still open; casting is a differentiator but not the core hook |
| No changes to core sync mechanics | Uncontested space; don't over-engineer prematurely |

---

*Roadmap owner: Strategy. Updated quarterly or when major competitive signals emerge.*
