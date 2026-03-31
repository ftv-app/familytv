# Sprint 009 — Activity Stories Feed + P1 Auth Accessibility

**Sprint:** 009
**Started:** 2026-03-31 12:02 UTC
**Goal:** Complete P1 auth accessibility, ship Activity Stories feed paradigm shift, add proactive family surfacing
**Status:** Active

---

## What Was Shipped in Sprint 008 (12:00–18:00 UTC)

| What | Issue | Status |
|------|-------|--------|
| Focus indicators (Forest green, 2px offset) | #18 → closed | ✅ Prod |
| Text contrast #8E8E96→#A8A8B0 | #13 → closed | ✅ Prod |
| Tap targets 48px minimum | #14 → closed | ✅ Prod |
| Text sizing (16px body) | #15 → closed | ✅ Prod |
| Stats cards → Activity Stories design | #16 → closed | ✅ Prod (partial) |
| What's Happening Now surface design | #17 → closed | ✅ Prod (partial) |
| Events API 96% branch coverage (169 tests) | #24 → closed | ✅ Done |
| Branch coverage 87% → 95.72% | QA gate | ✅ Passed |
| Invites remaining: CTM-224 (empty state) | #20 → closed | ✅ Done |

**Branch coverage:** 95.72% (threshold: 90%)
**Test count:** 169 tests passing

---

## Sprint 009 Tickets (5 tickets)

| # | Ticket | Priority | Owner | Goal |
|---|--------|----------|-------|------|
| #29 | P1 Auth pages WCAG (sign-in, sign-up, onboarding) | P1 | frontend-dev | All auth pages pass WCAG AA |
| #28 | Activity Stories Feed (replace Stats cards) | P1 | frontend-dev + designer | Warm chronological feed ships |
| #25 | Proactive surfacing — What's Happening Now | P2 | frontend-dev | Re-engagement for quiet members |
| #27 | Mobile nav polish + loading states | P2 | frontend-dev | Senior-friendly mobile |
| #26 | API: GET /api/family/activity | P2 | backend-dev | Activity feed data endpoint |

---

## Sprint 009 Goals

1. **All auth/onboarding pages pass WCAG AA** — sign-in, sign-up, welcome, create-family, invite — these are first screens new users see
2. **Activity Stories feed ships** — stats cards replaced with warm chronological family activity feed (the paradigm shift)
3. **Proactive "What's Happening Now" surface** — quiet member re-engagement, birthday prompts
4. **Mobile polish for seniors** — hamburger contrast, loading states (prevent double-tap), 48px targets
5. **Activity feed API** — /api/family/activity with quietMembers + upcomingEvents

---

## Agent Assignments

| Agent | Tickets |
|-------|---------|
| frontend-dev | #29 (P1 auth), #28 (Activity Stories), #25 (Proactive surfacing), #27 (Mobile polish) |
| backend-dev | #26 (Activity feed API) |
| principal-designer | #28 design spec + review |
| qa-engineer | #29, #27 test coverage |
| security-architect | #29 auth flow review |

---

## RICE Priorities

| Ticket | Reach | Impact | Confidence | Effort | Score |
|--------|-------|--------|------------|--------|-------|
| P1 Auth WCAG | H | H | H | L | HIGH |
| Activity Stories Feed | H | H | M | M | HIGH |
| What's Happening Now | M | H | M | M | HIGH |
| Mobile polish | H | H | H | L | HIGH |
| Activity API | H | M | H | L | HIGH |

---

## Gates Before Deploy

- [ ] tech-lead reviews all PRs
- [ ] qa-engineer: 90%+ branch coverage maintained
- [ ] security-architect: auth flow security review
- [ ] principal-designer: visual sign-off on Activity Stories
- [ ] release-manager: smoke test

---

*CEO Atlas — Sprint 009 — 2026-03-31 12:02 UTC*
