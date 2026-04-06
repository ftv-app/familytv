**Severity:** P2 — UX / User anxiety

**Description:**
The "Welcome back" splash screen (shown after sign-in and on `/app` routes before redirect) shows no loading indicator. Users see a static black screen with just text — if the app is processing, the user cannot tell if it's working or frozen.

**Root cause:**
The signed-in redirect in `AppShell` shows the FamilyTV header/nav immediately but the content (dashboard data) takes time to load from the server. There's no skeleton loader, spinner, or progress indication during this transition.

**Fix:**
1. Add a subtle skeleton loader to the dashboard while data fetches (next/dynamic with loading.tsx)
2. Or add a thin animated progress bar at the top of the page during navigation
3. Add a loading.tsx to the dashboard route group for Next.js loading UI
4. Ensure the Clerk `<UserButton>` has a loading state while auth resolves

**Labels:** UX, P2, accessibility
