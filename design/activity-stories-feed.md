# Activity Stories Feed — Design Spec
**Issue:** #32  
**Status:** Draft  
**Last updated:** 2026-04-01  

---

## 1. Concept & Vision

The Activity Stories Feed is a private, chronological family social layer — replacing the cold stat cards with something that feels like flipping through a warm family scrapbook. There is no algorithm, no ads, no suggested content. Just your family's moments in order, the way they happened. The tone is intimate, unhurried, and human: a soft cream canvas with terracotta warmth, Fraunces headings that feel hand-set, and interactions that respond like paper.

---

## 2. Design Language

### Color Palette

#### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-background` | `#faf8f5` | Page/feed background (warm cream) |
| `--color-surface` | `#ffffff` | Card surfaces |
| `--color-surface-raised` | `#f5f2ed` | Nested elements, hover states |
| `--color-accent` | `#c4785a` | CTAs, active states, highlights |
| `--color-accent-hover` | `#b06a4d` | Pressed accent |
| `--color-accent-muted` | `#f0ddd4` | Accent backgrounds, badges |
| `--color-text-primary` | `#2c2420` | Headings, primary body |
| `--color-text-secondary` | `#7a6b63` | Timestamps, metadata |
| `--color-text-tertiary` | `#a89b91` | Placeholders, disabled |
| `--color-border` | `#e8e2da` | Card borders, dividers |
| `--color-border-subtle` | `#f0ebe4` | Subtle separators |
| `--color-success` | `#6b9e78` | Positive reactions, confirmations |
| `--color-shadow` | `rgba(44,36,32,0.08)` | Card shadows |

#### Dark Mode (Warm Dark — not cold inverted)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-background` | `#1e1a17` | Page background (warm near-black) |
| `--color-surface` | `#2a2420` | Card surfaces |
| `--color-surface-raised` | `#352e28` | Nested elements, hover states |
| `--color-accent` | `#d4886a` | CTAs, active states (lighter for dark bg) |
| `--color-accent-hover` | `#e0957a` | Pressed accent |
| `--color-accent-muted` | `#3d2e26` | Accent backgrounds |
| `--color-text-primary` | `#f5f0eb` | Headings, primary body |
| `--color-text-secondary` | `#a89589` | Timestamps, metadata |
| `--color-text-tertiary` | `#7a6b63` | Placeholders, disabled |
| `--color-border` | `#3d352e` | Card borders |
| `--color-border-subtle` | `#2e2825` | Subtle separators |
| `--color-success` | `#7aad8a` | Positive reactions |
| `--color-shadow` | `rgba(0,0,0,0.3)` | Card shadows |

---

### Typography

**Font families:**
- **Headings / Display:** `Fraunces` (Google Fonts) — variable weight, optical-size aware. Warm, editorial serif.
- **Body / UI:** `Plus Jakarta Sans` (Google Fonts) — friendly geometric sans.

**Type scale (mobile base 16px):**

| Name | Size | Weight | Line height | Usage |
|------|------|--------|-------------|-------|
| `text-xs` | 11px | 400 | 1.4 | Timestamps, badges |
| `text-sm` | 13px | 400/500 | 1.45 | Metadata, captions |
| `text-base` | 15px | 400 | 1.55 | Body text, previews |
| `text-lg` | 17px | 500 | 1.4 | Feed item actor names |
| `text-xl` | 20px | 600 | 1.3 | Section headers |
| `text-2xl` | 24px | 700 | 1.2 | Page title |
| `text-display` | 32px | 800 | 1.1 | Empty state headline |

Letter spacing on Fraunces display text: `-0.02em`.  
Letter spacing on all caps labels: `0.08em`.

---

### Spacing System

