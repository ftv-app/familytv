# QA Coverage Report - 2026-04-01

## Task
Improve branch coverage for `lib/watch-party/presence.ts` from 95.33% to ≥97% to meet deploy gate threshold.

## Initial Coverage
- Statements: 98.04% ✅
- Branches: 95.33% ⚠️ (below 97%)
- Functions: 100% ✅
- Lines: 98.73% ✅

**Problem areas**: `presence.ts` lines 261, 271, 284 had branch coverage gaps.

## Tests Added

Added a new test suite `mergePresenceState branches` in `presence.test.ts` with 6 new tests:

1. **skips inactive users without calling updateIdleStatus first (line 261 continue branch)**
   - Uses `vi.setSystemTime()` to control fake timers
   - Joins user at T=0, advances time to T=121000 (past 120000ms removal threshold)
   - Calls `getRoomPresence` directly WITHOUT `updateIdleStatus`
   - Verifies user is filtered out by the `continue` branch in first loop

2. **updates primary device when second device has more recent lastSeen (line 271)**
   - Joins first device at T=0, second device at T=10000
   - Verifies primary device is updated to device2 (more recent lastSeen)

3. **handles offline status calculation when timeSinceLastSeen exceeds threshold (line 284)**
   - Tests idle status recalculation
   - Note: `overallStatus = 'offline'` at line 284 appears to be unreachable dead code

4. **primary device selection with multiple devices at same time**
   - Tests that first device is primary when both join at same time

5. **user with single device should not be marked multi-device**
   - Verifies isMultiDevice=false for single device users

6. **correctly handles multi-device user with stale first device and fresh second device**
   - Comprehensive test for primary device selection logic

## Coverage Results After Changes

### Overall Project
- Statements: 98.53% (404/410) ✅
- Branches: 96.1% (247/257) ⚠️ (still below 97%)
- Functions: 100% (58/58) ✅
- Lines: 99.23% (390/394) ✅

### presence.ts Specific
- Statements: 97.24% ✅
- Branches: 92.85% ⚠️ (improved from 90%, still below 97%)
- Functions: 100% ✅
- Lines: 99.23% ✅
- **Uncovered line**: 284

## Analysis of Remaining Uncovered Branch (line 284)

Line 284 (`overallStatus = 'offline'`) is in the second loop of `mergePresenceState`:

```typescript
// First loop - filters users
for (const user of room.users.values()) {
  const timeSinceLastSeen = now - user.lastSeen;
  if (timeSinceLastSeen >= REMOVAL_THRESHOLD_MS) {
    continue;  // Skip inactive users
  }
  // ... adds user to userMap
}

// Second loop - calculates status
for (const [userId, { devices, primary }] of userMap) {
  let overallStatus: PresenceStatus = 'offline';
  const timeSinceLastSeen = now - primary.lastSeen;
  
  if (timeSinceLastSeen >= REMOVAL_THRESHOLD_MS) {
    overallStatus = 'offline';  // LINE 284 - UNREACHABLE
  } else if (timeSinceLastSeen >= IDLE_THRESHOLD_MS) {
    overallStatus = 'idle';
  } else {
    overallStatus = 'active';
  }
}
```

**Root Cause**: Users with `timeSinceLastSeen >= 120000` are filtered out in the FIRST loop (skipped via `continue`). They are never added to `userMap`. Therefore, in the SECOND loop, all users have `timeSinceLastSeen < 120000`, making the condition `timeSinceLastSeen >= REMOVAL_THRESHOLD_MS` always false.

**Conclusion**: Line 284 is **dead code** - it can never be executed through any code path. The `overallStatus = 'offline'` at line 284 is redundant with the initialization `let overallStatus: PresenceStatus = 'offline'` at line 278.

## Recommendations

1. **Code Fix Required**: The dead code at line 284 should be removed. The initialization at line 278 already sets `overallStatus = 'offline'`, and since users with stale timestamps are filtered in the first loop, the if-branch at line 284 can never be true.

2. **Alternative**: If the intent was to handle a different scenario (e.g., a user becomes stale between the two loops due to async operations), the code logic would need restructuring.

3. **Current Workaround**: If line 284 cannot be removed from source (e.g., due to feature flag concerns), consider using `/* istanbul ignore if */` to exclude it from coverage, or lowering the branch coverage threshold to 96% for this file.

## Other Uncovered Branches in Project

| File | Line | Branch % | Issue |
|------|------|---------|-------|
| error-boundary.tsx | 36 | 87.5% | Sentry branch (empty/commented body) |
| invite/route.ts | 150, 160 | 94.73% | Error handling branches |
| comments/route.ts | 83 | 96.55% | Error handling |
| events/route.ts | 82 | 96% | Error handling |

## Summary

- **Branch coverage improved**: 95.33% → 96.1% (+0.77%, gained ~2 branches)
- **presence.ts improved**: 90% → 92.85% branch coverage
- **Target not met**: 97% overall branch coverage requires addressing dead code or other files
- **Root cause identified**: Line 284 in presence.ts is unreachable dead code due to first-loop filtering logic
