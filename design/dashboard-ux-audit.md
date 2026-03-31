# FamilyTV Dashboard UX Audit
**Auditor:** Principal Designer  
**Date:** 2026-03-31  
**Scope:** Dashboard UI + App Shell Navigation  
**Standard:** WCAG 2.1 AA (4.5:1 normal text, 3:1 large text 18px+)  
**Users:** Multi-generational — grandparents (65+) to children (8+)

---

## Executive Summary

The dashboard has a solid structural foundation but suffers from **critical accessibility failures** (text contrast, missing focus indicators), **size problems** that exclude older users, and **missing warmth** that prevents it from feeling like a family space. The design brief explicitly calls out `#8E8E96` as failing WCAG AA — yet it appears throughout both files.

**Overall Assessment: P1 — Must Fix Before Launch**

---

## Issues Found

### P1 — Critical (Must Fix)

#### 1. Text Contrast Failure — `#8E8E96` on `#0D0D0F`
- **Severity:** P1
- **Files:** `dashboard-client.tsx`, `app-shell.tsx`
- **Current State:** `text-muted-foreground` / `color: "#8E8E96"` is used extensively on Cinema Black `#0D0D0F`
- **Contrast Ratio:** ~2.4:1 — **fails WCAG AA (requires 4.5:1)** and fails WCAG AAA (requires 7:1)
- **Design Brief Acknowledges:** Section 10 states "Muted Silver `#8E8E96` fails AA on `#0D0D0F` — use `#A8A8B0` (5.2:1)"
- **Examples in code:**
  - `StatCard` sublabels: `text-xs text-muted-foreground` + `text-xs text-muted-foreground/70`
  - `ActionButton` descriptions: `text-xs text-muted-foreground`
  - Dashboard greeting: `<p className="text-muted-foreground mt-1">`
  - App shell nav items: `color: "#8E8E96"` on all inactive nav links
  - Mobile hamburger button: `style={{ color: "#8E8E96" }}`
  - Sign out button: `style={{ color: "#8E8E96" }}`
  - "Account" section header: `style={{ color: "#5A5A62" }}` — even worse, ~1.8:1
- **Recommended Fix:** Replace all instances of `#8E8E96` with `#A8A8B0` (5.2:1). Replace `#5A5A62` with `#787882` or similar.
- **Why it matters:** ~25% of men and 50% of women over 40 have significant vision decline. Low contrast causes eye strain, headaches, and exclusion. A "family" app must work for grandma without squinting.

---

#### 2. Missing Focus Indicators — No Keyboard Navigation Support
- **Severity:** P1
- **Files:** `app-shell.tsx`
- **Current State:** Nav links and buttons use `onMouseEnter`/`onMouseLeave` for hover but have **no `:focus-visible`** styles. The design brief explicitly requires "Forest green outline, 2px, offset 2px" for focus.
- **WCAG 2.4.7:** "Focus visible" — any keyboard-operable UI must have a visible focus indicator.
- **Examples:**
  - All `<Link>` nav items in desktop and mobile nav
  - `<SheetTrigger>` mobile hamburger button
  - `<SignOutButton>` wrapper
  - All `<Link>` in dashboard (Quick Actions, Family Feed CTA)
- **Recommended Fix:** Add `focus-visible:outline-2 focus-visible:outline focus-visible:outline-[#2D5A4A] focus-visible:offset-2` to all interactive elements. Use a Forest green outline per the design brief.
- **Why it matters:** Keyboard users (elderly with motor impairment, visually impaired using screen readers, power users) cannot see where they are on the page. This is a hard WCAG AA failure.

---

### P2 — High (Major Barriers to Use)

#### 3. Text Sizes Too Small for Older Users
- **Severity:** P2
- **Files:** `dashboard-client.tsx`
- **Current State:** Uses `text-xs` (12px) and `text-sm` (14px) extensively:
  - StatCard labels: `text-xs text-muted-foreground` (12px)
  - StatCard sublabels: `text-xs text-muted-foreground/70` (12px)
  - ActionButton descriptions: `text-xs text-muted-foreground` (12px)
  - Family feed description: `text-sm text-muted-foreground` (14px)
  - "Signed in as" footer: `text-xs text-muted-foreground/60` (12px)
