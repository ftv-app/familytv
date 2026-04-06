# Bug: /app routes crash with "Rendered more hooks than during the previous render"

**Severity:** P1 — All authenticated app routes are broken

**Description:**
All `/app` routes (`/app`, `/app/family-feed`, `/app/settings`, `/app/calendar`) render a full-page error overlay:
```
Error: Rendered more hooks than during the previous render.
```

This affects 100% of authenticated users on all app routes. The error appears as a red overlay blocking all content.

**Reproduction:**
1. Sign in at /sign-in
2. Navigate to any /app route (e.g. /app, /app/family-feed, /app/settings, /app/calendar)
3. Observe: Full-page red error overlay with the hooks error

**Root cause hypothesis:**
A React hooks rules violation — likely a conditional hook call or an early return before hooks are called in a component used by the app shell or page layouts. This could be in `AppShell`, a middleware, or a page component.

**Screenshots:**
- /app — hooks_error_app.png
- /app/family-feed — hooks_error_family_feed.png  
- /app/settings — hooks_error_settings.png
- /app/calendar — hooks_error_calendar.png

**Fix:**
1. Audit all components used in /app routes for React hooks violations
2. Check AppShell and any auth-gated layout components
3. Look for conditional hook calls or early returns before useState/useEffect
4. Add exhaustive-deps ESLint rule to catch these in CI

**Labels:** bug, P1
