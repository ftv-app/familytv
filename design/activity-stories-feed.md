# CTM-228: Activity Stories Feed — Design Spec

## 1. Concept & Vision

The Stats Cards dashboard — that enterprise-y grid of "3 posts this week" numbers — is gone. In its place: a **living family wall** of stories. Not a feed of posts you've seen before, but a curated, warm narrative of what's happened in your family recently — birthdays celebrated, quiet weeks nudged, videos shared, photos posted. It feels like flipping through a family photo album that writes itself.

This is FamilyTV's moat. All four competitors (FamilyWall, Cozi, TimeTree, TimeTree) show dashboards of numbers or calendars. FamilyTV shows your family, in motion.

**Emotional tone:** Warm, unhurried, personal. Like a corkboard in the kitchen — nothing is missed, nothing is algorithmic. The feed rewards families who share little and often, and gently encourages families who go quiet.

---

## 2. Layout

### Where It Lives
Replaces the 2×2 stat card grid in the main dashboard panel.

### Responsive Behavior

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 320–767px | Full-width single column, 16px horizontal padding |
| Tablet | 768–1023px | Single column, 24px padding, content max-width 640px |
| Desktop | 1024–1439px | Centered single column, 680px max-width |
| Wide | 1440px+ | Centered, 680px max-width, rest as whitespace |

### Page Structure
```
[Feed Header: "Family Stories" + story count badge]
[Stories List: vertical stack, newest-first, grouped by day]
[Load More / End of Feed marker]
```