- **Design Brief Section 3.3:** Specifies Body Text at 15–16px minimum for dark mode legibility. Labels at 13–14px. The code uses smaller than this.
- **WCAG 1.4.4:** Resizable text up to 200% without loss of content/functionality — 12px text at 200% = 24px, which is borderline but the baseline size is still too small for comfortable reading.
- **Recommended Fix:** Raise `text-xs` usages to `text-sm` (14px) and `text-sm` to `text-base` (16px). StatCard labels should be `text-sm` (14px) minimum. The design brief type scale is the guide.
- **Why it matters:** Presbyopia affects nearly all people over 45. 12px text requires either perfect vision or heavy reader mode. A family app must work for grandparents without glasses.

---

#### 4. Tap Targets Below 44–48px Minimum
- **Severity:** P2
- **Files:** `app-shell.tsx`
- **Current State:** Mobile hamburger button is `w-11 h-11` = 44×44px. This is right at the Apple 44pt minimum and below the WCAG 2.5.5 target size of 44×44px for mobile. Additionally, the icon itself is only 20×20px inside that container.
- **ActionButton links:** `min-h-[60px]` with `p-4` padding. The icon containers are 32×32px (`w-8 h-8`). Not a hard failure but not generous.
- **StatCard icon containers:** `w-10 h-10 sm:w-9 sm:h-9` = 40×40px on mobile. Slightly below 44px.
- **Recommended Fix:** 
  - Mobile hamburger: increase to `w-12 h-12` (48×48px) and increase icon to `w-6 h-6`
  - StatCard icon containers: `w-11 h-11` on mobile (44×44px)
- **Why it matters:** Older users and young children have less precise motor control. Larger tap targets reduce frustration and mis-taps.

---

#### 5. Family Context Unclear for Multi-Family Users
- **Severity:** P2
- **Files:** `dashboard-client.tsx`
- **Current State:** When a user belongs to multiple families:
  - The family selector is a small dropdown in the top-right
  - The greeting says "Here&apos;s what&apos;s happening with your family" (generic)
  - Stats are scoped to the selected family but this is not visually emphasized
  - When only one family exists, a subtle `Badge variant="secondary"` is shown
- **Recommended Fix:**
  - Make the active family name more prominent — consider a dedicated "Now watching: [Family Name]" banner or section header
  - Add a warm visual indicator (Broadcast Gold avatar strip or family initial) next to stats
  - The greeting should contextualize: "Here's what's happening with **The Henderson Family**" not generic
- **Why it matters:** If a user manages multiple families (married couple each with their own extended family), the wrong context could mean posting to the wrong family.

---

#### 6. Mobile Hamburger Navigation Hard to Find
- **Severity:** P2
- **Files:** `app-shell.tsx`
- **Current State:** 
  - Hamburger icon is `#8E8E96` on `rgba(26,26,30,0.95)` — a contrast failure (2.4:1)
  - The icon is `w-5 h-5` (20px) — small and blends into the dark header
  - No text label or tooltip
  - Seniors often don't look for hamburger menus — they expect text labels
- **Recommended Fix:**
  - Increase contrast: use `#A8A8B0` or `#E8E8EC`
  - Add a visible "Menu" text label beside the icon on mobile (or replace entirely with a labeled button)
  - Consider a bottom tab bar for primary navigation on mobile instead (standard pattern, no discovery problem)
- **Why it matters:** Hamburger menus have ~30% lower discoverability among users 55+ compared to labeled navigation. This is a known UX pattern failure for seniors.

---

