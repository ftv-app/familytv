# What's Happening Now — Widget UI Design Spec
**Issue:** CTM-255  
**Status:** Draft  
**Last updated:** 2026-04-03  

---

## 1. Concept & Vision

The "What's Happening Now" widget is a warm, glanceable window into your family's live pulse — a single glance tells you who's watching something together, what moments were just shared, what's coming up this week, and whose birthday is approaching. It replaces dashboard anxiety with the feeling of being in a cozy living room where you can always see what your family is up to. The tone is immediate, friendly, and reassuring: "You belong to something alive."

This is not a full feed — it's curated density. Each section surfaces the single most relevant item, nudging you toward deeper engagement without overwhelming. Think of it as a family's shared "now" layer, always one glance away.

---

## 2. Design Language

*Inherits from Activity Stories Feed (`design/activity-stories-feed.md`). Deviations noted below.*

### Color Palette

Same tokens as Activity Stories Feed (light + dark mode). No new tokens required — this widget uses the same warm cream palette with terracotta accent `#c4785a`.

### Typography

Same type scale: **Fraunces** for section headings, **Plus Jakarta Sans** for body/UI. 

Section headers use `text-xl` (20px, weight 600). Item titles use `text-lg` (17px, weight 500). Metadata/timestamps use `text-sm` (13px).

### Spacing System

Base unit `4px`, same tokens as Activity Stories Feed. Widget-specific:
- Section internal padding: `--space-4` (16px)
- Gap between sections: `--space-3` (12px)
- Item gap within section: `--space-2` (8px)

### Motion Philosophy

- **Section refresh:** Subtle fade-pulse on update (items fade out 150ms, new items fade in 200ms)
- **Live indicator:** Soft pulsing dot (`opacity 0.6→1.0`, 2s ease-in-out infinite) for active watch parties
- **Hover:** Items lift slightly (`translateY -2px`) with shadow increase, 120ms ease-out
- **No entrance animation on mount** — widget loads in-place, not animated in, to avoid dashboard churn

---

## 3. Data Model

### Primary Types

```ts
// Watch Party — currently active or recently active (within last 30 min)
interface WatchParty {
  id: string;
  status: 'active' | 'ended';
  startedAt: string;       // ISO 8601
  endedAt?: string;       // ISO 8601, if status === 'ended'
  content: {
    title: string;         // Movie/show name
    thumbnailUrl?: string; // Poster art
    episodeInfo?: string;  // "S2:E5 — The One With..."
    watchMethod: 'streaming' | 'local' | 'screen_share';
  };
  participants: Actor[];
  viewerCount: number;     // How many watching now (if active)
  reactions: Reaction[];   // Live reactions during watch
}

// Recent Post — from the activity feed, last 24 hours only
interface RecentPost {
  id: string;
  type: 'photo' | 'video' | 'note';
  actor: Actor;
  createdAt: string;       // ISO 8601
  content: {
    caption?: string;
    mediaUrl?: string;
    mediaThumbnailUrl?: string;
  };
  reactionCount: number;
}

// Upcoming Event — from family calendar, next 7 days
interface UpcomingEvent {
  id: string;
  title: string;
  startDate: string;       // ISO 8601 date
  startTime?: string;      // HH:mm, if time is set
  location?: string;
  allDay: boolean;
  attendees: Actor[];
  rsvpStatus: 'going' | 'maybe' | 'not_going' | 'pending';
  isOwnRsvp: boolean;
}

// Upcoming Birthday — next 30 days
interface UpcomingBirthday {
  id: string;
  person: Actor;
  date: string;            // ISO 8601 date (birthday, year-agnostic)
  age?: number;            // Turning this age (optional — omit for surprise)
  daysUntil: number;       // 0 = today, 1 = tomorrow, etc.
  isToday: boolean;
}
```

### Supporting Types

```ts
interface Actor {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;       // Fallback if no avatar
}

interface Reaction {
  emoji: string;           // e.g. "❤️", "🔥"
  count: number;
  viewerIds: string[];      // Who reacted (for "you" indicator)
}
```

