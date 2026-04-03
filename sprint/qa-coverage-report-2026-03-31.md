# QA Coverage Report - 2026-03-31

## Summary
Branch coverage brought from **87.04% → 95.72%**, exceeding the 90% threshold.

## Before/After Coverage by Route

| Route | Before Lines | After Lines | Before Branches | After Branches | Status |
|-------|-------------|-------------|-----------------|----------------|--------|
| `app/api/comments/route.ts` | 87.23% | 100% | 72.41% | 96.55% | ✅ PASS |
| `app/api/reactions/route.ts` | 86.66% | 100% | 76.92% | 100% | ✅ PASS |
| `app/api/invite/route.ts` | 93.44% | 96.72% | 89.47% | 94.73% | ✅ PASS |

## Overall Coverage
- **Statements**: 99.24% (was 93.96%)
- **Branches**: 95.72% (was 87.04%) ✅
- **Functions**: 100%
- **Lines**: 99.23% (was 93.91%)

## Tests Added

### `src/test/api/comments.test.ts` (+7 tests → 17 total)
Added error branch tests:
- `GET: returns 404 when post not found`
- `GET: returns 403 when user is not a family member (GET)`
- `POST: returns 404 when post not found`
- `POST: returns 403 when user is not a family member (POST)`
- `DELETE: returns 404 when comment not found`
- `DELETE: returns 403 when user is not a family member (DELETE)`
- `POST: uses email address as author name when firstName is missing`

### `src/test/api/reactions.test.ts` (+6 tests → 15 total)
Added error branch tests:
- `GET: returns 404 when post not found`
- `GET: returns 403 when user is not a family member (GET)`
- `POST: returns 404 when post not found`
- `POST: returns 403 when user is not a family member (POST)`
- `DELETE: returns 404 when post not found (DELETE)`
- `DELETE: returns 403 when user is not a family member (DELETE)`

### `src/test/api/invite.test.ts` (+3 tests → 18 total)
Added error branch tests:
- `PATCH: returns 400 when invite already used or revoked (PATCH)`
- `PATCH: returns 400 when invite is expired (PATCH)`
- `PATCH: returns 400 when user is already a member of the family (PATCH)`

## Remaining Uncovered Branches (below 100%)

### `app/api/comments/route.ts` - Line 83
```typescript
const authorName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "Family Member";
```
Branch `user?.emailAddresses?.[0]?.emailAddress` not fully exercised.

### `app/api/invite/route.ts` - Lines 150, 160
- Line 150: GET handler - invite not found 404
- Line 160: GET handler - non-pending invite 400

### `app/api/events/route.ts` - Line 82
### `app/api/posts/route.ts` - Lines 65, 89

These are below 100% but above 90% threshold.

## Test Execution
```
12 test files passed
167 tests passed
```
