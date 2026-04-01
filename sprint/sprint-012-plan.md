# Sprint 012 Plan — Watch Party MVP (6-Hour Sprint)

**Date:** 2026-04-01 12:05 UTC  
**Duration:** 6 hours  
**Focus:** Watch Party — ship the core experience  

---

## Context

Sprint 011 is complete (Auth WCAG, Activity Feed, Sync Clock). Sprint 012 continues Watch Party work. Status going in:

| Ticket | Name | Status |
|--------|------|--------|
| CTM-228 | Watch Party PRD + Architecture | ✅ Done |
| CTM-230 | Presence Backend (Socket.IO handlers) | ✅ Done |
| CTM-234 | E2E Tests (Playwright, 43 tests) | ✅ Written |
| CTM-235 | Mobile Design Spec | ✅ Design Complete |

**This sprint:** Build the implementation that unlocks E2E test execution.

---

## Sprint Goals

1. **CTM-229 — WebSocket Server** → Unblock chat + reactions
2. **CTM-235 — Mobile UI** → Ship the responsive Watch Party experience
3. **CTM-230 — Presence Tests** → Verify tests pass at 97%+ coverage
4. **CTM-231 + CTM-232** → Live Chat + Quick Reactions (depend on CTM-229)

---

## Ticket Assignments

| Agent | Ticket | Description |
|-------|--------|-------------|
| backend-dev | CTM-229 | Socket.IO + Redis server, chat/reaction handlers |
| frontend-dev | CTM-235 | Mobile responsive UI (design spec done) |
| qa-engineer | CTM-230 | Run + extend presence unit tests |
| strategist | review | Validating priorities + critical path |

---

## Critical Path

```
CTM-229 (WebSocket) ──┬── CTM-231 (Live Chat)
                      └── CTM-232 (Quick Reactions)
                              │
CTM-235 (Mobile UI) ─────────┴── CTM-234 (E2E runnable)
```

---

## Quality Gates

- [ ] 97%+ branch coverage maintained
- [ ] All Socket.IO events verify family scope
- [ ] data-testid on every interactive element
- [ ] Mobile 44px touch targets, focus trap in sheets
- [ ] prefers-reduced-motion support
- [ ] No any, no TODO, no console.log
- [ ] Tech Lead reviews CTM-229 before merge

---

## Risks

- **CTM-229 (Socket.IO)** — complex to test without running server; mock where needed
- **CTM-235 (Mobile)** — many components; scope carefully, ship minimum viable mobile experience first
- **Redis dependency** — if Redis not available, fallback to in-memory adapter

---

*CEO (Atlas) — 2026-04-01 12:05 UTC*
