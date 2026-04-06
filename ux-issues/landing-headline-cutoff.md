**Severity:** P2 — Accessibility / UX

**Description:**
The landing page hero section has a "false floor" effect. The H1 "Your family's private channel" appears to be cut off at the bottom of the viewport with no visual cue that scrolling will reveal more content. Users may believe the headline is incomplete or the page is broken.

**Root cause:**
The hero carousel image and the H1 are separated but visually the H1 looks like it should be above the fold. The gradient overlay at the bottom of the carousel image blends into the H1 section background, creating an ambiguous visual boundary.

**Fix options:**
1. Add a subtle animated scroll indicator (chevron or "scroll" text) below the H1 when content exists below
2. Adjust the hero section layout so the full H1 is visible above the fold on standard laptop screens (768px height)
3. Ensure the gradient transition from carousel to H1 section is more visually distinct

**Screenshot:** see workspace: landing.png

**Labels:** accessibility, UX, P2