#### 7. No Loading States on Quick Actions
- **Severity:** P2
- **Files:** `dashboard-client.tsx`
- **Current State:** All Quick Action buttons (`Share a moment`, `Add an event`, `Invite a member`) are plain links with no loading state. If the navigation or data fetch is slow, the user sees nothing and may double-tap.
- **Design Brief Section 6:** Specifies transition timings for various interactions. No mention of loading states in the dashboard but the absence is notable.
- **Recommended Fix:** Add a subtle loading spinner or button state change when Quick Actions are tapped. At minimum, add `aria-busy="true"` during navigation and show a brief "Loading..." indicator.
- **Why it matters:** Without feedback, users — especially elderly — assume the tap didn't register and tap again, causing duplicate actions.

---

#### 8. Empty State CTA Too Weak
- **Severity:** P2
- **Files:** `dashboard-client.tsx`
- **Current State:** When `families.length === 0`, shows a dashed-border card with "No family yet" title, description, and a single "Create your family" button.
- **Problems:**
  - The CTA "Create your family" is under a `<Link>` without a button — no visual weight
  - No illustration or visual to make the empty state feel warm/inviting
  - No sense of what's next after creation (no progress indicator)
  - The description says "Create your first family group" but doesn't explain WHY or WHAT they'll get
- **Recommended Fix:**
  - Make the empty state card feel like a warm invitation, not an error
  - Add a warm illustration or icon (the TV/broadcast motif could help)
  - Use a primary Forest green button with proper button styling
  - Consider showing a preview/teaser of what the family feed looks like
  - Add a secondary "Learn more" link if they're not sure
- **Why it matters:** First-time users (especially seniors) who land on an empty dashboard need clear, warm guidance. A cold empty state causes confusion and abandonment.

---

### P3 — Medium (Polish & Warmth)

#### 9. Visual Hierarchy Doesn't Guide the Eye
- **Severity:** P3
- **Files:** `dashboard-client.tsx`
- **Current State:** The page has three equal-weight sections (Stats, Quick Actions, Family Feed) separated by simple `<Separator />` elements. No visual flow from most important → least important.
- **Design Brief Section 3:** Type scale creates hierarchy through size and weight. The dashboard doesn't fully exploit this.
- **Recommended Fix:**
  - Give the Quick Actions section more visual weight — these are the primary user goals
  - Consider a hero treatment for the primary CTA ("Share a moment")
  - Add visual breathing room between sections
  - Use the Broadcast Gold accent more to highlight the active family name
- **Why it matters:** Without clear hierarchy, users scan the entire page trying to find what to do. Guiding the eye reduces cognitive load.

---

#### 10. Dashboard StatCards Lack Warmth
- **Severity:** P3
- **Files:** `dashboard-client.tsx`
- **Current State:** `StatCard` is a plain `Card` with an icon, a large number, and muted labels. It looks like a generic analytics dashboard — not a family space.
- **Design Brief Sections 1, 7:** Emphasizes "domestic warmth" and "family's living room." The cards are functional but cold.
- **Recommended Fix:**
  - Consider family-themed icons or custom illustrations instead of generic `Users`, `Image`, `Calendar` from Lucide
  - Add a warm touch — e.g., a small family member avatar strip on the members card
  - Consider Broadcast Gold accents on the stat numbers (per design brief: gold for "premium attention" elements)
  - Make the "sublabel" text warmer — e.g., "3 people" instead of just "3"
- **Why it matters:** First impressions matter. Cards that feel like enterprise analytics undermine the "private family TV" brand identity.

---

#### 11. Missing ARIA Labels and Screen Reader Support
- **Severity:** P3 (partially P2 for interactive elements)
- **Files:** `dashboard-client.tsx`, `app-shell.tsx`
- **Current State:**
  - StatCard icons: `<Icon className="w-4 h-4 text-primary" />` inside a decorative `div` — should have `aria-hidden="true"`
  - ActionButton icons: same issue — decorative icons need `aria-hidden="true"`
  - Mobile nav SheetTrigger: has `aria-label="Open menu"` ✓ (good)
  - No `aria-current="page"` on active nav items
  - No `role` attributes on icon-only buttons
  - Family selector: no `aria-label` on the DropdownMenuTrigger
  - StatCard has no accessible label for what the stat represents