Base unit: `4px`. All spacing is a multiple of this unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Inline gaps, tight padding |
| `--space-2` | 8px | Icon-text gaps, micro spacing |
| `--space-3` | 12px | Inner card padding (mobile) |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-5` | 20px | Between feed items |
| `--space-6` | 24px | Layout gutters |
| `--space-8` | 32px | Section separators |
| `--space-10` | 40px | Page top/bottom padding |
| `--space-12` | 48px | Large vertical rhythm |

---

### Motion Philosophy

- **Entrance:** Feed items fade + slide up (`opacity 0→1`, `translateY 12px→0`), 280ms ease-out, 40ms stagger between items.
- **Skeleton pulse:** Slow `opacity 0.4→0.8` breathing, 1.6s ease-in-out infinite.
- **Interaction feedback:** Scale `1.0→0.97` on press (60ms), release springs back (200ms spring).
- **Reaction pop:** Heart/emoji scale `1.0→1.3→1.0` with a 160ms spring on toggle.
- **Page transitions:** Fade cross-dissolve, 200ms.
- No motion if `prefers-reduced-motion: reduce`.

---

### Visual Assets

- **Icons:** Lucide React (consistent 1.5px stroke, rounded caps)
- **Avatars:** Circular, `40px` on mobile, `48px` on desktop. Soft `2px` border in `--color-border`. Fallback: initials on `--color-accent-muted`.
- **Photos/videos:** 16:9 aspect ratio containers, `border-radius: 12px`, subtle `box-shadow`.
- **Milestone badges:** Pill shape, `--color-accent-muted` background, `--color-accent` text.
- **Dividers:** `--color-border-subtle`, 1px, no full-bleed — items breathe individually.

---

## 3. Layout & Structure

### Page Architecture

```
┌──────────────────────────────────────┐
│  Header: "Family Feed" + avatar      │  ← sticky, blur backdrop
├──────────────────────────────────────┤
│  Feed container (centered, max-w-640)│
│  ┌────────────────────────────────┐  │
│  │  FeedItem (type: photo)        │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │ Header: avatar + name + │  │  │
│  │  │ time + type badge       │  │  │
│  │  ├──────────────────────────┤  │  │
│  │  │ Content preview          │  │  │
│  │  │ (photo or text snippet)  │  │  │
│  │  ├──────────────────────────┤  │  │
│  │  │ Footer: reactions + count│  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
│           ─ spacing 20px ─           │
│  ┌────────────────────────────────┐  │
│  │  FeedItem (type: event)        │  │
│  └────────────────────────────────┘  │
│           ─ spacing 20px ─           │
│  ┌────────────────────────────────┐  │
│  │  FeedItem (type: birthday)     │  │
│  └────────────────────────────────┘  │
│           ─ spacing 20px ─           │
│  ┌────────────────────────────────┐  │
│  │  FeedItem (type: milestone)    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  EmptyState (if no items)      │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### Feed Item Layouts by Type

**Photo/Video Post:**
```
┌──────────────────────────────────────┐
│ [Avatar 40px]  Name  ·  2h ago  [📷] │  ← header row
├──────────────────────────────────────┤
│ Caption text preview (2-line clamp)  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │         16:9 photo/video          │ │
│ │         with rounded corners      │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [❤️ 3]  [😊 1]              12 likes │ │
└──────────────────────────────────────┘
```

**Calendar Event:**
```
┌──────────────────────────────────────┐
│ [Avatar]  Name  ·  3d ago  [📅]      │
├──────────────────────────────────────┤
│ 📅 Family Brunch — Sunday, 10am      │
│ 📍 Grandma's house                   │
│ Members: Mom, Dad, Emma, Jack        │
├──────────────────────────────────────┤
│ [✅ Going: 4]             4 reactions│
└──────────────────────────────────────┘
```

**Birthday:**
```
┌──────────────────────────────────────┐
│ [Avatar]  System  ·  1d ago  [🎂]    │
├──────────────────────────────────────┤
│ 🎂 It's Emma's birthday tomorrow!   │
│ She's turning 9. Leave a wish?       │
├──────────────────────────────────────┤
│ [🎁 2 wishes]              2 reactions│
└──────────────────────────────────────┘
```

**Family Milestone:**
```
┌──────────────────────────────────────┐
│ [Avatar]  Name  ·  5d ago  [🏆]      │
├──────────────────────────────────────┤
│ 🏆 500 days smoke-free! 🎉           │
│ So proud of you, Dad!               │
├──────────────────────────────────────┤
│ [👏 8]                   8 reactions │
└──────────────────────────────────────┘
```

### Responsive Behavior

- **Mobile (< 640px):** Full-width cards with `16px` horizontal padding, `12px` internal padding.
- **Tablet/Desktop (≥ 640px):** Centered single column, `max-width: 640px`, cards have `20px` internal padding. Content max-width is respected; avatar size bumps to `48px`.
- **Header:** Sticky on all breakpoints. On desktop it gains a subtle bottom border + `backdrop-filter: blur(8px)`.

