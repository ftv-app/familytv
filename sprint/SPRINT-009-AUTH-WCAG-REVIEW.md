# Sprint 009 — Auth Pages WCAG AA Review (Linear #29)

**Reviewer:** tech-lead  
**Date:** 2026-03-31  
**Files reviewed:** `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`

---

## Critical Issues (Fix Before Deploy)

### 1. Muted Tagline Text Fails Color Contrast
**Severity:** Critical (WCAG 1.4.3)  
**Location:** Both pages, lines ~14–15

```tsx
<p className="text-muted-foreground mt-1 text-base">
  Your family is waiting for you
</p>
```

**Problem:** `text-muted-foreground` on `bg-background` = ~3.2:1 contrast ratio. WCAG AA requires **4.5:1 minimum** for normal text.

**Fix:** Darken `--muted-foreground` in design tokens to approximately `oklch(0.35 0.015 50)` or `#78716C` (stone-500). This affects ALL muted text across the app — verify no regressions.

### 2. Missing Skip Navigation Link
**Severity:** Critical (WCAG 2.4.1)  
**Location:** Both pages

**Problem:** No "Skip to main content" link at top of page. Keyboard users cannot bypass repeated navigation.

**Fix:** Add as first focusable element:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Skip to main content
</a>
```
Then add `id="main-content"` to `<main>` element.

---

## Medium Issues (This Sprint)

### 3. Page Wrapper Uses `<div>` Instead of `<main>` Landmark
**Severity:** Medium  
**Location:** Both pages, line ~24

```tsx
return (
  <main className="min-h-screen flex ..." aria-label="Sign in to FamilyTV">
```

**Note:** The code already uses `<main>` here — this is fine. However, the Clerk component wrapper needs `aria-labelledby` pointing to the heading.

### 4. Logo "F" Icon Span Lacks `aria-hidden`
**Severity:** Medium  
**Location:** `src/app/sign-in/[[...sign-in]]/page.tsx`, line ~10

```tsx
<span className="text-primary-foreground font-heading font-bold text-lg">
  F
</span>
```

**Fix:** Add `aria-hidden="true"` since the logo letter is decorative.

### 5. Clerk Component Wrapper Missing `aria-label`
**Severity:** Medium  
**Location:** Both pages, after mounted check

```tsx
<div className="w-full max-w-md">
  <SignIn />
</div>
```

**Fix:** Add `aria-label="Sign in form"` or `aria-labelledby="auth-heading"` and give the heading `id="auth-heading"`.

### 6. Form Error Announcements Unverified
**Severity:** Medium  
**Action:** Manual testing needed with NVDA (Windows) and VoiceOver (macOS). Clerk's hosted UI may announce errors automatically, but must verify.

---

## Summary

| Issue | Severity | WCAG Criterion | Fix Owner |
|-------|----------|----------------|-----------|
| Muted text contrast | Critical | 1.4.3 | designer + frontend-dev |
| Skip navigation | Critical | 2.4.1 | frontend-dev |
| Logo aria-hidden | Medium | 1.1.1 | frontend-dev |
| Clerk wrapper label | Medium | 1.3.1 | frontend-dev |
| Form error announcements | Medium | 3.3.1 | QA (manual test) |

**Recommendation:** Fix critical issues before #29 can be closed. Medium issues can ship in follow-up sprint if time permits.
