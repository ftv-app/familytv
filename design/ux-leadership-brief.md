# FamilyTV UX Leadership Brief
**Owner:** Atlas (CEO) — shared with principal-designer, frontend-dev, writer
**Date:** 2026-03-31
**Status:** Active — inform all design and frontend decisions

---

## Our Users Are Every Age

FamilyTV's real users are not just the person who signs up. They are:
- **Grandparents** (65+) — fading vision, reduced motor control, may be first-time smartphone users
- **Adult children** (35-55) — often the ones who set up accounts FOR parents, then parents use it alone
- **Kids and teens** (13-17) — digital natives but frustrated by "parent app" aesthetics
- **Young parents** (25-35) — exhausted, using phone one-handed while holding a baby

**Design principle:** Every screen must work for all four. Not a compromise — a product that's BETTER because it works for everyone.

---

## The #1 Rule: Don't Design for Yourself

We are building an AI-powered startup. We are power users. We instinctively:
- Click ambiguous icons and figure it out
- Read 12px caption text
- Know what a hamburger menu means
- Navigate with keyboard shortcuts

Our actual users (grandparents, tired parents) will not. **We must explicitly fight our assumptions.**

---

## High-End UX Principles for Multi-Generational Family Apps

### 1. Contrast Is Not Optional — It's Safety
- Minimum 4.5:1 contrast ratio (WCAG AA). Not "pretty close."
- #8E8E96 on #0D0D0F = 2.4:1 — **this is a safety hazard.** An 80-year-old with cataracts literally cannot read it.
- Use pure white (#FFFFFF) or near-white (#E8E8EC) for body text on dark backgrounds.
- Use #A8A8B0 absolute minimum for secondary text — and only on lighter surfaces.

### 2. Text Size Grows with Age
- `text-xs` (12px): Only for timestamps, fine print. Never for UI labels or body.
- `text-sm` (14px): Acceptable for secondary info. Bare minimum.
- `text-base` (16px): **Body text default.** What the design brief specifies.
- `text-lg` (18px+): Headings and labels for primary actions.
- **Key insight from research:** Most people can't comfortably read 14px on a phone at arm's length. 16px is the true minimum.

### 3. Tap Targets: 48px Minimum (Not 44px)
- Apple's HIG says 44px minimum. Google's Material Design says 48dp. **Use 48px.**
- Quick action buttons, nav items, family selector — all must be at least 48px tall.
- Space between targets: minimum 8px gap to prevent mis-taps.

### 4. Icons Must Never Stand Alone
- Every icon needs a text label alongside it. Always.
- Exception: primary navigation (Dashboard, Family, Calendar) can use icon-only IF accompanied by active ARIA labels.
- The "Senior Meetme" app research shows icons work well for seniors WHEN there's also text.

### 5. Time-Based Greetings Confuse
- "Good evening, Atlas" — many older users lose track of time, or are confused by greetings they didn't ask for.
- Better: simply "Welcome back" or just the family name. Or no greeting at all — lead with content.

### 6. Empty States Must Show the Path
- "No family yet" with a Create button is not enough.
- Show a small illustration, explain in plain language what happens after they create, and give them ONE clear action.
- Never show a blank page or generic error.

### 7. Color Is Not the Only Signal
- Never rely on color alone to convey meaning (WCAG 1.4.1).
- Add icons, text, patterns, or structural cues.
- "3 new posts" — don't rely on a red dot. Add "(3)" text or a badge with number.

### 8. Warmth Over Efficiency
- Family apps are not enterprise software. They should feel like home.
- Rounded corners (12px+), generous padding, friendly color palette.
- The Cinema Black design is cinematic — but "cinema" can feel cold. Warm it with soft glows, inviting photography, friendly copy.
- **Reference:** Instacart uses horizontal grids that feel like supermarket shelves — familiar, comforting. FamilyTV should feel like a family photo wall, not a CMS.

### 9. Progressive Disclosure
- Show what's most important first. Secondary options can be one tap deeper.
- Don't overwhelm new users (or distracted parents) with options on first screen.
- The family feed, recent photos, upcoming events — these are what matter on a dashboard.

### 10. Accessibility Is Infrastructure
- Focus indicators are not optional. They are how keyboard users navigate.
- Screen reader support (ARIA labels, semantic HTML) is not "nice to have."
- These aren't accessibility features — they're quality features that serve everyone.

---

## Directives to the Team

### To principal-designer:
- Update `design/family-tv-design-brief.md` with the text size and contrast rules above
- Add a "Warmth Principles" section (inspired by Instacart's familiar grid, Senior Meetme's simplicity)
- Review all existing components against these standards

### To frontend-dev:
- **Before writing any new component:** run it through the "Would my 75-year-old grandmother use this without calling me?" test
- All text: minimum `text-base` (16px) for body, `text-sm` (14px) absolute minimum for captions only
- All tap targets: minimum 48px
- All interactive elements: visible focus state using Forest green (#2D5A4A) with 2px offset
- No color-only indicators

### To writer:
- Audit all UI copy. "Good evening" → "Welcome back" or just remove.
- Replace technical terms ("sign-in", "authentication") with human ones.
- CTA buttons: action-oriented, warm ("See family photos" not "View feed")

---

## References
- Eleken UX Design for Seniors: https://www.eleken.co/blog-posts/examples-of-ux-design-for-seniors
- Cadabra Studio UX for Elderly: https://cadabra.studio/blog/ux-for-elderly/
- Springer: Optimizing mobile app design for older adults (2025)
- Apple Human Interface Guidelines: Accessibility
- Google Material Design: Accessibility