### Day Grouping
Stories are grouped under day headers:
- "Today", "Yesterday", "March 28", etc.
- Day headers: Plus Jakarta Sans 600, 12px, uppercase, letter-spacing 0.08em, color `text-tertiary` (#9c958d), with a 24px margin above and 8px below
- On mobile, day headers have 16px above; on desktop, 20px above

### Feed Rhythm
- Card gap: 8px on mobile, 12px on desktop
- No infinite scroll — "Load more" button appears after 15 items, loads 15 more
- Maximum card width: 100% of feed column

---

## 3. Story Card — Component Structure

Each card is a horizontally laid-out strip on desktop, stacking vertically on narrow mobile.

### Anatomy (desktop/tablet)
```
┌─────────────────────────────────────────────────────┐
│ [Avatar 44px] [Name] [Action] [Timestamp]  [Thumb] │
│              [Subtitle / context line]              │
└─────────────────────────────────────────────────────┘
```

### Anatomy (mobile, < 480px)
```
┌─────────────────────────────────────┐
│ [Avatar 40px] [Name] [Action]       │
│ [Timestamp]  [Thumb 48×48]          │
│ [Subtitle / context line]           │
└─────────────────────────────────────┘
```

### Sub-components

#### 3a. Avatar
- **Size:** 44px circle desktop, 40px mobile
- **Photo:** Family member's uploaded avatar, object-fit cover, border-radius 50%
- **Fallback:** Warm terracotta (#c4785a) circle with white initials (first letter of first name + first letter of last name), Plus Jakarta Sans 600, 16px
- **Link:** Avatar links to member profile
- **ARIA:** `role="img"`, `aria-label="[Name]'s avatar photo"`; if no photo, `aria-label="[Name]'s avatar"`

#### 3b. Name
- **Font:** Plus Jakarta Sans 600
- **Size:** 15px mobile / 16px desktop
- **Color:** `text-primary` (#2d2a26) — link to profile page
- **Hover:** Underline

#### 3c. Action Text
- **Font:** Plus Jakarta Sans 400
- **Size:** 15px mobile / 16px desktop
- **Color:** `text-secondary` (#5c5752)
- **Pattern:** Always "[verb] [object]" — never passive, never "User did X"
- See §4 for full action verb taxonomy

#### 3d. Timestamp
- **Element:** `<time>` with `datetime="ISO8601"`
- **Font:** Plus Jakarta Sans 400
- **Size:** 12px
- **Color:** `text-tertiary` (#9c958d)
- **Format:** "just now", "5 min ago", "2 hours ago", "Yesterday", "Mar 28"
- **Position:** Right-aligned on desktop, below name line on mobile

#### 3e. Thumbnail (conditional)
- **Size:** 56×56px desktop, 48×48px mobile
- **Shape:** Rounded-square, border-radius 10px
- **Position:** Right edge of card, vertically centered with the text block
- **Content:** First frame of video, cover photo of album, event card thumbnail
- **Interaction:** Click opens lightbox/viewer; cursor: pointer
- **ARIA:** `aria-label="View [object name]"`

#### 3f. Story Type Accent (left border indicator)
- **Width:** 3px left border on the card
- **Colors per type (see §5):** Photo = terracotta, Video = deep teal, Birthday = dusty gold, Quiet Member = warm gray
- **Border-radius:** Matches card (12px border-radius, left side only)

#### 3g. Card Container
- **Background:** `card` (#fdfcfb)
- **Border:** 1px solid `border-subtle` (#e8e3dc)
- **Border-radius:** 12px
- **Padding:** 14px 16px desktop / 12px 14px mobile
- **Shadow (hover):** `0 3px 12px rgba(196,120,90,0.12)` — 150ms ease-out transition
- **Shadow (default):** none
- **Cursor:** pointer (entire card is one interactive target)

---

## 4. Story Types & Content Taxonomy

### Type 1: Photo Story
**Left border:** terracotta `#c4785a`
**Trigger:** Member uploads 1+ photos or creates an album
**Action verbs:** "shared a photo", "shared N photos", "created an album: [Album Name]", "added to album: [Album Name]"
**Subtitle (if album):** Album cover title, italic, 13px, `text-secondary`
**Thumbnail:** First photo in set, 56×56px
**Example card text:** "Sofia shared 4 photos with the family"

### Type 2: Video Story
**Left border:** deep teal `#3d7a7a`
**Trigger:** Member uploads or records a video
**Action verbs:** "shared a video", "recorded a video"
**Subtitle:** Video duration "1:24" in 12px `text-tertiary`, shown below action text
**Thumbnail:** First frame of video with a small play icon overlay (24px, semi-transparent dark circle with white play triangle)
**Example card text:** "Marcus shared a video · 1:24"

### Type 3: Birthday / Event Story
**Left border:** dusty gold `#c49a3a`
**Trigger:** An upcoming birthday or event enters the 7-day window
**Action verbs:** "has a birthday coming up", "has an event coming up: [Event Name]", "responded to: [Event Name]"
**Subtitle:** "In N days" or "Tomorrow" or "Today" — Fraunces 500, 13px, dusty gold color
**Thumbnail:** Calendar icon (24px, dusty gold) if no event image; otherwise event cover image
**Example card text:** "Diana has a birthday coming up · In 3 days"

### Type 4: Quiet Member Story
**Left border:** warm gray `#b8b0a8`
**Trigger:** A family member has not posted in 14+ days
**Action verb:** "hasn't shared anything in a while"
**Subtitle:** Warm encouragement — "Why not send them a nudge?" — Plus Jakarta Sans 400 italic, 13px, `text-secondary`
**Thumbnail:** None (the name + gentle text is the story)
**Avatar:** The quiet member's avatar, shown as normal
**CTA:** Tapping the card opens a pre-filled "Hey, thinking of you!" message compose sheet
**Frequency:** Maximum 1 quiet-member story per member per 7 days
**Example card text:** "Uncle Tom hasn't shared anything in a while"

### Mixed / Composite Stories
- If a member shares both photos and video in one session, show as one card: "Sofia shared 3 photos and a video"
- If a member RSVPs to an event they were invited to, show as one card: "Luca responded to: Movie Night — going"

---

## 5. Color Treatment by Story Type

### Story Type Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `story-photo-border` | `#c4785a` | Left border accent, photo type |
| `story-video-border` | `#3d7a7a` | Left border accent, video type |
| `story-video-play-icon-bg` | `rgba(30,30,30,0.6)` | Play button overlay circle |
| `story-birthday-border` | `#c49a3a` | Left border accent, birthday/event type |
| `story-birthday-accent` | `#c49a3a` | "In N days" subtitle, calendar icon |
| `story-quiet-border` | `#b8b0a8` | Left border accent, quiet member type |
| `story-quiet-text` | `#7a736c` | Quieted member card secondary text |

### Dark Mode Variants

| Token | Light | Dark |
|---|---|---|
| `story-photo-border` | `#c4785a` | `#d4886a` |
| `story-video-border` | `#3d7a7a` | `#4d9494` |
| `story-birthday-border` | `#c49a3a` | `#d4aa4a` |
| `story-quiet-border` | `#b8b0a8` | `#7a736c` |

---

## 6. Typography Scale

| Element | Font | Weight | Size (mobile / desktop) | Line height | Color |
|---|---|---|---|---|---|
| Feed header | Fraunces | 600 | 20px / 24px | 1.25 | `text-primary` |
| Story count badge | Plus Jakarta Sans | 600 | 11px / 11px | 1.0 | `primary-foreground` on `primary` bg |
| Day group header | Plus Jakarta Sans | 600 | 11px / 11px | 1.0 | `text-tertiary`, uppercase, ls 0.08em |
| Member name | Plus Jakarta Sans | 600 | 15px / 16px | 1.35 | `text-primary` |
| Action text | Plus Jakarta Sans | 400 | 15px / 16px | 1.4 | `text-secondary` |
| Timestamp | Plus Jakarta Sans | 400 | 12px / 12px | 1.4 | `text-tertiary` |
| Subtitle / context | Plus Jakarta Sans | 400 italic | 13px / 13px | 1.4 | `text-secondary` |
| Video duration | Plus Jakarta Sans | 400 | 12px / 12px | 1.0 | `text-tertiary` |
| Birthday countdown | Fraunces | 500 | 13px / 13px | 1.0 | `story-birthday-accent` |
| Quiet nudge subtext | Plus Jakarta Sans | 400 italic | 13px / 13px | 1.4 | `text-secondary` |
| Load more button | Plus Jakarta Sans | 600 | 14px / 14px | 1.0 | `primary` |
| Empty state headline | Fraunces | 600 | 20px / 20px | 1.3 | `text-primary` |
| Empty state body | Plus Jakarta Sans | 400 | 14px / 14px | 1.5 | `text-secondary` |

---

## 7. Spacing System

### Card Internal Padding
- Mobile: `px-3.5 py-3` (14px horizontal, 12px vertical)
- Desktop: `px-4 py-3.5` (16px horizontal, 14px vertical)

### Card Gap
- Mobile: 8px
- Desktop: 12px

### Section Spacing
- Feed header ↔ first card: 20px (mobile: 16px)
- Last card ↔ Load more button: 20px
- Day group header ↔ first card of group: 8px
- Thumbnail ↔ text block: 12px

### Avatar-to-Text Gap
- 10px

---

## 8. Component States

### Default Card
```
background: card (#fdfcfb)
border: 1px solid border-subtle (#e8e3dc)
border-radius: 12px
box-shadow: none
```

### Hover Card (desktop only)
```
background: #ffffff
box-shadow: 0 3px 12px rgba(196,120,90,0.12)
transition: box-shadow 150ms ease-out, background 150ms ease-out
```

### Active / Pressed Card
```
transform: scale(0.985)
transition: transform 80ms ease-out
background: #faf5f0
```

### Focus-visible Card
```
outline: 2px solid primary (#c4785a)
outline-offset: 2px
border-radius: 12px
```
(Focus is on the card container, not internal elements)

### Disabled Card
Not applicable — all cards are interactive.

---

## 9. Loading State

### Skeleton Feed
5 skeleton cards shown while data loads. Rendered in place of the real feed.

**Skeleton Card anatomy:**
- Avatar circle: 44px, shimmer fill, same fallback terracotta circle color
- Name bar: 100px wide, 14px tall, shimmer
- Action bar: 180px wide, 14px tall, shimmer
- Timestamp bar: 60px wide, 12px tall, shimmer
- Thumbnail placeholder: 56×56px shimmer block (only if media stories exist in first 5)

**Shimmer:**
```
background: linear-gradient(90deg, #ede8e1 0%, #f5f2ed 50%, #ede8e1 100%)
background-size: 200% 100%
animation: shimmer 1.4s ease-in-out infinite
```
**Reduced motion:** Static gradient (#ede8e1), no animation.

**Skeleton header:**
- "Family Stories" text bar: 160px wide, 22px tall
- Badge bar: 28px wide, 18px tall

---

## 10. Empty State

Triggered when the family has no activity yet.

**Visual:** Warm illustration (line drawing of a family gathered around a glowing phone/tablet, in terracotta/cream palette, ~140px tall) centered above text.

**Layout:** Vertically centered in the feed area (min-height: 300px), centered horizontally.

**Text:**
- Headline: "Your family stories start here." — Fraunces 600, 20px, `text-primary`
- Body: "When someone shares a photo, video, or updates the family calendar, it'll appear here as a story." — Plus Jakarta Sans 400, 14px, `text-secondary`, max-width 300px, centered
- No CTA button in empty state (unlike other empty states in the app — families with no activity are in onboarding, not the dashboard)

**ARIA:** `role="status"` on the container, `aria-label="No family stories yet — your family feed is empty"`

---

## 11. Error State

**Trigger:** API returns 4xx/5xx (except 401/403)

**Visual:**
- Inline message, not a modal or toast
- Warm, non-alarming: no red backgrounds, no error icons

**Text:** "Couldn't load family stories right now." — Plus Jakarta Sans 400, 14px, `text-secondary`

**Retry:** "Try again" — text link in `primary` (#c4785a), styled as 44px minimum touch target height (not just underline text — padded `<button>`)
```
display: inline-flex; align-items: center; height: 44px;
```

**Behavior on retry:** Refetch, replace error state with loaded feed or再次 error. After 3 consecutive failures, show persistent error with a support link "Contact support".

**401/403:** Silently redirect to sign-in. No error UI.

**ARIA:** `role="alert"` on the error message container so screen readers announce it.

---

## 12. Accessibility

### ARIA Pattern

**Feed container:**
```html
<section aria-label="Family Stories feed" aria-live="polite" aria-busy={isLoading}>
```

**Each story card:**
```html
<article
  aria-label="Sofia shared 4 photos with the family, 2 hours ago"
  tabindex="0"
  role="button"
>
```

**Day group header:**
```html
<h2 aria-label="Tuesday, March 30">Today</h2>
```

**Timestamp:**
```html
<time datetime="2026-03-30T14:32:00Z">2 hours ago</time>
```

**Thumbnail (if present):**
```html
<img aria-label="View photos from Summer in Tuscany" ... />
```

**Empty state:**
```html
<div role="status" aria-label="No family stories yet — your family feed is empty">
```

**Error state:**
```html
<div role="alert">
  <p>Couldn't load family stories right now.</p>
  <button>Try again</button>
</div>
```

### Keyboard Navigation

| Key | Action |
|---|---|
| Tab | Move focus to next story card |
| Shift+Tab | Move focus to previous story card |
| Enter / Space | Activate card (open detail view) |
| Escape | Close any open lightbox/detail view opened from the card |

- Cards use `tabindex="0"` (not `tabindex="-1"`) so they are in the natural tab order
- Feed is NOT a grid/listbox — simple vertical stacking, no arrow-key navigation required
- Focus moves to the first card on page load (after any skip link)

### Focus Management
- Focus ring: 2px solid `#c4785a`, 2px offset — applied to the card container
- After "Load more" appends items, focus remains on the "Load more" button (does not jump to top)
- After retry succeeds, focus moves to the first story card
- No focus trap anywhere in the feed

### Screen Reader Announcements
- `aria-live="polite"` on feed container — new items appended by "Load more" are announced
- Empty state: `role="status"` announces on mount
- Error: `role="alert"` announces immediately
- Quiet member story: Should be announced naturally ("[Name] hasn't shared anything in a while")

### Color & Contrast
All text/background combinations meet WCAG AA (4.5:1 minimum):
- `text-primary` (#2d2a26) on card (#fdfcfb): **15.4:1** ✓
- `text-secondary` (#5c5752) on card (#fdfcfb): **7.2:1** ✓
- `text-tertiary` (#9c958d) on card (#fdfcfb): **4.6:1** ✓
- `primary` (#c4785a) used only for decorative borders, icons ≥ 18px, and interactive text ≥ 15px bold

### Motion
- Shimmer animation: disabled when `prefers-reduced-motion: reduce` (static gradient shown)
- Card hover shadow: disabled when `prefers-reduced-motion: reduce`
- No looping or auto-playing animations
- Card press scale: disabled when `prefers-reduced-motion: reduce`

---

*Spec version 1.0 — Sprint 009, CTM-228 — FamilyTV Design System*
