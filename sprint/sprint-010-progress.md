# Sprint 010 Progress — Frontend Dev

**Date:** 2026-04-01
**Status:** ✅ All 3 tickets delivered

---

## Ticket 1 (P1): Activity Stories Feed UI — CTM-236
**Issue:** https://github.com/ftv-app/familytv/issues/37

### What was built
- **`src/components/feed/ActivityFeed.tsx`** — Client component, card-based chronological family feed
- **`src/components/feed/ActivityFeed.test.tsx`** — Vitest test suite (7 tests)

### Features implemented
- Replaces Stats cards (StatCard grid) on the dashboard with warm card-based feed
- Uses brand tokens: terracotta `#c4785a`, cream `#faf8f5`, Fraunces + Plus Jakarta Sans
- Fetches from `GET /api/family/activity?familyId=...&limit=20&cursor=...`
- Activity card renders actor name, type-specific content preview, and relative time
- **Loading skeletons** (4-card pulse animation) while fetching
- **Empty state** for new families using existing `WarmEmptyState` component
- **Load more** button + IntersectionObserver sentinel for infinite scroll
- **Pagination**: uses `nextCursor` ISO timestamp from API
- **Error state** with retry button
- All interactive elements have `data-testid="feed-*"` attributes:
  - `feed-container`, `feed-card`, `feed-card-content`, `feed-card-time`
  - `feed-load-more`, `feed-retry`, `feed-end`

### Wired into dashboard
- Replaced the `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">` Stats Row with `<ActivityFeed familyId={selectedFamilyId} familyName={channelName} />`
- Dashboard server component passes `currentUserId` to DashboardClient for presence

---

## Ticket 2 (P1): What's Happening Now — CTM-237
**Issue:** https://github.com/ftv-app/familytv/issues/38

### What was built
- **`src/components/surfacing/WhatsHappeningNow.tsx`** — Client component, proactive surfacing
- **`src/components/surfacing/WhatsHappeningNow.test.tsx`** — Vitest test suite (5 tests)

### Features implemented
- Replaces Quick Actions static grid with notification-style proactive cards
- Uses existing WebSocket presence data (Socket.IO-style `presence:update`, `reaction:update` events)
- **ConnectionStatus** chip showing live/offline state (`data-testid="surfacing-connection-status"`)
- **OnlinePresenceCard**: shows family members currently online as pill chips (`data-testid="surfacing-presence-card"`, `data-testid="surfacing-online-member"`)
- **UpcomingEventCard**: fetches events from activity API, filters to next 24h, shows title + time-to-event (`data-testid="surfacing-event-card"`, `data-testid="surfacing-event-item"`)
- **RecentActivityCard**: real-time reactions via WebSocket `reaction:update` messages (`data-testid="surfacing-activity-card"`, `data-testid="surfacing-activity-item"`)
- **Empty state** when nothing is happening (`data-testid="surfacing-empty"`)
- **Loading skeleton** while initial data loads
- WebSocket auto-reconnects on close (3s backoff)
- All interactive elements have `data-testid="surfacing-*"` attributes

### Wired into dashboard
- Added `<WhatsHappeningNow familyId={selectedFamilyId} currentUserId={currentUserId} />` after Quick Actions section

---

## Ticket 3 (P2): Mobile nav polish + loading states — CTM-238
**Issue:** https://github.com/ftv-app/familytv/issues/39

### What was fixed

#### Mobile hamburger contrast (CTM-238)
- **File:** `src/components/app-shell.tsx`
- **Issue:** "Menu" text in terracotta `#c4785a` on cream `#faf8f5` = ~3.3:1 contrast (fails WCAG AA 4.5:1)
- **Fix:** Changed "Menu" text color from `#c4785a` to `#2D5A3D` (forest green) to meet 4.5:1 contrast on cream
- Also added `aria-hidden="true"` to the text label since the button already has `aria-label="Open navigation menu"`
- Tap target: 48×48px minimum ✅ (button has `px-3 py-3`)

#### Quick Actions loading state (CTM-238)
- **File:** `src/app/(app)/dashboard/dashboard-client.tsx`
- Added `isNavigating` state to disable Quick Action links during navigation
- Wrapped each Quick Action in a `<button disabled>` wrapper with `data-testid="quick-action-add-event"`, `data-testid="quick-action-invite"`, `data-testid="quick-action-view-feed"`
- Loading state shows 3 skeleton cards with terracotta-tinted spinner (`Loader2` from lucide, `animate-spin`)
- Uses warm brand colors: `rgba(212,175,55,0.08)` background for skeleton loaders

---

## Technical Standards — Compliance

| Standard | Status |
|----------|--------|
| TypeScript strict mode, zero `any` types | ✅ |
| Server Components by default, client pushed down | ✅ (ActivityFeed, WhatsHappeningNow are `"use client"`) |
| `data-testid` on every interactive element | ✅ |
| No `console.log` in code | ✅ |
| Boy Scout Rule (debt fixed) | ✅ Removed dead `StatCard` and `QuickActionButton` components from dashboard-client.tsx |
| Test files for new components | ✅ `ActivityFeed.test.tsx`, `WhatsHappeningNow.test.tsx` |

---

## Files Created/Modified

### Created
- `src/components/feed/ActivityFeed.tsx`
- `src/components/feed/ActivityFeed.test.tsx`
- `src/components/surfacing/WhatsHappeningNow.tsx`
- `src/components/surfacing/WhatsHappeningNow.test.tsx`

### Modified
- `src/app/(app)/dashboard/page.tsx` — added `currentUserId` prop
- `src/app/(app)/dashboard/dashboard-client.tsx` — wired in ActivityFeed + WhatsHappeningNow, replaced Stats + Quick Actions, added loading state, removed dead StatCard/QuickActionButton code
- `src/components/app-shell.tsx` — fixed mobile nav Menu text contrast

### Build Status
- `npm run build` ✅ passes
- TypeScript check ✅ no errors in modified/new files
