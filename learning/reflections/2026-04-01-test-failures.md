# Test Failure Analysis — 2026-04-01

**Context:** Watch-party feature (CTM-228-233) merged. 59/403 tests failing after merge.
**Float-up animation (61f92c4) deployed to prod with failing tests — pre-deploy gate failure.**

---

## Summary

| Category | Count | Fix Owner |
|----------|-------|-----------|
| Test bugs (test written wrong) | ~32 | QA (me) |
| Source code bugs (doesn't match spec) | ~15 | Tech-lead |
| Test environment (missing fake timers) | 1 | QA (me) |
| **Total** | **59** | |

---

## 1. Reactions.test.tsx — 18 failures

**Root cause: Mock socket missing `connected: true`**

The `Reactions` component now guards with:
```ts
if (!socket?.connected) {
  console.warn("[Reactions] Socket not connected, dropping reaction");
  return;
}
socket.emit("reaction:send", reactionData);
```

The test mock at line 16-26 creates a socket object but never sets `connected: true`:
```ts
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    disconnect: vi.fn(),
    // MISSING: connected: true
  })),
}));
```

**All 18 failures** are `mockEmit` calls not happening because `socket?.connected` is falsy.

### Fix (QA): Add `connected: true` to the mock
```ts
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    disconnect: vi.fn(),
    connected: true, // ADD THIS
  })),
}));
```

**Failing tests (18):**
1. `should have proper button semantics` — checks `toBeDisabled()` but button not disabled
2. `should call socket.emit with reaction:send when button is clicked` — 0 calls
3. `should include userId and userName in reaction event` — 0 calls
4. `should include roomId in reaction event` — 0 calls
5. `should include videoTimestamp in reaction event` — 0 calls
6. `should allow clicking multiple different emojis in sequence` — 0 calls (expected 2)
7. `should allow clicking same emoji multiple times` — 0 calls (expected 3)
8. `should add received reactions to local state` — bubbles.length = 0
9. `should NOT show own reactions as bubbles` — bubbles.length = 0
10. `should render incoming reactions as bubbles with data-testid` — bubble is null
11. `should display user name on reaction bubble` — "Grandma" not found in content
12. `should have reaction buttons with minimum 44x44px dimensions` — rect.width = 0
13. `should support keyboard navigation` — 0 emit calls
14. `should support space key activation` — 0 emit calls
15. `should render with CSS class for float animation` — bubble null
16. `should handle rapid clicking without breaking` — 0 calls (expected 10)
17. `should handle missing videoTimestamp gracefully` — 0 calls
18. `should use provided videoTimestamp in reactions` — 0 calls

---

## 2. security.test.ts — 34 failures

### 2a. XSS Prevention Tests (13 failures) — TEST BUGS

Tests expect `sanitizeChatMessage` to **throw** on XSS input. The implementation now **escapes** the input instead:
```ts
// Tests expect: sanitizeChatMessage("<script>...") → throws ValidationError
// Actual:        sanitizeChatMessage("<script>...") → "&lt;script&gt;..."
```

This is the new (correct) behavior — escaping rather than rejecting. Tests were not updated.

**Failing tests:**
1. `should block script injection` — doesn't throw (escapes instead)
2. `should block img onerror injection` — doesn't throw
3. `should block iframe injection` — doesn't throw
4. `should block javascript: URLs` — doesn't throw (strips `javascript:`)
5. `should block data: URLs` — doesn't throw (strips `data:`)
6. `should block event handlers` — doesn't throw (strips `<div onclick=...>`)
7. `should block style with expression` — doesn't throw
8. `should block SVG-based XSS` — doesn't throw
9. `should handle numeric HTML entities` — doesn't throw
10. `should handle hex HTML entities` — doesn't throw
11. `should prevent DOM-based XSS` — doesn't throw
12. `should handle right-to-left override attacks` — doesn't throw
13. `should handle zero-width characters` — doesn't throw

**Note:** The `should allow safe entities` and `should allow gt/lt entities` failures are separate — those test **double-escaping bugs** (see 2c).

### 2b. `validateReactionEmoji` — `❤️` (U+2764) not in regex — SOURCE CODE BUG

The regex at line 406:
```ts
const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]+$/u;
```

**`❤️` (U+2764) is NOT in any of these ranges.** `U+2764` is in the range `U+2700-U+27BF`... wait no, `U+2764` is 10080 decimal. `U+27BF` is 10175. So `2764 < 27BF`... actually yes! `U+2764` IS within `U+2700-U+27BF`. But our test showed `❤️` does NOT match.

Wait - `❤️` is a COMBINED emoji. The character `❤` (U+2764) followed by Variation Selector-16 (U+FE0F). When you write `❤️` in JavaScript, it might be the single character `❤` + `️` (U+FE0F).

Let me verify:
```
❤️ length: 2 match: false
```

The emoji `❤️` is 2 code points: U+2764 + U+FE0F. The regex only matches the emoji character itself, not the variation selector. But also U+2764 is technically in `\u2700-\u27BF` range (U+2700=9984, U+2764=10080, U+27BF=10175). So it should match `\u2700-\u27BF`.

Wait, let me re-check:
- `\u2700` = 9984 (U+2700)
- `\u27BF` = 10175 (U+27BF)
- U+2764 = 10080

10080 is between 9984 and 10175. So `\u2764` should be matched by `\u2700-\u27BF`. But `❤️` (U+2764 + U+FE0F) doesn't match because the regex requires the ENTIRE string to match, and `❤️` is two characters where U+FE0F is not in the range.

**Source fix needed:** The regex needs to handle variation selectors OR the function should strip variation selectors before testing. But more importantly: is `❤️` supposed to be a valid reaction? The REACTION_EMOJIS constant includes it. So the tech-lead needs to fix the regex.

### 2c. Double-Escaping HTML Entities — SOURCE CODE BUG

Two tests fail:
- `should allow safe entities`: Input `Tom &amp; Jerry` → output `Tom &amp;amp; Jerry` (double-amped)
- `should allow gt/lt entities`: Input `5 &gt; 3` → output `5 &amp;gt; 3` (double-amped)

The `sanitizeChatMessage` function has:
```ts
// Remove HTML entities that could bypass escaping
sanitized = sanitized.replace(/&(#x?[a-fA-F0-9]+|[a-zA-Z]+);/g, (match) => {
  // ... 
  return escapeHtml(match); // BUG: double-escapes already-escaped entities
});
// Later:
sanitized = escapeHtml(sanitized); // Then escapes again
```

This double-escapes already-escaped input.

### 2d. `isValidUUID` — Invalid test case — TEST BUG

Line 482: `expect(isValidUUID("a1b2c3d4-e5f6-1234-5678-9abcdef01234")).toBe(true)`

This UUID has variant byte `5`. Per RFC 4122, valid variant bytes are `8`, `9`, `A`, or `B`. The test is wrong — this is not a valid UUID.

**Fix (QA):** Remove or fix this test case to use a proper UUID variant.

### 2e. `parseRoomId` — Doesn't validate UUIDs — SOURCE CODE BUG

`parseRoomId("family:invalid:video:test:session:123")` returns `{ familyId: "invalid", ... }` instead of `null`.

The function checks format (`parts.length === 6`) but never validates that each ID part is a valid UUID. Since `parseRoomId` is a security-relevant function used in room access control, it MUST validate UUID format.

**Fix (tech-lead):** Add UUID validation inside `parseRoomId`.

### 2f. Rate Limit Tests (10 failures) — TEST BUGS

Tests call rate limit functions multiple times without resetting state or using fake timers:
```ts
// Test calls checkReactionRateLimit(VALID_UUID) 10+ times in succession
// Without time advancement, the sliding window fills immediately
// Source code is correct; tests don't simulate time properly
```

Same issue for `checkChatRateLimit` tests.

**Fix (QA):** Use `vi.useFakeTimers()` and advance time between calls, or reset the rate limit state between tests.

### 2g. `verifyRoomFamilyScope` test — TEST BUG

Line 830: `expect(() => verifyRoomFamilyScope({ familyId: "invalid", ... }, user)).toThrow(AuthorizationError)`

But `verifyRoomFamilyScope` throws `ValidationError` when `familyId` is invalid (line 263: "Invalid family ID in room join request"), BEFORE it can check family scope (which would throw `AuthorizationError`).

The test is testing the wrong error type for invalid familyId input.

### 2h. OWASP tests failing — TEST BUGS

Line 841: `expect(escaped).not.toContain("alert")` fails because `escapeHtml("alert(&#x27;XSS&#x27;)")` = `alert(&amp;#x27;XSS&amp;#x27;)` which still contains the string "alert". The test logic is flawed.

### 2i. `verifyClerkToken` — MODULE_NOT_FOUND — TEST BUG

Line 808: `require("../security").verifyClerkToken(undefined)` → module not found. The function doesn't exist in the module.

---

## 3. presence.test.ts — 7 failures

### 3a. Missing `vi.useFakeTimers()` — TEST BUG

Line 228: `vi.advanceTimersByTime(1000)` fails with "A function to advance timers was called but the timers APIs are not mocked."

**Fix (QA):** Add `vi.useFakeTimers()` in the test setup.

### 3b. Multi-device presence broken — SOURCE CODE BUG (5 failures)

When user joins room with 2 different devices, `room.users.size` is 1 instead of 2. The `PresenceManager.joinRoom` appears to treat devices as users (using `deviceId` as the primary key) rather than properly tracking devices under users.

**Failing tests:**
1. `handles multiple devices for same user` — `room.users.size` = 1 (expected 2)
2. `respects MAX_DEVICES_PER_USER limit` — `room.users.size` = 1 (expected 5)
3. `returns merged presence for users with multiple devices` — `isMultiDevice` = false
4. `returns correct presence state after joins` — users.length = 1 (expected 2)
5. `returns all users with their devices` — users.length = 1 (expected 2)
6. `has correct structure for multi-device user` — `isMultiDevice` = false

**Source code fix needed** in `PresenceManager.joinRoom` — when the same userId joins with different deviceIds, it should track both devices under the same user, not create separate user entries.

---

## Action Items

### Tech-lead must fix (source bugs):
1. **presence.ts `joinRoom`**: Fix multi-device handling — devices should be tracked under users, not as separate users
2. **security.ts `validateReactionEmoji`**: Fix regex to include `❤️` (U+2764)
3. **security.ts `sanitizeChatMessage`**: Fix double-escaping of already-escaped HTML entities
4. **security.ts `parseRoomId`**: Add UUID validation for each component

### QA (me) must fix (test bugs):
1. **Reactions.test.tsx**: Add `connected: true` to mock socket
2. **security.test.ts** (XSS tests 26-33, 56-58): Update to expect escaped output instead of thrown errors
3. **security.test.ts** (`❤️` test line 310): Update expected behavior once tech-lead fixes the regex
4. **security.test.ts** (double-escape tests 41-42): Update assertions once tech-lead fixes source
5. **security.test.ts** (`isValidUUID` line 482): Fix invalid test UUID to use a proper RFC 4122 variant
6. **security.test.ts** (`verifyRoomFamilyScope` line 830): Expect `ValidationError` for invalid familyId
7. **security.test.ts** (rate limit tests 42-51): Add `vi.useFakeTimers()` and time advancement
8. **presence.test.ts** (timer test): Add `vi.useFakeTimers()` setup
9. **security.test.ts** OWASP test line 841: Fix assertion logic

---

## Root Cause Summary

The watch-party feature (CTM-228-233) was merged with **three categories of problems**:

1. **Tests not updated for new behavior**: Socket guard added to Reactions, XSS handling changed from reject-to-escape, rate limit tests missing fake timers. Tests written for old behavior.

2. **Source bugs introduced**: `❤️` emoji regex gap, double-escaping in sanitization, `parseRoomId` missing UUID validation, multi-device presence tracking broken.

3. **Pre-deploy gate failure**: 61f92c4 was deployed to prod with 59 failing tests. The CI gate did not catch this — or was overridden. Recommend adding `--bail` flag to vitest to fail fast on first test failure in CI.

**Next step:** Tech-lead fixes source bugs first, then I re-run tests and fix test bugs. All 403 tests must pass before next deploy.
