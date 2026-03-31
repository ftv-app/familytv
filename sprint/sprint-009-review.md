# Sprint 009 Review — 2026-03-31 18:06 UTC

## Last Commit: `59c45e1`
**Message:** `fix(dashboard): connect to real DB — replace placeholder families and hardcoded stats`

**Files changed:**
- `src/app/(app)/dashboard/dashboard-client.tsx` (+22/-8)
- `src/app/(app)/dashboard/page.tsx` (+66/-5)
- `playwright-report/index.html` (+1/-1)

**What it does:** Replaces hardcoded placeholder families ("The Smiths", "The Convos") and hardcoded stats (postsThisWeek: 3, upcomingEvents: 1) with real Neon Postgres queries via Drizzle ORM.

**Does it touch Sprint 009 tickets?** NO. This is a pre-existing bugfix, not part of the Sprint 009 ticket set (#28, #29, #26, #25, #27). It was likely overdue tech debt.

---

## Pending Changes

**Untracked files only** — no modified/staged files:
- `sprint/next-sprint-plan.md`
- `sprint/sprint-010.md`

**No code changes sitting unstaged or uncommitted.**

---

## Sprint 009 Ticket Status

### ✅ #26 — GET /api/family/activity (Backend)
**Status: IMPLEMENTED**

`src/app/api/family/activity/route.ts` exists with full implementation (190 lines):
- Auth protection (401 if not logged in)
- Family membership verification (403 if not a member)
- Cursor-based pagination
- Fetches recent posts + events, merges + sorts by `createdAt`
- `quietMembers`: detects members with no posts OR last post 21+ days ago
- `upcomingEvents`: events in next 14 days with `daysAway` field
- Input validation on `familyId`, `cursor`, `limit`

**NOTE:** The QA status report from earlier said "NOT YET STARTED" — that was stale. The API is fully implemented. However, there is NO test file at `src/test/api/family-activity.test.ts` (confirmed absent). Coverage for this route is likely 0%.

---

### 🔴 #29 — P1 Auth Pages WCAG
**Status: BLOCKED / NOT STARTED**

`src/app/(auth)/` directory exists but is **EMPTY** (only `.` and `..`).

Auth pages currently live at:
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/(app)/dashboard/` (post-auth dashboard)

These are Clerk-hosted pages wrapped with a simple loading skeleton. There is **no evidence of WCAG AA work** (aria-labels, keyboard navigation, focus management, semantic HTML audit, color contrast verification) on any auth page.

The `src/app/sign-in/[[...sign-in]]/page.tsx` has a basic loading state with `aria-label="Sign in to FamilyTV"` on `<main>`, but the actual Clerk component renders inside — Clerk's hosted UI may or may not be WCAG compliant.

**This is the sprint's critical path item and it has not started.**

---

### 🔴 #28 — Activity Stories Feed
**Status: NOT STARTED (blocked on #29 + API consumption)**

No Activity Stories UI exists. The `dashboard-client.tsx` (291 lines) still uses the old **StatCard** design (members/postsThisWeek/upcomingEvents counters). There is no warm chronological feed, no Activity Story component, no consumption of the `/api/family/activity` endpoint.

The design spec was committed (`f60d25d docs: Activity Stories Feed design spec #28`) but no UI code has been written.

**Blocked by:** API delivery (done ✅) but frontend-dev is also assigned to #29 (auth WCAG P1), which may be causing a bottleneck.

---

### ⏳ #25 — Proactive Surfacing "What's Happening Now"
**Status: NOT STARTED**

No code exists for quiet member re-engagement prompts or birthday event surfaced in the UI.

---

### ⏳ #27 — Mobile Nav Polish + Loading States
**Status: NOT STARTED**

No changes observed in mobile navigation, hamburger menu contrast, or loading state improvements.

---

## Summary Table

| Ticket | Description | Status |
|--------|-------------|--------|
| #26 | Activity API | ✅ Implemented (190 lines) |
| #29 | Auth WCAG | 🔴 Not started — (auth)/ empty |
| #28 | Activity Stories UI | 🔴 Not started — dashboard unchanged |
| #25 | Proactive surfacing | ⏳ Not started |
| #27 | Mobile polish | ⏳ Not started |

---

## Coverage Status (from Sprint 008 QA report)

| Metric | Value | Threshold |
|--------|-------|-----------|
| Statements | 99.24% | 90% |
| Branches | 97.32% | 90% |
| Functions | 100% | 90% |
| Lines | 99.23% | 90% |

**⚠️ Gap:** Activity API (#26) has 0% test coverage. Overall coverage numbers look high because Sprint 008 tests still pass — the new route is simply untested.

---

## Key Risks

1. **#29 (Auth WCAG) is the sprint's P1 and hasn't started.** The empty `(auth)/` directory is a red flag — either the work is in progress in an unexpected location, or frontend-dev is blocked.
2. **Frontend-dev is single-threaded on P1 auth + Activity Stories** — if these are sequential rather than parallel, velocity will be low.
3. **Sprint 010 plan was already drafted** while Sprint 009 is only ~6 hours old — possible premature handoff or low confidence in Sprint 009 completion.
4. **Activity API tests are missing** — coverage gap needs to be filled before QA gate.

---

## Recommendations

1. **Clarify #29 scope immediately** — is there an existing WCAG audit? Is the work in a branch? Or does it need to start from scratch?
2. **Write Activity API tests** (`src/test/api/family-activity.test.ts`) — 0% coverage on a new endpoint is a gate failure risk.
3. **Parallelize frontend-dev work** — spawn a second frontend-dev subagent if #29 and #28 must be sequential.
4. **Decide if #25/#27 ship in this sprint or roll to #010** — they're P2 and the P1s aren't moving.