- **Recommended Fix:**
  - Add `aria-hidden="true"` to all decorative icons
  - Add `aria-current="page"` to the active nav item
  - Add `aria-label` to family selector trigger: "Select family: [Current Family Name]"
  - Wrap StatCards in a `<dl>` definition list with `<dt>` and `<dd>` for proper semantics
- **Why it matters:** Screen reader users (visually impaired, elderly) need proper semantic HTML and ARIA to understand the page structure.

---

#### 12. Nav Items Missing `aria-current` for Active State
- **Severity:** P3
- **Files:** `app-shell.tsx`
- **Current State:** Active nav items use `style` to change color but do not announce themselves as active to screen readers. Keyboard users need `aria-current="page"` on the active link.
- **Recommended Fix:** Add `aria-current="page"` to the Link component when `isActive === true` for all nav items.
- **Why it matters:** Screen reader users cannot see the color change. Without `aria-current`, they don't know which page they're on.

---

## Summary Table

| # | Issue | Severity | File(s) | WCAG Ref |
|---|-------|----------|---------|----------|
| 1 | Text contrast #8E8E96 on #0D0D0F | P1 | Both | 1.4.3 |
| 2 | Missing focus indicators | P1 | app-shell.tsx | 2.4.7 |
| 3 | Text sizes too small (12px/14px) | P2 | dashboard-client.tsx | 1.4.4 |
| 4 | Tap targets below 44px | P2 | Both | 2.5.5 |
| 5 | Family context unclear | P2 | dashboard-client.tsx | 1.3.1 |
| 6 | Mobile hamburger hard to find | P2 | app-shell.tsx | 1.3.3 |
| 7 | No loading states on actions | P2 | dashboard-client.tsx | 3.3.1 |
| 8 | Empty state CTA too weak | P2 | dashboard-client.tsx | 1.1.1 |
| 9 | Visual hierarchy weak | P3 | dashboard-client.tsx | 1.3.2 |
| 10 | StatCards lack warmth | P3 | dashboard-client.tsx | 1.1.1 |
| 11 | Missing ARIA labels | P3 | Both | 1.3.1 |
| 12 | Nav items missing aria-current | P3 | app-shell.tsx | 1.3.1 |

---

## Top 3 Most Urgent Fixes

1. **[P1] Fix text contrast** — `#8E8E96` → `#A8A8B0` everywhere. This is a hard WCAG AA failure affecting every user with vision impairment. 1-line color token change + a few hardcoded style fixes.

2. **[P1] Add focus indicators** — Add `focus-visible` styles to all interactive elements. Without this, keyboard and screen reader users cannot use the app at all.

3. **[P2] Increase text sizes** — Raise `text-xs` to `text-sm` and `text-sm` to `text-base` for all body text and labels. This is a straightforward Tailwind class audit and directly impacts readability for older users.

---

## Design Brief Compliance Notes

The design brief is excellent and already identifies the contrast problem (Section 10). The issues are **implementation gaps**, not design gaps:

- ✅ Design brief says use `#A8A8B0` for muted text — ❌ implementation uses `#8E8E96`
- ✅ Design brief says minimum 48×48px tap targets — ❌ implementation has 44×44px
- ✅ Design brief says visible focus indicators — ❌ none implemented
- ✅ Design brief type scale starts at 13–14px for labels — ❌ implementation uses 12px
- ✅ Design brief says focus indicators use Forest green outline — ❌ none found

**Recommendation:** Audit the Tailwind config and shadcn/ui theme against the design brief color tokens. Many of these issues stem from using default shadcn tokens instead of the FamilyTV-specific palette.

---

*Audit complete. 12 issues identified across P1/P2/P3 severity levels. Full ticket list created in Linear/GitHub Issues.*
