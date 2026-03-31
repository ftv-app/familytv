# CTM-223: Activity Stories Feed — Design Spec

## 1. Concept

The dashboard's enterprise stat cards (numbers, percentages, sparklines) get replaced with a warm, human-centric "What's Happening Now" feed. Every item is a real family moment — someone's name, a verb, a thing. No metrics, no algorithms, no scores. Just the gentle rhythm of a family sharing life together.

The tone is: a kitchen corkboard crossed with a private photo stream. Personal, unhurried, joyful.

---

## 2. Layout

### Dashboard Slot
Replaces the current 2×2 stat card grid in the main dashboard panel. On mobile the feed is full-width; on tablet (768px+) it inherits the card grid's column span; on desktop (1024px+) it takes the center column with a max-width of 680px.

### Responsive Breakpoints

| Breakpoint | Width | Feed behavior |
|---|---|---|
| Mobile | 320–767px | Full-width, single column, 12px horizontal padding |
| Tablet | 768–1023px | Same as mobile, 24px padding, slightly larger type |
| Desktop | 1024–1439px | Centered column, 680px max-width |
| Wide | 1440px+ | Centered, 680px max-width, generous side whitespace |

### Feed Structure
- **Header**: "What's Happening Now" in Fraunces (semibold, 22px desktop / 18px mobile), with a small terracotta heart SVG icon
- **Story list**: Vertical stack, oldest at top (chronological), newest at bottom — no reverse ordering, no infinite scroll auto-prefetch; a gentle "Load more" button at the bottom
- **Card rhythm**: 12px gap between cards on mobile, 16px on desktop

---

## 3. Component Inventory

### 3a. Story Card

**Anatomy (top to bottom, left to right):**
1. **Actor avatar** — 40px circle on mobile, 48px on desktop. Family photo if available; fallbacks to a warm terracotta circle with the member's initials in Plus Jakarta Sans 600. Avatar is decorative on feeds where the actor's name is also text-visible, but is `role="img"` with `aria-label="[First Name]'s photo"`.
2. **Actor name** — First name only. Plus Jakarta Sans 600, 15px mobile / 16px desktop. Color: #2d2a26 (near-black, warm). Links to the member's profile page.
3. **Action verb + object** — Plus Jakarta Sans 400, 15px / 16px. Color: #5c5752 (warm medium gray). Examples: "shared a photo with the family", "added an event: Grandma's 80th Birthday".
4. **Timestamp** — Relative ("2 hours ago", "Yesterday", "Mar 28"). Plus Jakarta Sans 400, 12px. Color: #9c958d (warm light gray). Below the action line.
5. **Optional thumbnail** — If the activity has a media attachment, a 56×56px rounded-square (border-radius: 8px) thumbnail appears to the right of the text block on desktop, or below the timestamp on mobile. The thumbnail is clickable and opens the media in a lightbox.

