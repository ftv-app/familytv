**Severity:** P2 — Branding / UX

**Description:**
There is no custom 404 page. When users hit a non-existent route (e.g. `/albums`), they see the default Next.js white 404 page ("This page could not be found") which:
1. Breaks the Cinema Black dark theme entirely
2. Has zero branding elements (no logo, no FamilyTV colors)
3. Provides no navigation back to safety (no "Go Home" button)
4. Shows the red "N 1 Issue X" dev overlay (if running dev mode)

**Reproduction:**
Navigate to any non-existent route like `/albums` or `/nonexistent`

**Fix:**
Create `src/app/not-found.tsx` using the FamilyTV dark theme, with:
- FamilyTV logo/header
- "Page not found" message in brand voice
- "Go Home" button
- Link to sign-in if they're not authenticated
- Proper dark background matching the app theme

**Screenshot:** see workspace: albums.png (shows 404)

**Labels:** bug, P2, branding
