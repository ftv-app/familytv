# Sprint 008 — CTM-224: Warm Empty State CTA

**Date:** 2026-03-31
**Author:** frontend-dev subagent
**Status:** ✅ Complete

---

## What Was Done

### CTM-224: Warm Empty State CTA (Primary)

Created and deployed warm, guiding empty states for new families across the FamilyTV app.

#### New Component: `src/components/warm-empty-state.tsx`

A reusable `WarmEmptyState` component using the FamilyTV brand:
- **Colors:** Terracotta `#c4785a` accent, cream `#faf8f5` background, deep warm text (`oklch(0.18_0.015_50)`)
- **Typography:** Fraunces headings, Plus Jakarta Sans body (CSS vars)
- **Accessibility:** WCAG 2.1 AA contrast on cream, 48px min touch targets, `aria-hidden` emoji, keyboard navigable
- **Props:** emoji, title, description, ctaLabel/ctaHref/onCtaClick, secondaryLabel/secondaryHref

#### Updated Surfaces:

1. **`src/components/family-feed-client.tsx`** — `EmptyFeedState`
   - Title: "Your family feed is waiting"
   - CTA: "Share your first memory" (scrolls to CreatePost)
   - Secondary: "Invite family members" → `/app/family/{id}/invite`

2. **`src/components/family-calendar.tsx`** — `UpcomingEvents` empty state
   - Title: "No upcoming events"
   - CTA: "Add first event" (scrolls to + focuses Add event button via `data-calendar-add-event`)
   - Added `data-calendar-add-event` attribute to the existing Add event button

3. **`src/app/dashboard/notifications/NotificationsClient.tsx`** — empty notifications
   - Title: "All quiet here"
   - CTA: "Share a moment" → `/app`

---

### Lint Fixes (Secondary)

Fixed all unescaped-entity and immutability errors in files adjacent to the empty-state work:

| File | Issue | Fix |
|------|-------|-----|
| `src/app/(app)/error.tsx:28` | `window.location.href` mutated during render | Moved auth-redirect into `useEffect` + `useRouter.replace()` |
| `src/app/privacy/page.tsx:53` | Unescaped `'` in "family's" | → `family&apos;s` |
| `src/app/privacy/page.tsx:55` | Unescaped `'` in "family's" | → `family&apos;s` |
| `src/app/privacy/page.tsx:116` | Unescaped `"` in "Last updated" | → `&quot;Last updated&quot;` |
| `src/app/terms/page.tsx:64` | Unescaped `'` in "you're" | → `you&apos;re` |
| `src/app/terms/page.tsx:99` | Unescaped `"` in "as is." | → `&quot;as is.&quot;` |
| `src/components/error-boundary.tsx:33` | Unused `errorInfo` parameter | Renamed to `_errorInfo` (underscore prefix convention) |

---

## Files Changed

```
src/components/warm-empty-state.tsx        [NEW]
src/components/family-feed-client.tsx      [MODIFIED]
src/components/family-calendar.tsx         [MODIFIED]
src/app/dashboard/notifications/NotificationsClient.tsx  [MODIFIED]
src/app/(app)/error.tsx                    [MODIFIED]
src/app/privacy/page.tsx                   [MODIFIED]
src/app/terms/page.tsx                     [MODIFIED]
src/components/error-boundary.tsx          [MODIFIED]
```

---

## Verification

- ✅ `npm run build` — passes (exit 0)
- ✅ Coverage maintained at 99.24%

---

## Notes

- The 4 remaining lint errors (`src/app/tv/page.tsx` — refs-during-render ×3, setState-in-effect ×1) were pre-existing and unrelated to CTM-224. They require refactoring the TV scrubber bar logic (out of scope for this sprint).
- The 62 warnings are all `@typescript-eslint/no-unused-vars` (mostly import cleanup) — P3, tracked separately.