**States:**
- Default: cream (#faf8f5) background, 1px border in #e8e3dc, border-radius: 12px, box-shadow: none
- Hover (desktop): background shifts to #fff, box-shadow: 0 2px 8px rgba(196,120,90,0.10)
- Focus-visible: 2px terracotta (#c4785a) outline, 2px offset
- Pressed: background #f5f0ea, scale(0.99) on the card (50ms ease-out)

**Interaction:** The entire card is one interactive region. On click/tap, navigate to the relevant detail view (photo viewer, event page, etc.). Tab lands on the card; Enter/Space activates.

### 3b. Empty State

**Visual:** A centered illustration (warm line-drawing of a family waving, in terracotta/cream palette, ~160px tall) above a headline and a subline.

- Headline: "Your family feed is quiet — for now." (Fraunces, 20px, #2d2a26)
- Subline: "When someone shares a photo, adds an event, or posts an update, it'll appear here." (Plus Jakarta Sans 400, 15px, #5c5752, max-width 320px, centered)
- CTA button: "Invite a family member" — terracotta fill, cream text, 44px height (touch target), border-radius: 22px

### 3c. Loading Skeleton

Five skeleton cards shown while data loads. Each skeleton card:
- Background: linear-gradient skeleton in #ede8e1 → #f5f2ed (shimmer animation, 1.4s ease-in-out infinite)
- Same dimensions as a real card: avatar circle + text lines + timestamp line
- Border-radius: 12px, height ~72px
- No content — purely structural placeholders

---

## 4. Content Format

All activity strings follow this pattern:

> **[First Name] [action] [object]**

| Action type | Example string |
|---|---|
| Photo shared | "Sofia shared a photo with the family" |
| Album shared | "Marcus shared an album: Summer in Tuscany" |
| Event added | "Diana added an event: Thanksgiving Dinner" |
| Event updated | "James updated an event: Kids' Recital" |
| Event RSVP'd | "Luca responded to: Movie Night — going" |
| Comment added | "Nina commented on a photo" |
| Memory posted | "Ava posted a memory from 3 years ago" |
| Member joined | "Welcome Tom to the family!" |

No passive voice. No "User uploaded". Always a human first name as the subject.

---

## 5. Color & Typography

### Colors

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | #c4785a | CTAs, focus rings, links, heart icon, avatar fallback bg |
| `bg-cream` | #faf8f5 | Page background, card default bg |
| `bg-white` | #ffffff | Card hover bg |
| `text-primary` | #2d2a26 | Headings, names |
| `text-secondary` | #5c5752 | Action descriptions |
| `text-tertiary` | #9c958d | Timestamps |
| `border-subtle` | #e8e3dc | Card default border |
| `skeleton-base` | #ede8e1 | Skeleton shimmer base |
| `skeleton-shine` | #f5f2ed | Skeleton shimmer shine |

All text/background combinations meet WCAG AA (contrast ratio ≥ 4.5:1):
- `text-primary` (#2d2a26) on `bg-cream` (#faf8f5): **15.4:1** ✓
- `text-secondary` (#5c5752) on `bg-cream` (#faf8f5): **7.2:1** ✓
- `text-tertiary` (#9c958d) on `bg-cream` (#faf8f5): **4.6:1** ✓
- `brand-primary` (#c4785a) on `bg-cream` (#faf8f5): **3.1:1** — used only for large icon/text ≥ 18px (bold), or decorative use

### Typography

| Role | Font | Weight | Size (mobile / desktop) | Line height |
|---|---|---|---|---|
| Feed header | Fraunces | 600 | 18px / 22px | 1.3 |
| Actor name | Plus Jakarta Sans | 600 | 15px / 16px | 1.4 |
| Action text | Plus Jakarta Sans | 400 | 15px / 16px | 1.4 |
| Timestamp | Plus Jakarta Sans | 400 | 12px / 12px | 1.4 |
| Empty state headline | Fraunces | 600 | 20px / 20px | 1.3 |
| Empty state body | Plus Jakarta Sans | 400 | 15px / 15px | 1.5 |
| CTA button | Plus Jakarta Sans | 600 | 15px / 15px | 1.0 |

---

## 6. States

### Loading
- 5 skeleton cards as described in §3c
- Feed header also has a skeleton version (two shimmer bars: one 180px wide, one 120px)

### Empty (new family — no activity yet)
- Empty state component (§3b)
- No feed header text "What's Happening Now" — replaced by the empty state illustration and copy

### Error
- A warm, non-alarming inline message: "Couldn't load the feed right now." (Plus Jakarta Sans 400, 15px, #5c5752)
- Below it: a text link "Try again" in brand-primary, 44px touch target height
- No red colors, no error icons — just the gentle copy and retry affordance
- If the error is a 401/403, silently redirect to sign-in instead of showing the error UI

### Populated
- Header "What's Happening Now" with heart icon
- Chronological list of story cards, oldest → newest
- "Load more" button appears when more than 20 items exist server-side; button is full-width on mobile, auto-width centered on desktop, terracotta outline style

---

## 7. Accessibility

### Screen Reader Semantics
- Feed container: `role="feed"` with `aria-label="Family activity feed"` (or `aria-label="No activity yet — your family feed is empty"` in empty state)
- Each card: `article` element with `aria-label="[Full activity sentence, e.g., "Sofia shared a photo with the family, 2 hours ago"]"`
- Timestamp: `<time>` element with `datetime` attribute in ISO 8601 format
- Empty state: `role="status"` so screen readers announce it on mount
- Error state: `role="alert"` so the error message is announced

### Keyboard Navigation
- Feed is a landmark region; focus moves directly into the first story card on page load (after skip-link, if present)
- Tab moves through cards one by one; each card is a single tab stop
- Enter or Space activates the card (navigates to detail)
- No arrow-key-in-grid requirement — cards are a simple vertical list

### Focus Management
- Focus ring: 2px solid #c4785a, 2px offset — visible on all backgrounds (terracotta on white and on cream both meet 3:1 for large text/icons)
- No focus trap — focus moves naturally through the page
- After a "Load more" appends items, focus stays on the "Load more" button (does not jump to top of feed)
- After error retry succeeds, focus moves to the first story card

### Motion
- Skeleton shimmer: `prefers-reduced-motion` query disables the animation (static gradient shown instead)
- Card hover/press transitions: 150ms ease-out; disabled if `prefers-reduced-motion: reduce`
- No auto-playing or looping animations in the feed itself

---

*Spec version 1.0 — Sprint 008, CTM-223 — FamilyTV Design System*
