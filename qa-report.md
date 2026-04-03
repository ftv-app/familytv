# FamilyTV QA Report

**Date:** 2026-03-31  
**Environment:** Production (https://familytv.vercel.app)

---

## Test Results Summary

### ✅ Unit Tests (Local)
```
Test Files: 12 passed
Tests: 169 passed
Duration: ~28s
Status: ALL PASSING ✓
```

### ⚠️ E2E Tests (Production)
```
Total: 75 tests
Passed: 70
Failed: 5
Status: PARTIAL - network timeouts & locator issues
```

---

## Unit Test Results

**All 169 unit tests PASSED** across:
- `error-boundary.test.tsx` (9 tests)
- `theme-toggle.test.tsx` (7 tests)
- `progress-dots.test.tsx` (23 tests)
- API tests: invite, posts, reactions, comments, events, family (83 tests)
- Schema, types, and utility tests (47 tests)

---

## E2E Test Failures

### ❌ `carousel.spec.ts` (3 failures)

1. **`should display CTA buttons regardless of carousel position`**
   - Locator `getByRole('link', { name: /start your family/i })` not found
   - Screenshot: `test-results/carousel-Landing-Page-Caro-1df27-rdless-of-carousel-position-chromium/`

2. **`should display correctly on mobile viewport`**
   - Same locator not found on mobile viewport
   - Screenshot: `test-results/carousel-Landing-Page---Mo-083e4-orrectly-on-mobile-viewport-chromium/`

3. **`should have mobile-friendly navigation`**
   - Strict mode violation: multiple `sign in` links found
   - Screenshot: `test-results/carousel-Landing-Page---Mo-e60d9--mobile-friendly-navigation-chromium/`

### ❌ `invite-flow.spec.ts` (3+ failures)

1. **`should load invite page when familyId is provided`**
   - Timeout: 30000ms exceeded loading `/onboarding/invite?familyId=test-family-123`
   - Network idle wait failing

2. **`should show progress step 3 indicator`**
   - Same timeout issue

3. **`should show invite link or share options when authenticated`**
   - Same timeout issue

---

## Coverage Report

**Status: ✅ ABOVE 90% THRESHOLD**

| Metric | Coverage |
|--------|----------|
| Statements | 99.24% (263/265) |
| Branches | 97.32% (182/187) |
| Functions | 100% (30/30) |
| Lines | 99.23% (261/263) |

**Notes:**
- `app/api/invite/route.ts`: 96.72% - uncovered lines 150, 160
- `components/error-boundary.tsx`: 100% stmts, 87.5% branches (line 36 uncovered)

---

## Additional Bugs Found & Fixed (2026-03-31)

### 🔴 Critical: CSP blocking Clerk JS (caused blank pages)
- **File:** `vercel.json`
- **Symptom:** All `/app/family/*` routes rendered blank — Clerk JS blocked by CSP `script-src`
- **Fix:** Added `https://*.clerk.accounts.dev https://*.clerk.com` to CSP script-src

### 🔴 Critical: Private blob 403 on image posts
- **File:** `src/app/api/upload/route.ts` + `src/components/post-card.tsx` + new `src/app/api/media/route.ts`
- **Symptom:** Uploaded images returned 403 when viewed — private blobs need auth header
- **Fix:** (1) Created `/api/media` proxy route that adds `Authorization: Bearer BLOB_READ_WRITE_TOKEN` server-side; (2) Updated post-card to route blob URLs through `/api/media?url=`

### 🔴 Calendar tab crash
- **File:** `src/components/family-calendar.tsx`
- **Symptom:** "Something went wrong" error on Calendar tab
- **Fix:** Added `"use client"` directive — server components can't have `onMouseEnter`/`onMouseLeave`

### 🔴 Sign-in always redirected to create-family
- **File:** `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`
- **Symptom:** Every sign-in, even for existing users, redirected to onboarding
- **Fix:** Changed `fallbackRedirectUrl` from `/onboarding/create-family` → `/app`

### 🟡 Share moment CTA didn't open modal
- **File:** `src/components/create-post.tsx`
- **Symptom:** "Share your first memory" empty state link pointed to `#create-post` but trigger card had no id
- **Fix:** Added `id="create-post"` to the trigger Card

---

## Issues Requiring Attention

1. **Landing page CTA locators** - The "Start your family" link is not being found by the E2E tests. May need selector update or element render check.

2. **Mobile navigation test** - Strict mode violation due to duplicate "Sign in" links in both header banner and main content.

3. **Invite flow timeouts** - Production environment `/onboarding/invite` routes timing out at `networkidle`. Likely needs timeout adjustment or `load` wait strategy instead.

---

## Recommendations

1. Fix landing page CTA selectors
2. Use `.first()` or more specific locators for duplicate element issue
3. Consider changing `waitUntil: "networkidle"` to `"load"` in invite-flow tests
