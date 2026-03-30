# Sprint 003 Test Fixes - March 30, 2026

## Summary
Fixed 49 failing unit tests in FamilyTV Next.js project. All 151 tests now pass.

## Issues Fixed

### 1. src/test/api/comments.test.ts - Hoisting Issue
**Problem:** `ReferenceError: Cannot access 'mockDb' before initialization`
**Cause:** `vi.mock` is hoisted to top of file, but `mockDb` was defined after it. The factory function tried to reference `mockDb` before it existed.
**Fix:** Moved `mockDb` definition INSIDE the `vi.mock` factory function to ensure proper scoping.

### 2. src/test/api/reactions.test.ts - Missing Import
**Problem:** `ReferenceError: db is not defined` at lines 116, 177
**Cause:** Test used `vi.mocked(db.query.posts)` but `db` was never imported from "@/db".
**Fix:** Added `import { db } from "@/db";` at top of test file.

### 3. src/test/api/reactions.test.ts - GET Test Missing Mocks
**Problem:** GET test returned 404 instead of 200
**Cause:** Route first checks `db.query.posts.findFirst` to verify post exists, then `db.query.familyMemberships.findFirst` for membership. Test didn't mock these.
**Fix:** Added mocks for `db.query.posts.findFirst` and `db.query.familyMemberships.findFirst` in the GET test.

### 4. src/test/api/comments.test.ts - DELETE Test Mock Issue
**Problem:** Test tried to access `mockDb.query.comments` at runtime, but `mockDb` was now inside factory.
**Cause:** Test was reassigning `mockDb.query.comments` to set up different mocks for `findFirst` vs `findMany`.
**Fix:** Changed test to use `mockCommentsFindFirst` directly instead of trying to modify `mockDb`.

### 5. src/test/api/invite.test.ts - Parameter Name Mismatch
**Problem:** 7 tests failing with wrong error messages (e.g., "inviteId required" instead of "Token required")
**Cause:** GET route uses `inviteId` parameter, but tests sent `token` parameter.
**Fix:** Changed all GET tests to use `inviteId` instead of `token`.

### 6. src/test/api/invite.test.ts - POST Mock Return Value
**Problem:** POST returned 201 but `invite.id` was undefined
**Cause:** Mock's `.returning()` returned empty array `[]`
**Fix:** Updated mock to return `[{ id: "invite_new_123" }]` from `.returning()`

### 7. src/test/api/invite.test.ts - PATCH Token Hash Mismatch
**Problem:** PATCH returned 400 instead of 200
**Cause:** Route verifies token by hashing it and comparing to stored `tokenHash`. Test sent `token: "some_token"` but invite's `tokenHash` didn't match the mock crypto's output.
**Fix:** Set `tokenHash: "hashed_token_value"` in the mock invite to match what mock `createHash` returns.

## Test Results
- **Before:** 49 failing tests
- **After:** 0 failing tests, 151 passing tests
- **Test Duration:** ~21 seconds

## Files Modified
- `src/test/api/comments.test.ts`
- `src/test/api/reactions.test.ts`
- `src/test/api/invite.test.ts`

## Key Takeaways
1. `vi.mock` is hoisted to top of file - any variables it references must be defined within the factory or be available at module scope before the mock runs
2. When mocking drizzle queries, ensure ALL query methods used by the route are properly mocked (not just the final one in the chain)
3. When route parameters differ between implementations and tests, tests must match the actual route behavior
4. Token hash verification in mocks requires matching the expected hash output