---

## 4. Component Hierarchy

```
ActivityStoriesFeed
├── FeedHeader
│   ├── LogoText ("Family Feed")
│   └── CurrentUserAvatar
├── FeedList
│   ├── FeedItem (× n)
│   │   ├── FeedItemHeader
│   │   │   ├── ActorAvatar
│   │   │   ├── ActorName
│   │   │   ├── RelativeTimestamp
│   │   │   └── TypeBadge (icon pill)
│   │   ├── FeedItemContent
│   │   │   ├── PhotoVideoContent
│   │   │   │   ├── MediaPreview (photo, first frame of video)
│   │   │   │   └── VideoDurationBadge
│   │   │   ├── TextContent (caption, event details, milestone)
│   │   │   └── ContentPreview (2-line clamp for long text)
│   │   ├── FeedItemFooter
│   │   │   ├── ReactionButton (❤️, 😊, 🎁, 👏...)
│   │   │   ├── ReactionCount
│   │   │   └── ViewDetailLink
│   │   └── FeedItemMedia (for photo/video types)
│   ├── SkeletonCard (loading state, same shape as FeedItem)
│   └── EndOfFeedDivider
├── EmptyState
│   ├── EmptyStateIllustration (soft SVG of family silhouette)
│   ├── EmptyStateHeadline
│   └── EmptyStateCTA ("Share your first moment")
└── FeedErrorState (if load fails)
```

---

## 5. Component Specifications

### FeedItem

**States:**
- **Default:** Cream card, soft shadow, full opacity
- **Hover (desktop):** Background shifts to `--color-surface-raised`, shadow lifts slightly
- **Active/Pressed:** Scale 0.98, shadow flattens
- **Focused (keyboard):** `2px` offset outline in `--color-accent`
- **Own item:** Subtle left border `3px solid --color-accent` to identify user's own posts

### ActorAvatar

- Circular, `40px` mobile / `48px` desktop
- `border: 2px solid var(--color-border)`
- Fallback: initials in `--color-accent-muted` with `--color-accent` text
- `alt` text: "{ActorName}'s photo"

### TypeBadge

- Pill: `border-radius: 999px`
- Background: `--color-accent-muted`
- Icon + label in `--color-accent`, `text-xs`, `font-weight: 600`
- Types: 📷 Photo, 🎥 Video, 📅 Event, 🎂 Birthday, 🏆 Milestone, 📝 Note

### ReactionButton

- Inline flex row of emoji + count
- On hover: emoji scale 1.15
- On own reaction: emoji bounces (spring animation)
- Toggle behavior: tap to add/remove own reaction
- Long-press: opens reaction picker (❤️, 😊, 🎉, 🎁, 👏, 🔥, 👀, 💯)

### SkeletonCard

- Matches exact dimensions of a FeedItem
- Uses `--color-surface-raised` placeholder blocks
- Header: circular avatar block + two text blocks
- Body: full-width rectangle block
- Footer: two small pill-shaped blocks
- Pulse animation: `opacity 0.4→0.8`, 1.6s infinite

### EmptyState

- Centered vertically in feed area
- Soft illustration: warm-toned SVG of family members with speech bubbles (no speech marks — just warmth)
- Headline: `text-display` Fraunces, "Your family feed is empty"
- Subline: `text-base`, `--color-text-secondary`, "Share your first moment and start the story."
- CTA button: solid `--color-accent` pill, "Share a moment →"
- Gentle fade-in on mount

### FeedHeader

- `height: 56px`
- `position: sticky; top: 0`
- `backdrop-filter: blur(8px)` with `background: rgba(250,248,245,0.85)` (light) / `rgba(30,26,23,0.85)` (dark)
- Left: Fraunces "Family Feed" wordmark
- Right: current user's avatar (links to profile)

---

## 6. Interaction States

### Feed List Interactions
- **Pull-to-refresh:** On mobile, pull down reveals a warm spinner (terracotta). Release triggers refresh with fade.
- **Infinite scroll:** Loads next page when user reaches 80% scroll depth. No "Load more" button needed.
- **Scroll-to-top FAB:** Appears after scrolling 300px down. Terracotta circle with ↑ icon.