---

## 4. Layout & Structure

### Widget Architecture

```
┌────────────────────────────────────────────┐
│  WidgetHeader                              │
│  "What's Happening Now" + live indicator   │
├────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐│
│  │  WatchPartySection                      ││
│  │  (collapsible if no active parties)     ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │  RecentPostsSection                     ││
│  │  (last 24h, max 2 items)                ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │  UpcomingEventsSection                  ││
│  │  (next 7 days, max 3 items)             ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │  UpcomingBirthdaysSection               ││
│  │  (next 30 days, max 3 items)           ││
│  └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### Section Layouts

**Watch Party Section (expanded when active):**
```
┌──────────────────────────────────────────┐
│ 📺  Watching Now                         │
├──────────────────────────────────────────┤
│ [Thumbnail]  Movie Title                 │
│               S2:E5 — Episode Name       │
│               👤 👤 👤 3 watching         │
└──────────────────────────────────────────┘
```

**Recent Posts Section:**
```
┌──────────────────────────────────────────┐
│ ✨  Just Shared                           │
├──────────────────────────────────────────┤
│ [Avatar] Name · 2h ago                   │
│ Caption preview text here (1 line clamp) │
│                        [📷 Photo]  ❤️ 4   │
├──────────────────────────────────────────┤
│ [Avatar] Name · 45m ago                  │
│ Another caption or note preview...        │
│                        [📝 Note]  ❤️ 2   │
└──────────────────────────────────────────┘
```

**Upcoming Events Section:**
```
┌──────────────────────────────────────────┐
│ 📅  Coming Up                             │
├──────────────────────────────────────────┤
│ Sunday · 10:00 AM                         │
│ Family Brunch at Grandma's               │
│ ✅ Going · 4 attending                    │
├──────────────────────────────────────────┤
│ Wednesday · All Day                       │
│ Jack's Soccer Game                       │
│ ⏳ Pending · 2 going                      │
└──────────────────────────────────────────┘
```

**Upcoming Birthdays Section:**
```
┌──────────────────────────────────────────┐
│ 🎂  Birthdays Soon                        │
├──────────────────────────────────────────┤
│ 🎈  Emma — Tomorrow!                      │
│     She's turning 9                       │
├──────────────────────────────────────────┤
│ 🎈  Uncle Bob — In 12 days               │
│     Turning 62                           │
└──────────────────────────────────────────┘
```

### Responsive Behavior

- **Mobile (< 640px):** Full-width widget, `16px` horizontal padding. Each section is full-width. Section headers stacked above content.
- **Desktop (≥ 640px):** Widget constrained to `380px` width (side dashboard placement). Compact row layouts for event items (date on left, details on right).
- **Widget height:** Max height with overflow scroll. If content exceeds viewport, widget scrolls internally. Sections never collapse below 48px header.
- **Section collapse:** Tapping section header collapses/expands that section. Collapsed state shows item count badge (e.g., "3 events").

### Empty Section Behavior

| Section | Empty State |
|---------|-------------|
| Watch Party | Shows "No one is watching right now" with subtle TV icon. Does not render the section on dashboard if all sections are empty (see Widget Empty State). |
| Recent Posts | "Nothing new yet today" — subtle grey text, no icon |
| Events | "Nothing this week" |
| Birthdays | "No birthdays in the next 30 days" |

### Widget Empty State

If **all** sections are empty (rare — only on brand new family with no content):
- Centered: warm illustration of a cozy TV lounge
- Headline: Fraunces `text-xl`, "Your family is quiet right now"
- Subline: `text-sm`, "Start sharing to see activity here"
- CTA: "Share a moment →" button in `--color-accent`

---

## 5. Component Hierarchy

```
WhatsHappeningNowWidget
├── WidgetHeader
│   ├── WidgetTitle ("What's Happening Now")
│   └── LiveIndicator (pulsing dot when any live content)
├── WatchPartySection
│   ├── SectionHeader (icon + label + collapse toggle)
│   ├── WatchPartyCard
│   │   ├── WatchPartyThumbnail (16:9 rounded, poster art)
│   │   ├── WatchPartyInfo
│   │   │   ├── ContentTitle
│   │   │   ├── EpisodeInfo
│   │   │   └── ParticipantAvatars (stacked, +N overflow)
│   │   └── ViewerCount
│   └── WatchPartyEmpty
├── RecentPostsSection
│   ├── SectionHeader (icon + label)
│   ├── RecentPostItem (× 2 max)
│   │   ├── ActorAvatar (compact, 32px)
│   │   ├── PostMeta
│   │   │   ├── ActorName
│   │   │   ├── RelativeTimestamp
│   │   │   └── TypeBadge (small pill)
│   │   ├── PostPreview (1-line caption clamp)
│   │   └── PostReactions
│   └── RecentPostsEmpty
├── UpcomingEventsSection
│   ├── SectionHeader (icon + label)
│   ├── EventItem (× 3 max)
│   │   ├── EventDateBadge (day name + time or "All Day")
│   │   ├── EventDetails
│   │   │   ├── EventTitle
│   │   │   └── EventLocation (if present)
│   │   └── EventRsvpBadge
│   └── UpcomingEventsEmpty
├── UpcomingBirthdaysSection
│   ├── SectionHeader (icon + label)
│   ├── BirthdayItem (× 3 max)
│   │   ├── BirthdayIcon (🎈)
│   │   ├── PersonName
│   │   ├── DaysUntilLabel ("Tomorrow", "In X days", "Today!")
│   │   └── AgeLabel (if age known)
│   └── UpcomingBirthdaysEmpty
├── WidgetEmptyState
└── WidgetErrorState
```

---

## 6. Component Specifications

### WidgetHeader

- `height: 44px`
- Flex row: title left, live indicator right
- Title: Fraunces `text-xl`, weight 600, `--color-text-primary`
- Background: transparent (inherits widget background)
- Bottom border: `1px solid --color-border-subtle`

### LiveIndicator

- `8px` circle, `--color-accent` fill
- CSS animation: `opacity 0.5→1.0`, `1.5s` ease-in-out infinite
- Visible only when at least one section has "live" content (active watch party OR activity in last 15 minutes)
- `aria-label="Live updates active"`

### WatchPartyCard

- Rounded container, `border-radius: 12px`
- Background: `--color-surface`
- Left: `80px × 45px` thumbnail (16:9), `border-radius: 8px`, `object-fit: cover`
- Right of thumbnail: `space-3` gap
- Content title: `text-lg`, weight 600, `--color-text-primary`, single line with ellipsis
- Episode info: `text-sm`, `--color-text-secondary`
- Participant avatars: stacked circles (overlap by 8px), max 3 visible + "+N" badge
- `viewerCount` badge: terracotta pill, "👤 3 watching"

**States:**
- **Active:** Live indicator on, "Watching now" badge
- **Ended:** Greyed slightly (`opacity: 0.7`), "Just ended" label replaces viewer count

### RecentPostItem

- Flex row, `space-3` gap between avatar and content
- Avatar: `32px` circular
- Actor name: `text-sm`, weight 600
- Timestamp: `text-xs`, `--color-text-tertiary`, prefixed with "·"
- TypeBadge: tiny pill (`text-xs`), same as Activity Stories Feed badges
- Caption preview: `text-sm`, 1-line clamp (`line-clamp: 1`)
- Reactions: inline emoji + count, `text-xs`

### EventItem

- Flex row, two-column on desktop (date left, details right)
- **Date column (fixed 80px):**
  - Day name: `text-sm`, weight 600, `--color-text-primary`
  - Time or "All Day": `text-xs`, `--color-text-secondary`
- **Details column:**
  - Event title: `text-sm`, weight 500
  - Location: `text-xs`, `--color-text-tertiary`, with 📍 prefix
  - RSVP badge: inline pill, colors by status:
    - Going: `--color-success` pill
    - Maybe: `--color-accent-muted` pill
    - Not going: greyed
    - Pending: outlined pill

### BirthdayItem

- Flex row, `space-2` gap
- 🎈 emoji: `20px`, terracotta color
- Name: `text-sm`, weight 600
- Days label: `text-xs`, `--color-text-secondary`
- Age label (if present): `text-xs`, `--color-text-tertiary`, italic
- **Today special:** If `isToday`, entire row has `--color-accent-muted` background, rounded pill

### SkeletonCard (for each section)

- Matches exact layout of each section's primary item
- Pulsing placeholder blocks in `--color-surface-raised`
- Stagger: 80ms between sections

---

## 7. Interaction States

### Widget-Level Interactions
- **Widget load:** 3 skeleton cards in stacked layout, fade in immediately
- **Pull-to-refresh (if widget is scrollable in-page):** Top progress bar in `--color-accent`
- **Section collapse:** Tap header to toggle. Collapsed sections show count badge.
- **All sections collapsed:** Widget height shrinks to header only + "3 items hidden" text

### Item Interactions
- **Tap WatchPartyCard:** Navigates to watch party detail / room (if applicable)
- **Tap RecentPostItem:** Navigates to that post in the full feed
- **Tap EventItem:** Navigates to event detail (RSVP screen)
- **Tap BirthdayItem:** Navigates to birthday page / person's profile
- **Hover (desktop):** Row background shifts to `--color-surface-raised`, `translateY -1px`, shadow lifts

### Loading States
- **Initial load:** Three skeleton cards (one per section type), staggered 80ms
- **Refresh:** Top thin progress bar (`2px`, `--color-accent`)
- **Section-level loading:** Skeleton replaces items in that section only

### Error States
- **Network error:** Section-level inline error: "Couldn't load — tap to retry" with icon
- **Widget-level failure:** Full widget replaced with error card, "Something went wrong" + retry
- **Partial failure:** Failed section shows error state; other sections remain visible

### Empty States
- **Per-section:** Greyed placeholder text (see Layout section)
- **Full widget empty:** Centered empty state with illustration and CTA

---

## 8. Real-Time Behavior

### Polling Strategy

| Section | Polling Interval | Rationale |
|---------|-----------------|-----------|
| Watch Party | **15 seconds** | Needs near-real-time; low traffic |
| Recent Posts | **60 seconds** | 24h window is wide; avoid excessive calls |
| Upcoming Events | **5 minutes** | Calendar changes infrequently |
| Birthdays | **30 minutes** | Birthdays change once/day at most |

### WebSocket Upgrade (Future)

When WebSocket infrastructure is available:
- Watch Party subscribes to `family.watch.party` channel
- Recent Posts subscribes to `family.posts.live` channel
- Events and Birthdays remain polling-only

### Stale Data Handling

- Items beyond their relevance window (e.g., watch party ended > 30 min ago) are removed from widget
- Events in the past are removed from Upcoming Events section
- After birthday passes, item removed from Upcoming Birthdays

### Cache Behavior

- SWR `refreshInterval` per section (see polling table above)
- `revalidateOnFocus: true` for all sections
- `dedupingInterval: 5000` to prevent duplicate requests

---

## 9. Accessibility

### Color Contrast
All text combinations pass WCAG AA (verified against Activity Stories Feed palette):
- Section titles (`--color-text-primary` on `--color-background`): 11.4:1 ✓
- Item titles on surface: 11.4:1 ✓
- Metadata on surface: 5.8:1 ✓
- RSVP badges (Going/green on white): 4.5:1 ✓
- Live indicator dot: uses `--color-accent` which has sufficient contrast on cream

### Keyboard Navigation
- Widget container: `tabindex="0"` if not focusable, or inherent focus
- Tab order: WidgetHeader → WatchPartySection → RecentPostsSection → EventsSection → BirthdaysSection
- Within sections: Tab through each item
- `Space`/`Enter` activates item (navigates to detail)
- `Escape`: no action (widget doesn't trap focus)

### Screen Reader Support
- Widget: `<aside role="complementary">` with `aria-label="Family activity widget"`
- Section headers: `<h3>` with section name
- Watch party: `"3 family members watching {title}"`
- Recent post: `"{Name} shared a {type} {time} ago, with {reactionCount} reactions"`
- Event: `"{Title} on {Day} at {Time}, {RSVP status}"`
- Birthday: `"{Name}'s birthday {DaysUntil}"` — "tomorrow" or "in X days"
- Live indicator: `aria-live="polite"` region, announces "Live updates active" on mount if applicable

### Focus Management
- Focus does not automatically move to widget on route change
- If widget updates with new content, screen reader is notified via `aria-live` region
- Focus remains where user left it

### Motion
Same `prefers-reduced-motion` handling as Activity Stories Feed:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
Live indicator pulse is disabled when `prefers-reduced-motion: reduce`.

---

## 10. Technical Notes

### Tech Stack
- **Framework:** Next.js 15 (App Router) — widget is a client component (`'use client'`)
- **Styling:** CSS Modules + CSS custom properties (inherits tokens from Activity Stories Feed `tokens.css`)
- **State:** Local React state + SWR for data fetching/caching
- **Icons:** `lucide-react`
- **Fonts:** Loaded via `next/font/google` (Fraunces + Plus Jakarta Sans)

### Key Files

```
src/components/dashboard/
├── WhatsHappeningNowWidget/
│   ├── WhatsHappeningNowWidget.tsx    # Root client component
│   ├── WhatsHappeningNowWidget.module.css
│   ├── WidgetHeader.tsx
│   ├── sections/
│   │   ├── WatchPartySection.tsx
│   │   ├── WatchPartyCard.tsx
│   │   ├── RecentPostsSection.tsx
│   │   ├── RecentPostItem.tsx
│   │   ├── UpcomingEventsSection.tsx
│   │   ├── EventItem.tsx
│   │   ├── UpcomingBirthdaysSection.tsx
│   │   └── BirthdayItem.tsx
│   ├── WidgetEmptyState.tsx
│   ├── WidgetErrorState.tsx
│   └── skeletons/
│       ├── WatchPartySkeleton.tsx
│       ├── RecentPostSkeleton.tsx
│       ├── EventSkeleton.tsx
│       └── BirthdaySkeleton.tsx
```

### API Endpoints

| Endpoint | Method | Params | Response |
|----------|--------|--------|----------|
| `/api/family/watch-parties/active` | GET | `?limit=1` | `{ items: WatchParty[], lastUpdated: string }` |
| `/api/family/posts/recent` | GET | `?hours=24&limit=2` | `{ items: RecentPost[], lastUpdated: string }` |
| `/api/family/events/upcoming` | GET | `?days=7&limit=3` | `{ items: UpcomingEvent[], lastUpdated: string }` |
| `/api/family/birthdays/upcoming` | GET | `?days=30&limit=3` | `{ items: UpcomingBirthday[], lastUpdated: string }` |

All endpoints support `GET` with standard query params. Responses include `lastUpdated` timestamp for client-side cache validation.

### Data Freshness

- All endpoints are read-heavy and cacheable
- CDN cache TTL: `60s` for watch parties, `300s` for events, `3600s` for birthdays
- Client-side SWR handles revalidation; server returns fresh data on each poll

### Performance Notes

- Widget is code-split from main dashboard bundle (`next/dynamic` with `ssr: false` if client-only data)
- Thumbnail images use `next/image` with `priority={true}` only for Watch Party (above-fold on dashboard)
- No virtualization needed (max ~10 items total across all sections)
- Fonts: subset to Latin only unless family uses extended characters

---

*Spec version 1.0 — issue CTM-255 — architect subagent — 2026-04-03*
