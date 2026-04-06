# ADVISORY 025: brand.css had zero dark mode — auth pages showed warm cream instead of Cinema Black
**Severity:** P1 | **Generated:** 2026-04-05 | **Time Horizon:** Fixed in commit f065683

## Signal
- Sign-in and sign-up pages showing warm cream background (#faf8f5) instead of Cinema Black dark (#0D0D0F)
- next-themes `dark` class correctly applied to `<html>` element (verified in production HTML)
- CSS `.dark { --background: oklch(0.145...) }` rule existed in globals.css but was overridden by brand.css

## Root Cause
`brand.css` had NO dark mode support:
```css
/* brand.css — old, pre-Cinema-Black */
body {
  background-color: #faf8f5;    /* warm cream — hardcoded, no .dark override */
  color: #1e1a17;
}
--color-background: oklch(97%...); /* warm cream — no .dark override */
```

The `.dark` rule in globals.css (setting Cinema Black) was overridden by `brand.css`'s unconditional body rule because:
1. brand.css imported BEFORE globals.css cascade but both have equal specificity
2. `body {}` in brand.css overrides `body { @apply bg-background... }` in globals.css
3. `bg-background` (Tailwind class) resolves to `var(--background)` but brand.css's `background-color: #faf8f5` was set AFTER

Actually: brand.css's `body { background-color: #faf8f5 }` and globals.css's `body { @apply bg-background }` have EQUAL specificity. The cascade order in the CSS file determines which wins. Both are in globals.css (brand.css imported first), so the @apply in globals.css SHOULD win if it comes after the import. But @apply with Tailwind generates actual CSS, and the cascade was broken because both were targeting body.

## Risk
- Every auth page (sign-in, sign-up, onboarding) showed wrong design for weeks
- SEO: "Sign in" pages had cream background — unprofessional for a "TV" product
- User trust: warm cream feels like an unpolished prototype, not a cinema experience

## Fix
commit `f065683`: Added `.dark` block to brand.css that references globals.css dark mode variables. Made body use `var(--background)` instead of hardcoded warm cream.

## Pattern: CSS custom property ownership
brand.css "owned" --color-background but never updated it for dark mode. globals.css "owned" --background with dark mode. These were two separate chains. The fix: brand.css .dark block now references globals.css tokens via `var()`.

## Status
- [x] RESOLVED — commit f065683
