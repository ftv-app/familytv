# FamilyTV Watch-Party Coverage Plan

## Current Coverage Status

```
lib/watch-party/chat-handler.ts   :   0% (lines 77-362)
lib/watch-party/reaction-handler.ts:   0% (lines 68-167)
lib/watch-party/server.ts          :   0% (lines 49-179)
lib/watch-party/security.ts        :  80% (needs targeted tests)
lib/watch-party/socket-handlers.ts :  74% (needs targeted tests)
```

**Global coverage**: 74.02% statements / 75.46% branches / 78.46% functions / 74.11% lines  
**Required**: 97% across all metrics

---

## Root Cause Analysis

The existing test files for `chat-handler.test.ts` and `reaction-handler.test.ts` test **logic concepts** (JSON structure validation, rate-limit math) but **never import or call any exported function** from the actual modules. They test the _idea_ of the code, not the code itself.

The `server.ts` file is a factory function that wires together Socket.IO + Redis + auth middleware — it has never been exercised in tests.

---

## Priority Order & Coverage Lift Estimates

| Priority | File | Functions to Test | Est. Coverage Lift |
|----------|------|-------------------|-------------------|
| **1** | `chat-handler.ts` | `saveChatMessage`, `getChatHistory`, `pruneChatHistory`, `generateUUID`, `registerChatHandlers` (chat:send, chat:history paths), `getRoomChatHistory` | +8-10% |
| **2** | `reaction-handler.ts` | `registerReactionHandlers` (reaction:send path) | +4-6% |
| **3** | `server.ts` | `createWatchPartyServer`, `getSocketServer`, `resetSocketServer`, auth middleware, Redis adapter | +5-7% |
| **4 | `socket-handlers.ts` | uncovered branches in room:join, presence:heartbeat, room:leave, disconnect | +2-3% |
| **5 | `security.ts` | uncovered lines in rate-limit, verifyClerkToken edge cases | +1-2% |

**Total estimated lift from top 3**: +17-23% → well above 97% global threshold

---

## Test Strategy

### chat-handler.ts (Priority 1)

**Testable units:**
- `generateUUID()` — pure, no deps → easy unit test
- `saveChatMessage()` — needs `sql` mock + `crypto` mock → unit test
- `getChatHistory()` — needs `sql` mock → unit test  
- `pruneChatHistory()` — needs `sql` mock → unit test
- `getRoomChatHistory()` — alias for getChatHistory → covered by above
- `registerChatHandlers` — needs Socket.IO mock with full event simulation → integration test

**Test file:** `src/lib/watch-party/__tests__/chat-handler.test.ts` (rewrite)

**Key scenarios:**
1. `chat:send` with valid payload → saves to DB, broadcasts `chat:new`
2. `chat:send` without auth → emits AUTH_REQUIRED error
3. `chat:send` not in room → emits NOT_IN_ROOM error
4. `chat:send` wrong family scope → emits UNAUTHORIZED error
5. `chat:send` rate limited → emits `chat:rate_limited` event
6. `chat:send` invalid text (XSS, too long, empty) → emits VALIDATION_ERROR
7. `chat:send` valid → saves message with sanitized text, correct videoTimestamp
8. `chat:history` with valid room → returns ChatMessage[]
9. `chat:history` unauthorized family → emits UNAUTHORIZED error
10. `generateUUID` produces valid UUID v4 format
11. `getChatHistory` returns messages in chronological order (oldest first)

---

### reaction-handler.ts (Priority 2)

**Testable units:**
- `registerReactionHandlers` — needs Socket.IO mock → integration test

**Key scenarios:**
1. `reaction:send` with valid emoji → broadcasts `reaction:new`
2. `reaction:send` without auth → emits AUTH_REQUIRED error
3. `reaction:send` not in room → emits NOT_IN_ROOM error
4. `reaction:send` wrong family scope → emits UNAUTHORIZED error
5. `reaction:send` rate limited → emits `reaction:rate_limited`
6. `reaction:send` invalid emoji → emits VALIDATION_ERROR
7. `reaction:send` valid → includes correct userId, userName, emoji, videoTimestamp, timestamp
8. Reaction is ephemeral (NOT stored in DB) — no sql call

---

### server.ts (Priority 3)

**Testable units:**
- `createWatchPartyServer` — needs httpServer mock + Redis mock → unit/integration test
- `getSocketServer` / `resetSocketServer` — singleton lifecycle → unit test
- Auth middleware path (valid token) → unit test
- Auth middleware path (invalid token) → unit test
- Redis adapter connection failure → graceful degradation → unit test

**Key scenarios:**
1. Creates Socket.IO server with correct CORS config
2. Attaches auth middleware — valid token → socket.userId, socket.familyId set
3. Attaches auth middleware — missing token → next(Error)
4. Attaches auth middleware — invalid token → next(Error)
5. Registers presence + chat + reaction handlers
6. Redis adapter connects when REDIS_URL set
7. Redis adapter failure → logs warning, continues WITHOUT Redis
8. `getSocketServer` returns singleton
9. `resetSocketServer` disconnects and closes server

---

## Implementation Notes

### Socket.IO Mock Pattern

```typescript
// Mock Socket
const mockSocket = {
  id: 'socket-123',
  userId: 'user-456',
  familyId: 'family-789',
  displayName: 'Mom',
  avatarUrl: null,
  deviceId: 'device-abc',
  rooms: new Set(['family:family-789:video:vid-123:session:sess-456']),
  join: vi.fn(),
  leave: vi.fn(),
  emit: vi.fn(),
  on: vi.fn((event, handler) => { /* store handler */ }),
} as unknown as Socket;

// Mock Server
const mockIo = {
  on: vi.fn(),
  adapter: vi.fn(),
  sockets: mockSocket,
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
} as unknown as SocketIOServer;
```

### Database Mock Pattern

```typescript
vi.mock('@/lib/db', () => ({
  sql: vi.fn().mockResolvedValue([]),
}));
```

### Redis Mock Pattern

```typescript
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: vi.fn(),
}));
```

---

## Files to Create/Update

1. **`src/lib/watch-party/__tests__/chat-handler.test.ts`** — Rewrite with real function imports
2. **`src/lib/watch-party/__tests__/reaction-handler.test.ts`** — Rewrite with real function imports
3. **`src/lib/watch-party/__tests__/server.test.ts`** — New file for server.ts coverage
4. **`src/lib/watch-party/__tests__/socket-handlers.test.ts`** — Add uncovered branch tests

---

## Execution Order

1. Write coverage plan (this file) ✅
2. Rewrite `chat-handler.test.ts` with real function tests
3. Rewrite `reaction-handler.test.ts` with real function tests
4. Create `server.test.ts`
5. Run tests to verify coverage lift
6. Address any remaining gaps in `socket-handlers.test.ts` and `security.test.ts`
