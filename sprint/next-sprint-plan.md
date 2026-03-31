# Sprint 010 Plan — FamilyTV Sync Clock + Foundations

**Prepared by:** strategist subagent
**Date:** 2026-03-31
**For:** Sprint 010 (follows Sprint 009 which is currently active)
**Focus:** Core sync infrastructure, urgent perf fix, and product quality

---

## Context

Sprint 009 is active with auth WCAG (#29) + Activity Stories (#28) + Activity API (#26) + proactive surfacing (#25) + mobile polish (#27).

**Sprint 010 should ship after 009 closes.** This plan covers the CTM backlog items not yet started.

**Strategic north:** Family TV synchronized playback is the uncontested moat. Everything that makes it robust and production-ready is top priority. Design consistency and quality tooling are force multipliers.

---

## Sprint 010 Priorities

### 1. [CTM-223] Server-Authoritative Sync Clock — Agent: **architect / backend-dev**
**Rationale:** This is the heartbeat of Family TV's synchronized playback. The spec lives at `src/lib/family-tv-sync.md`. Server-authoritative clock eliminates drift between leader/follower clients, directly enabling reliable group watch sessions. This is the highest-leverage item in the backlog — everything else in the sync stack depends on it. Without a trusted clock source, playback sync quality degrades as group size grows. Ship this first; everything else builds on it.
**Dependencies:** None (greenfield). Requires spec review against `family-tv-sync.md`.
**Risk:** Medium — clock sync algorithms are subtle (network jitter, leap seconds, clock skew). Allocate time for edge case testing.

---

### 2. [CTM-220] Fix Invite Validation O(n) Memory — Agent: **backend-dev**
**Rationale:** O(n) memory scaling on invite validation is a production stability risk. As family invite lists grow, the current implementation will exhaust memory and crash. This is marked urgent in the backlog and should be treated as a production hotfix priority. The fix is likely a streaming/chunked approach or a different algorithm (possibly what CTM-215's hash lookup change was trying to address). Once fixed, add regression tests to ensure O(1) behavior.
**Dependencies:** None (can be isolated). The invite flow already has 18 passing tests — extend them.
**Risk:** Low — targeted perf fix, well-scoped.

---

### 3. [CTM-222] Frontend Component Test Infrastructure — Agent: **frontend-dev**
**Rationale:** Unit test coverage is excellent (97%+ branch, 99%+ statements). But there is zero component/integration test coverage on the frontend layer. Playwright is already in the stack — the missing piece is the test scaffolding and patterns. With `data-testid` now mandatory on all interactive elements (learned principle #8), component testing is now practical to add without selector gymnastics. This enables faster iteration and prevents UI regressions before they reach QA.
**Dependencies:** None — greenfield setup. Can start immediately. Coordinate with QA engineer on patterns.
**Risk:** Low — tooling setup, no product logic involved.

---

### 4. [CTM-221] Apply Cinema Black Design System to All Pages — Agent: **frontend-dev + principal-designer**
**Rationale:** Cinema Black is FamilyTV's identity system (black #0D0D0F, velvet red, broadcast gold, film grain). It's been partially applied. Full rollout across all pages ensures brand consistency, reduces cognitive friction for senior users, and signals polish. This is a force-multiplier: every page users see benefits. Designer should audit all pages first, then frontend-dev applies systematically.
**Dependencies:** Design audit (designer). Frontend-dev implements against design tokens already in the codebase.
**Risk:** Low — additive visual changes. Run visual regression tests if infrastructure is ready. Coordinate with Activity Stories work in Sprint 009 to avoid re-work.

---

### 5. [CTM-224] Fix Clerk Dashboard Branding — Agent: **founder** ⏸️
**Rationale:** Small task, massive user-visible impact. The Clerk dashboard currently shows "My Application" instead of "FamilyTV" — first-time family organizers see generic branding during onboarding. Founder must do this manually in Clerk's dashboard settings (no code change needed). Marking as "founder action needed" — should run in parallel with all other sprint work, not block it. Estimated 5 minutes of founder time.
**Dependencies:** Founder access to Clerk dashboard only.
**Risk:** None — pure config change.

---

## Agent Assignments Summary

| Agent | Sprint 010 Tickets |
|-------|-------------------|
| architect / backend-dev | CTM-223 (sync clock), CTM-220 (invite perf) |
| frontend-dev | CTM-222 (test infra), CTM-221 (design system) |
| principal-designer | CTM-221 (design audit first) |
| founder | CTM-224 (Clerk branding — parallel, non-blocking) |
| qa-engineer | CTM-222 test patterns + coverage gates |

---

## Quality Gates (All Apply)

- [ ] 97%+ branch coverage maintained on modified files
- [ ] `data-testid` on all interactive elements added in this sprint
- [ ] "Would I feel proud showing this to my family?" — sign-off on design changes
- [ ] Architect reviews CTM-223 clock sync design before implementation
- [ ] Security architect reviews CTM-220 invite fix

---

## Risks & Notes

- **CTM-223 clock sync** is the highest-risk item in this sprint. Budget extra time for testing edge cases (network partitions, clock skew, concurrent playback start). Consider a simulation test harness.
- **CTM-221 design system** overlaps with Sprint 009's Activity Stories work — designer should coordinate to avoid re-working Sprint 009 pages.
- **CTM-222** might benefit from the `playwright-pro` skill if complex component tests are needed. Check available skills.
- The **CTM-217 / CTM-223** and **CTM-213 / CTM-221** and **CTM-212 / CTM-222** duplicates suggest Linear may have stale cross-references. Clean up after sprint.

---

*Sprint 010 — prepared 2026-03-31 18:03 UTC*
