# Sprint 007 — AI-First Dashboard Foundation

**Sprint Dates:** 2026-03-31  
**Status:** Planned  
**Owner:** Frontend + Principal Designer  
**Label:** `sprint-007`

---

## Sprint Goal

Fix all P1 accessibility violations (contrast, focus, text sizes, tap targets) while beginning the paradigm shift from an admin-panel dashboard to a warm, proactive Family Companion that surfaces "who did what for whom" — not raw stats.

---

## Priority Order

### Phase 1 — P1 Accessibility (Must Ship, Day 1–2)

| # | Ticket | GitHub Issue | Priority | Effort | Owner |
|---|--------|-------------|----------|--------|-------|
| 1 | Fix text contrast — `#8E8E96` → `#A8A8B0` | [#13](https://github.com/ftv-app/familytv/issues/13) | **urgent** | 2h | frontend |
| 2 | Add visible focus indicators — Forest green outline | [#18](https://github.com/ftv-app/familytv/issues/18) | **urgent** | 3h | frontend |
| 3 | Increase text sizes — 12px→14px, 14px→16px | [#15](https://github.com/ftv-app/familytv/issues/15) | **urgent** | 2h | frontend |
| 4 | Increase tap targets — 44px→48px minimum | [#14](https://github.com/ftv-app/familytv/issues/14) | **urgent** | 2h | frontend |

> **Rationale:** These are hard WCAG failures affecting every user with vision or motor impairment. The UX audit identified them as P1. They are also quick wins — the CEO's brief confirms "these are quick wins." Do them first regardless of paradigm work.

### Phase 2 — Paradigm Shift Foundation (Day 3–5)

| # | Ticket | GitHub Issue | Priority | Effort | Owner |
|---|--------|-------------|----------|--------|-------|
| 5 | Replace Stats cards with Activity Stories feed | [#16](https://github.com/ftv-app/familytv/issues/16) | **medium** | 8–12h | frontend + design |
| 6 | Replace Quick Actions grid with "What's Happening Now" | [#17](https://github.com/ftv-app/familytv/issues/17) | **medium** | 8–12h | frontend + design |

> **Rationale:** These are the CEO's "paradigm shift foundation." Both tickets are parallelizable — one team member builds Activity Stories while another builds What's Happening Now. They share the same warm design language and can be prototyped against the same data shape.

---

## Not in Sprint 007 (Future Sprints)

The following are out of scope for Sprint 007 but are documented for planning:

| Feature | Description | Target Sprint |
|---------|-------------|---------------|
| Emotional Calendar | Birthdays/events surfaced with warmth, not just dates | Sprint 008 |
| Proactive Reminders | Surface content from quiet family members (partial — quiet member prompts in Activity Stories is in scope) | Sprint 007 (partial) |
| Ambient warmth | Dark mode shifts warmer in evening hours (like candlelight) | Sprint 008+ |
| Multi-generational personalization | App adapts layout/text based on user role (grandparent/parent/child) | Sprint 008+ |
| Family TV watch activity surface | "Who's watching what" — proactive surfacing of viewing activity | Sprint 008+ |
| Remove time-based greetings | "Good evening" → "Welcome back" or none | Sprint 007 (partial — addressed in #17) |

---

## Estimated Effort

| Phase | Tickets | Estimated Hours | Notes |
|-------|---------|-----------------|-------|
| Phase 1: P1 Accessibility | 4 tickets | 9h | All are surgical CSS/Tailwind changes |
| Phase 2: Paradigm Shift | 2 tickets | 16–24h | New components, design + dev iteration |
| **Total** | **6 tickets** | **25–33h** | 5-day sprint is feasible |

---

## Blockers

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| **Design spec for Activity Stories** — The ticket describes the direction but needs a pixel-level mockup before Phase 2 dev starts | High | Principal Designer to deliver mockup by end of Day 1. Frontend starts Phase 1 immediately. |
| **API shape unknown** — Activity Stories and What's Happening Now need data: member activity feed, presence data, quiet member detection | Medium | Mock with static data initially; API contract can be defined in parallel. Frontend uses placeholder data. |
| **Tailwind config audit** — Many issues stem from using default shadcn tokens instead of FamilyTV palette | Medium | Run a one-time Tailwind config audit against the design brief color tokens before starting Phase 2 |
| **No accessibility test CI** — Currently no automated WCAG checks in CI | Low | Add axe-core to CI in a follow-up PR; not a sprint blocker |

---

## Sprint Outcomes (Definition of Done)

- [ ] All 4 P1 accessibility tickets pass their acceptance criteria
- [ ] Phase 1 tickets ship to a review branch by Day 2 end
- [ ] Phase 2 tickets have a working prototype by Day 5
- [ ] Accessibility audit (axe-core or Lighthouse) run on P1 fixes — 0 contrast failures, 0 missing focus indicators
- [ ] All new components verified for keyboard navigation and screen reader support
- [ ] Warmth checklist reviewed for Phase 2 components (rounded corners ≥12px, Broadcast Gold on family names, no time greetings)

---

## Key Reference Documents

- **CEO Vision:** `/workspace/familytv/design/ai-first-dashboard-vision.md`
- **UX Audit:** `/workspace/familytv/design/dashboard-ux-audit.md`
- **Design Brief:** `/workspace/familytv/design/family-tv-design-brief.md`

---

*Sprint 007 plan — Strategist subagent — 2026-03-31*
