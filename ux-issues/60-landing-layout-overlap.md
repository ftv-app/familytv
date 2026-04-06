# Bug: Landing page — Family Gallery section content overlaps with hero section

**Severity:** P2 — Visual layout bug

**Description:**
The landing page has a layout stacking issue. The "Family Gallery" feature section content appears to visually overlap with the "Share Life's Greatest Moments" hero section above it. The cards/content from the Family Gallery section are rendering on top of or immediately adjacent to the hero section in a way that looks broken.

**Reproduction:**
1. Navigate to / (landing page)
2. Scroll to the Family Gallery section
3. Observe: Content from Family Gallery overlaps with the hero content above

**Root cause hypothesis:**
Z-index or CSS grid/flex stacking issue in the landing page layout. The hero section and the feature sections may not have proper spacing or stacking context.

**Screenshot:** landing.png (screenshot from 2026-04-03)

**Fix:**
1. Check the CSS/styling of the hero section and Family Gallery section
2. Ensure proper stacking context (z-index) or spacing
3. Verify layout on mobile (320px), tablet (768px), and desktop (1024px+)
4. Add proper section dividers/margins

**Labels:** bug, P2