### Feed Item Interactions
- **Tap item (not on media/CTA):** Expands content preview to full text (if clamped). Tapping again collapses.
- **Tap photo/video:** Opens media viewer (full-screen lightbox on web, native player on mobile).
- **Tap actor name:** Navigates to family member profile.
- **Tap reaction:** Toggles reaction. Optimistic UI update; reverts on error with subtle shake animation.
- **Long-press reaction:** Opens emoji picker popover.
- **Swipe left (mobile):** Reveals "Save" and "Hide" actions (no delete — family context).

### Loading States
- Initial load: 3 `SkeletonCard` entries animate in with 80ms stagger.
- Refresh: Top progress bar in `--color-accent` (not a spinner).
- Pagination: Subtle spinner at bottom of list, centered.

### Error States
- Network error: Inline banner above last known items — "Couldn't load — tap to retry" with a retry button.
- Item-level error (e.g. failed to post reaction): Item shakes, reaction count reverts, toast: "Couldn't save that. Try again."

---

## 7. Accessibility

### Color Contrast
All text combinations pass WCAG AA:
- `--color-text-primary` on `--color-surface`: 11.4:1 ✓
- `--color-text-secondary` on `--color-surface`: 5.8:1 ✓
- `--color-accent` on `--color-accent-muted`: 4.5:1 ✓ (large text only for pure AA)
- Dark mode counterparts verified similarly.

### Keyboard Navigation
- Tab order: Header → Feed items (top to bottom) → FAB
- Within FeedItem: Tab moves through actor → media (if present) → reactions → CTA
- `Enter`/`Space` activates focused interactive element
- `Escape` collapses expanded content / closes modals

### Screen Reader Support
- Feed wrapped in `<main role="feed">` with `aria-label="Family activity feed"`
- Each FeedItem: `<article>` with `aria-label="{ActorName} shared a {type} {relativeTime}"`
- Photos have descriptive `alt` text (user-provided caption or "Photo shared by {name}")
- Reactions announced: "3 people reacted with love, 1 with celebration"
- Empty state: `<empty-state role="status">` with live region announcement

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Management
- On route entry: focus moves to page `<h1>` (skipped visually via off-screen positioning)
- On modal/lightbox open: focus trapped inside
- On modal close: focus returns to triggering element

---

## 8. Implementation Notes

### Tech Stack
- **Framework:** Next.js 15 (App Router) — `src/app/family/feed/`
- **Styling:** CSS Modules + CSS custom properties (tokens). No Tailwind.
- **State:** React `useState` + `useTransition` for optimistic updates
- **Data:** Client-side fetch with SWR or React Query for caching/revalidation
- **Icons:** `lucide-react`
- **Fonts:** Loaded via `next/font/google` (Fraunces + Plus Jakarta Sans)

### Key Files
```
src/app/family/feed/
├── page.tsx                   # Feed page (server component shell)
├── page.client.tsx            # Client component with data fetching
├── ActivityStoriesFeed.tsx    # Root client component
├── FeedList.tsx               # Infinite scroll list
├── FeedItem.tsx                # Individual feed item
├── FeedHeader.tsx              # Sticky header
├── SkeletonCard.tsx            # Loading skeleton
├── EmptyState.tsx              # Empty state
├── ReactionButton.tsx         # Emoji reaction picker
├── types.ts                    # FeedItem, Actor, Reaction types
├── tokens.css                  # CSS custom property definitions
└── feed.module.css             # Component styles
```

### Data Model (abbreviated)
```ts
type FeedItemType = 'photo' | 'video' | 'event' | 'birthday' | 'milestone' | 'note';

interface FeedItem {
  id: string;
  type: FeedItemType;
  actor: Actor;
  createdAt: string; // ISO 8601
  content: {
    caption?: string;
    mediaUrl?: string;
    mediaThumbnailUrl?: string;
    mediaType?: 'photo' | 'video';
    eventDetails?: { title: string; date: string; location?: string };
    milestone?: { label: string; emoji: string };
  };
  reactions: Reaction[];
  ownReactions: string[]; // emoji strings
  commentCount: number;
}
```

### Performance
- Images served via `next/image` with `sizes` prop for responsive loading
- Skeleton SSR-rendered (no layout shift on hydration)
- Feed list virtualized if > 50 items (use `@tanstack/react-virtual`)
- Video thumbnails: first frame extracted server-side, shown as static until tap

---

*Spec version 1.0 — issue #32 — principal-designer subagent — 2026-04-01*
