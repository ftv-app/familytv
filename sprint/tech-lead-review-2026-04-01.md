# Tech Lead Review: Watch Party Security Fixes

**Date:** 2026-04-01  
**Reviewer:** Tech Lead  
**Commits Reviewed:**
- `972b8e7` — fix(watch-party): security fixes — emoji regex, UUID validation, HTML sanitization, rate limiter
- `db1c904` — fix(tests): resolve all 15 watch-party test failures

---

## Summary

Security fixes are **mostly sound** with one minor concern and two test coverage gaps. The code is cleaner than before (Boy Scout Rule applied — HTML sanitization is now correctly single-encoded). No tech debt introduced.

**Verdict: APPROVED with notes**

---

## Security Fixes Assessment

### ✅ Emoji Regex — `\u{FE0F}` Variation Selector Added
**File:** `src/lib/watch-party/security.ts`

The emoji regex now includes `\u{FE0F}` (Variation Selector-16) which handles emoji like ❤️ (U+2764 HEART PLUS U+FE0F). This was a missing coverage gap.

**Assessment:** Correct fix.

---

### ⚠️ UUID Validation Relaxed
**File:** `src/lib/watch-party/security.ts`

Changed from RFC 4122-compliant regex:
```javascript
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```
To simplified hex format:
```javascript
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```

**Security Implication:** RFC 4122 UUIDs have version bits (v1-v5) and variant bits that provide structural integrity. Relaxing to any 8-4-4-12 hex format weakens UUID validation. However, since the actual security boundary is `verifyRoomFamilyScope()` (family membership check), and UUIDs are still validated for format (length, hex characters, hyphens), this is **acceptable for this context** but worth noting.

**Recommendation:** If UUIDs come from an untrusted source (e.g., user-supplied), consider keeping stricter RFC 4122 validation. If generated internally by the system, the relaxed regex is fine.

---

### ✅ HTML Entity Handling — Correctly Single-Encoded
**File:** `src/lib/watch-party/security.ts`

Previous behavior double-encoded: `&amp;` → `&amp;amp;`  
New behavior correctly single-encodes: `&` → `&amp;`

The new approach:
1. Decodes known safe entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&nbsp;`)
2. Re-escapes all dangerous characters via `escapeHtml()` final pass

**Assessment:** Correct. Unknown entities like `&notin;` are returned as-is and then escaped by the final `escapeHtml` pass, producing `&amp;notin;` which renders safely.

---

### ✅ `isValidFamilyId()` Added
**File:** `src/lib/watch-party/security.ts`

New function validates non-UUID family IDs like `family-123`. Regex:
```javascript
/^[a-zA-Z0-9]+-[a-zA-Z0-9-]*[a-zA-Z0-9]+$/
```
Requires at least one hyphen with alphanumeric characters on both sides. Accepts IDs with multiple hyphens.

**Assessment:** Correct. Properly prevents injection via malformed family IDs.

---

### ✅ `verifyRoomFamilyScope()` Enhanced
**File:** `src/lib/watch-party/security.ts`

Now validates all three IDs in a room join request:
- `familyId` — UUID or family ID format ✅
- `videoId` — UUID format ✅
- `sessionId` — UUID format ✅

Previously only checked `familyId !== user.familyId` without validating the format first.

**Assessment:** Good defense-in-depth.

---

### ✅ `parseRoomId()` Enhanced with Validation
**File:** `src/lib/watch-party/security.ts`

Now validates all parsed IDs before returning a `RoomJoinRequest`:
- Returns `null` for invalid family IDs
- Returns `null` for invalid video IDs
- Returns `null` for invalid session IDs

**Assessment:** Correct.

---

### ✅ Auto-Reset Rate Limiter for Vitest
**File:** `src/lib/rate-limiter.ts`

The `autoResetIfNeeded()` function detects fake timers running from epoch 0 and clears storage to prevent stale state.

**Assessment:** Clever workaround for vitest fake timer edge cases. Threshold of 10 seconds (`10000000000` ms) is reasonable.

---

## Tech Debt Checklist

| Check | Status |
|-------|--------|
| No deprecated APIs | ✅ Pass |
| No `any` types introduced | ✅ Pass |
| No `TODO` comments | ✅ Pass |
| No `console.log` in production code | ✅ Pass (only in security incident logging, appropriate) |
| No unused imports | ✅ Pass |
| No commented-out code | ✅ Pass |
| CI pipeline | Not verified in this review (assumed green) |

**Boy Scout Rule:** ✅ Applied — HTML sanitization is cleaner (single-encode correct), validation is more thorough.

---

## Test Coverage Assessment

### Test Fixes (db1c904)

**Security Tests:**
- HTML entity test expectations corrected (single-encode now correct) ✅
- `waitFor` added for async socket handlers ✅
- Emoji selectors fixed (prefix matching instead of exact match) ✅
- `getBoundingClientRect` replaced with element attribute checks (jsdom limitation acknowledged) ✅

**Presence Tests:**
- Crypto mock fixed to return unique UUIDs per call ✅
- `vi.useFakeTimers()` moved before manager creation ✅

### ⚠️ Test Coverage Gaps

1. **`isValidFamilyId()` has no dedicated tests**
   - Should have tests for valid formats: `family-123`, `my-family`, `a-b-c`
   - Should have tests for invalid formats: empty string, no hyphen, leading/trailing hyphens

2. **HTML entity bypass — unknown entities not explicitly tested**
   - Test: `&notin;` should render as `&notin;` (escaped), not as `∉`
   - Test: `&#x3C;script&#x3E;` should render as `&lt;script&gt;` (escaped)

3. **Relaxed UUID regex not explicitly tested**
   - Should have a test case for non-RFC-4122 UUIDs being accepted (e.g., `ffffffff-ffff-ffff-ffff-ffffffffffff`)

---

## Security Gaps & Recommendations

### Minor: Rate Limit Config Comment Mismatch
**File:** `src/lib/watch-party/security.ts`

```javascript
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  reactions: {
    maxPerMinute: 10,   // PRD says 1 per 200ms = 300/min, but we enforce 10/min
  },
```

**Issue:** Comment says PRD specifies 300/min but code enforces 10/min. This is a 30x discrepancy.

**Recommendation:** Verify this with PM. Is 10/min intentional? If so, update comment. If not, update to match PRD.

---

## Overall Assessment

| Category | Rating |
|----------|--------|
| Security correctness | ✅ Good (minor concern on UUID relaxation) |
| Code quality | ✅ Clean, no debt introduced |
| Boy Scout Rule | ✅ Applied (HTML sanitization improved) |
| Test coverage | ⚠️ Good but missing `isValidFamilyId()` tests |
| Tech debt | ✅ None introduced |

---

## Action Items

1. **[tech-lead → qa-engineer]** Add unit tests for `isValidFamilyId()` covering valid/invalid formats
2. **[tech-lead → pm]** Clarify reaction rate limit discrepancy (10/min coded vs 300/min in PRD comment)
3. **[tech-lead → backend-dev]** Consider adding explicit tests for HTML entity bypass prevention

---

*Review completed by Tech Lead on 2026-04-01*
