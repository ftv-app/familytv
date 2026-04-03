# Family TV — Phase 1 MVP Scope

*Owner: Strategy / Engineering | Version: 1.0 | Date: 2026-03-30*

---

## Goal

Prove the core emotional promise: *"watching together feels different."*

If a family can't feel the "togetherness" in Phase 1, nothing else matters. Everything in Phase 1 either serves this goal or is cut.

---

## Phase 1 Feature Scope

### MUST HAVE (Ship It)

1. **Single Family Channel**
   - One "channel" per family — no sub-channels, no channel-up/down
   - The channel is always on when any family member opens the app
   - Default state: last video that was playing, or empty state with "add your first video" prompt

2. **Synchronized Playback — Play/Pause/Seek**
   - WebSocket-based sync of play, pause, and seek events
   - Target: <500ms end-to-end sync latency
   - Server-authoritative playback clock — never trust client-reported position
   - Catch-up mode: if viewer falls >10 seconds behind, offer "Join Live" or "Watch from here"
   - Solo mode: disengage from sync at any time with one tap; rejoin with one tap
   - Skip forward/back 10 seconds synced across all viewers

3. **Now Playing View**
   - Full-screen video player (hero — fills the screen)
   - "Chosen by: [Name]" attribution — always visible, broadcaster is always credited
   - Current playback position / total duration ("12:34 / 4:22:10")
   - "Live" badge when all viewers are at the same position
   - "Watch alone" / "Rejoin live" toggle when in solo mode

4. **Presence Indicators**
   - Real-time list of family members currently watching
   - Show member avatar + name
   - "4 watching now — Sarah, Mike, Lily" footer in the player
   - Update within 2 seconds of someone joining/leaving

5. **Video Upload**
   - Upload videos from phone (web + mobile)
   - Upload from desktop (drag-and-drop)
   - Basic transcoding to web-optimized format (H.264, appropriate resolution)
   - Thumbnail generation
   - Storage: Vercel Blob with family-scoped paths

6. **Invite System**
   - Family admin can invite members by email
   - Invitation link is valid for 7 days
   - Member joins family and is immediately added to the channel
   - No public access — row-level security enforced at DB level (family_id scope)

7. **Web + Mobile Responsive (iOS Safari + Android Chrome)**
   - Web app works on desktop and mobile browsers
   - Mobile-first design: 320px minimum width
   - Touch-optimized player controls (tap center = play/pause, swipe left/right = skip)
   - Desktop: keyboard shortcuts for playback (spacebar = play/pause, arrow keys = skip)

8. **Basic Authentication**
   - Clerk for auth (sign-up, sign-in, session management)
   - Family membership is tied to authenticated user
   - Family-scoped access on all data

---

### Explicitly NOT in Phase 1

These are Phase 2, 3, or 4 features. Do not build them in Phase 1.

| Feature | Deferred To |
|---------|------------|
| TV Guide / Up Next schedule | Phase 2 |
| Program Director (algorithmic schedule) | Phase 2 |
| "Goes on the air immediately" notification for new videos | Phase 2 |
| Sub-channels (Channel 2, 3, etc.) | Phase 3 |
| Channel naming / callsign customization | Phase 3 |
| Picture-in-Picture | Phase 4 |
| Casting to TV (Chromecast, AirPlay) | Phase 4 |
| Background audio playback | Phase 4 |
| Subtitle support | Phase 2+ (backlog) |
| Family calendar integration (Cozi, TimeTree sync) | Phase 2 |
| Multi-household family support | Phase 3 |
| Video length > 10 minutes | Phase 2 |
| 4K / HDR quality | Phase 2 (Premium) |
| Viewing analytics ("who watched what") | Never (privacy) |

---

## Success Metrics — How We Know Phase 1 Worked

### Primary Metric: Emotional Resonance

**Post-session survey** (send after every session ending naturally):
- "It felt like we were watching together" — 5-point scale (Strongly Disagree → Strongly Agree)
- **Target:** >70% of respondents answer "Agree" or "Strongly Agree" after at least one shared session
- **Measurement:** In-app survey triggered when all connected viewers go offline within a 5-minute window

### Secondary Metric: Engagement

- **Average session duration:** Target >15 minutes (shows the channel is sticky, not one-and-done)
- **Videos watched per session:** Target >2 videos (shows browsing behavior, not just watch-one-and-leave)
- **7-day retention of invited members:** Target >50% of invited family members join and watch within 7 days of invitation
- **Solo mode usage:** Track how often solo mode is engaged — high solo usage might indicate sync quality issues or poor UX

### Tertiary Metric: Technical Health

- **Sync latency:** p95 <500ms sustained during active sessions
- **Sync drift incidents:** <5% of sessions require manual resync (>10s desync event)
- **Connection stability:** <2% of sessions end due to connection/WebSocket failures
- **Upload success rate:** >99% of uploads complete without retry

