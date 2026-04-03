# FamilyTV Tech Debt

> Last updated: 2026-04-01 (Tech Lead review)

## Status: 🔴 BLOCKING — 46 lint errors, build failing

---

## Critical: React Purity Violations (BANNED — blocks lint)

### F1: `Date.now()` during render
- **File:** `src/components/watch-party/PresenceStrip.tsx:485`
- **Issue:** `Date.now()` called directly in JSX render
- **Fix:** Use `useState` + `useEffect` to set timestamp after mount

### F2: `Math.random()` during render (×2)
- **Files:** `src/components/watch-party/ReactionBubble.tsx:57`, `src/components/watch-party/Reactions.tsx:312`
- **Issue:** Random drift animation values generated during render
- **Fix:** Generate random values in `useState` initializer or `useMemo`

### F3: Ref access during render (×3)
- **Files:** `src/app/tv/page.tsx:156-157`, `src/hooks/useWatchPartySocket.ts:377`
- **Issue:** `trackRef.current.offsetWidth` accessed during render
- **Fix:** Track dimensions via state or `useEffect`

### F4: `setState` synchronously in effect body
- **Files:** `src/app/tv/page.tsx:482`, `src/components/watch-party/Reactions.tsx:131`
- **Issue:** `setIsMobile()` / `setSocket()` called directly in `useEffect`
- **Fix:** Use event-driven updates via `addEventListener` callback

### F5: `Date.now()` during render (dashboard)
- **File:** `src/app/(app)/dashboard/page.tsx:83,104`
- **Issue:** `Date.now()` in server component render path

---

## High: console.log in Production Code (BANNED — blocks lint)

### F6: Watch-party socket server
- **File:** `src/lib/watch-party/server.ts`
- **Lines:** 90, 119, 140, 147
- **Issue:** 4× `console.log` (Redis connect, auth, connect, disconnect)
- **Fix:** Replace with structured logger or remove

### F7: Socket handlers
- **File:** `src/lib/watch-party/socket-handlers.ts`
- **Lines:** 45, 110, 184, 195
- **Issue:** 4× `console.log` (presence connect, join, leave, disconnect)

### F8: Chat handler
- **File:** `src/lib/watch-party/chat-handler.ts`
- **Lines:** 190, 298
- **Issue:** 2× `console.log` (chat connect, message sent)

### F9: Reaction handler
- **File:** `src/lib/watch-party/reaction-handler.ts`
- **Lines:** 69, 164
- **Issue:** 2× `console.log` (reaction connect, reaction sent)

---

## High: `any` Types (TypeScript strict violation)

### F10: server.ts — httpServer parameter
- **File:** `src/lib/watch-party/server.ts:61`
- **Issue:** `httpServer?: any`
- **Fix:** Type as `import type { Server } from 'http'` or `import type { Http2SecureServer } from 'http2'`

### F11: Test files — mock data
- **Files:**
  - `src/lib/watch-party/__tests__/socket-handlers.test.ts` — 26× `any`
  - `src/lib/watch-party/__tests__/reaction-handler.test.ts` — 2× `any`
  - `src/lib/watch-party/__tests__/chat-handler.test.ts` — 2× `any`
  - `src/lib/watch-party/__tests__/security.test.ts` — 2× `any`
- **Fix:** Define typed mock interfaces (`MockSocket`, `MockPayload`, etc.)

---

## Medium: Unused Imports / Variables

### F12: server.ts
- `AuthenticatedUser` imported but not used (line 18)
- `io` variable assigned but not used (line 158)

### F13: socket-handlers.ts
- `PresenceManager`, `parseRoomId`, `MergedPresenceUser` imported but not used

### F14: chat-handler.ts
- `buildRoomId` imported but not used
- `err` variable assigned but never used (×2: lines 237, 341)

### F15: reaction-handler.ts
- `err` variable assigned but never used (line 117)

### F16: presence.ts
- `HEARTBEAT_INTERVAL_MS` assigned but never used (line 76)

---

## Low: E2E Test Warnings (non-blocking)

E2E test files have unused variable warnings (watch-party.spec.ts, onboarding flows, carousel). These are warnings only and don't block CI. QA engineer should clean up post-milestone.

---

## Recommendations

1. **Fix F1–F5 first** — these are React rule violations that fail lint
2. **Remove all console.log** — replace with a no-op logger or conditional dev-only logging
3. **Type the mock objects** — avoid `any` in test files using typed factories
4. **Linear tickets** — create 3 tickets: (1) React purity fixes, (2) console.log removal, (3) TypeScript strict compliance

---

*Tech Lead review completed: 2026-04-01*
