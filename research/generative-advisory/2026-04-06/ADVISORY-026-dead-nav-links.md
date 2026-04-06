# ADVISORY 026: AppShell nav links to non-existent routes — users hit dead ends
**Severity:** P1 | **Generated:** 2026-04-06 | **Time Horizon:** This sprint

## Signal
`src/components/app-shell.tsx` hardcodes nav items:
```javascript
const navItems = [
  { href: "/app", icon: Home, label: "Dashboard" },      // ✅ EXISTS
  { href: "/app/family", icon: Users, label: "Family" },    // ❌ 404 — no such route
  { href: "/app/calendar", icon: Calendar, label: "Calendar" }, // ❌ 404 — no such route
  { href: "/app/settings", icon: Settings, label: "Settings" }, // ✅ EXISTS at /app/settings
];
```

No calendar page exists anywhere in the codebase. The `/app/family` route doesn't exist either — it should be `/app/family/${familyId}`.

## Risk
**High.** Users who click "Family" or "Calendar" in the header get 404 pages. This happens on every page in the app (AppShell wraps everything). This is the primary navigation of the product — it's broken.

## Root Cause
Nav was written with placeholder routes that were never implemented. The dashboard correctly uses family-scoped routes (`/app/family/${familyId}`) but AppShell nav doesn't know the familyId — it's a static list with no family context.

## Recommendation
**Option A — Quick fix (30 min):** Make AppShell family-aware. On mount, fetch user's families, set selected family, build nav links dynamically.

**Option B — Proper fix (2h):** Build the missing pages:
- `/app/family/${familyId}` — family home with members + recent activity
- `/app/calendar` — calendar view with events (or at minimum a redirect)
- `/app/settings` is already correct

Option B is the right long-term answer. This is a P1 sprint blocker.

## Status
- [ ] OPEN — needs tech-lead or frontend-dev to fix