### What Failure Looks Like

If we launch Phase 1 and:
- Survey "togetherness" score is <50% positive → we have the wrong core feature set or wrong first user
- Session duration is <8 minutes → the channel metaphor isn't landing or UX is broken
- <30% of invited members actually join → invite flow is broken or value proposition isn't clear
- Sync latency is regularly >1000ms → infrastructure is insufficient; must fix before Phase 2

---

## Estimated Dev Time

Using **t-shirt sizing** (relative complexity, not calendar time):

| Feature Area | Size | Notes |
|-------------|------|-------|
| Auth (Clerk integration + family model) | M | Standard, well-documented |
| Video upload + transcoding pipeline | L | S3/Vercel Blob integration, media processing |
| WebSocket sync server | XL | Real-time, must be reliable; hardest technical piece |
| Synchronized player (client-side) | L | WebSocket events → player API, catch-up/solo states |
| Now Playing UI | M | Full-screen video + broadcaster attribution + controls |
| Presence indicators | M | WebSocket presence events, avatar list |
| Invite flow + row-level security | M | Auth-gated, family-scoped DB queries |
| Mobile-first responsive layout | L | Touch gestures, PiP-ready foundations (no actual PiP) |
| Basic landing/marketing page | S | Sign-up, value prop, "start your family channel" |

**Overall:** 2 XL items + 3 L items + 4 M items + 1 S item

**T-shirt total:** 2XL, 3L, 4M, 1S — roughly **8-10 weeks** for a 2-person team (1 frontend, 1 backend/fullstack) with focused execution and no major rework.

**With full team (frontend + backend + design + QA):** 5-6 weeks

**Story points alternative** (if team prefers Fibonacci):
- Auth + family model: 8
- Video upload pipeline: 13
- Sync server (WebSocket): 21
- Sync client (player integration): 13
- Now Playing UI: 8
- Presence: 5
- Invite flow + security: 8
- Mobile responsive: 8
- Landing page: 5
- **Total: 89 story points**

At 13 points/week velocity → ~7 weeks

---

## Launch Criteria — What Must Be True Before We Go Live

### Must Pass (Hard Gates)

1. **Sync works with 3+ simultaneous viewers**
   - Test with 3 people in different locations (different ISPs, different time zones ideally)
   - Verify play/pause propagates in <500ms, seek works, catch-up mode works, solo mode works
   - Document results in a test report

2. **No cross-family data leakage**
   - Security architect reviews all DB queries
   - Manual test: attempt to access family A's videos from family B's account
   - Verify all API endpoints require authenticated family membership
   - OWASP Top 10 check on auth flows

3. **Sync latency <500ms sustained**
   - Measure p95 in staging environment with simulated multi-region clients
   - If staging shows >500ms, must resolve before launch

4. **Upload flow works end-to-end**
   - Upload a video from mobile, verify it appears for all family members
   - Play the video in sync with another viewer

5. **Invite flow is frictionless**
   - Send invite, recipient clicks, signs up or logs in, is added to family, sees the channel
   - No broken links, no confusion, no required steps beyond email link → account → channel

### Must Have (Product Ready)

6. **UI is not embarrassing**
   - Principal designer approves the visual design
   - All critical states handled: empty state (no videos), loading, error, offline
   - Mobile touch targets are ≥48px
   - Text is readable on small screens

7. **Auth flow is complete**
   - Sign-up, sign-in, sign-out, password reset all work
   - Session persists across page refreshes and app restarts

8. **Error states are graceful**
   - WebSocket disconnection shows clear "Reconnecting..." state
   - Upload failure shows retry option with clear error message
   - Video playback failure (unsupported format, corrupt file) shows friendly message, not raw error

### Launch Checklist Summary

| Gate | Owner | Pass Criteria |
|------|-------|--------------|
| Multi-viewer sync test | Backend + QA | 3+ viewers, <500ms, all states work |
| Security audit | Security Architect | No cross-family leakage, OWASP clean |
| Latency benchmark | Backend | p95 <500ms in staging |
| Upload E2E test | QA | Upload → transcode → sync play works |
| Invite flow test | QA | Email → account → channel in <5 steps |
| Design review | Principal Designer | Visual design approved |
| Error state audit | QA | All error states handled gracefully |
| Auth smoke test | QA | Sign-up/in/out/password reset work |

---

## Phase 1 Is Done When

1. A family of 4 (2 parents, 2 grandparents) can join, upload videos, and watch them in sync — and the grandparents report "it feels like we're in the same room"
2. The sync server has sustained <500ms p95 across 20+ test sessions with real users
3. The security architect has signed off on the family-scoped data model
4. The principal designer has approved the UI as "good enough to represent FamilyTV publicly"

---

*Next: See [Competitive Moat](./family-tv-moat.md) for how we defend Phase 1 and build lasting advantage.*