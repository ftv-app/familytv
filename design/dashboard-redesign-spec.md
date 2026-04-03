# FamilyTV Dashboard Redesign Spec

**Author:** Principal Designer
**Status:** Draft v1.0
**Date:** 2026-03-31
**Applies to:** Dashboard (`/app/dashboard`), Family page (`/app/family/[familyId]`)

---

## 1. Information Architecture Decision

### Recommendation: **Keep dashboard separate, but reorient it entirely**

The dashboard and family page must remain distinct routes. Folding the dashboard into the family page would force users to click through a "home" step to reach their content — the opposite of the warm, immediate living-room feel we're targeting.

**However**, the dashboard must stop duplicating the family page's Feed/Calendar/Members tabs. Instead, it should become the **Family TV Guide home** — a personalized "channel front" that answers the question *"What's on Family TV right now?"*

**New mental model:**
- `/app/dashboard` → **"The TV is on. Here's what's playing."** — Now Playing hero, presence, ambient warmth, one-click to watch
- `/app/family/[familyId]` → **"Dive into the channel."** — Full feed, calendar, members, deep archive browsing

This mirrors how real TV works: you land on a channel (dashboard), and when you want more you go to the program guide or browse the archive (family page). It also gives grandparents a natural landing that feels like turning on the TV — familiar, passive, warm — rather than opening an app.

---

## 2. Hero Section: "What's On Family TV"

**The signed-in user should see this first:**

A cinematic, full-width hero card — styled like a TV channel's "now playing" banner. Dark background (#0D0D0F), gold accent (#D4AF37), the family name in Fraunces.

```
┌─────────────────────────────────────────────────────────────┐
│  [Family Name] Family TV                                    │
│                                                             │
│  ┌──────────┐  NOW PLAYING                                 │
│  │ thumbnail│  [Video Title — e.g., "Sophia's First Steps"]│
│  │  16:9    │  Posted by Elena · 2 hours ago                │
│  │          │                                              │
│  └──────────┘  ▶ Watch together                            │
│                                                             │
│  👤 Elena 👤 Marcus 👤 Grandma Rose (3 watching now)        │
└─────────────────────────────────────────────────────────────┘
```

**When no video exists yet:** Show a welcome hero instead (see Empty State, section 8).

**Key behaviors:**
- "Watch together" button launches synchronized playback immediately
- If multiple family members are currently watching, show their avatars with a pulsing green ring ("live" indicator)
- Thumbnail uses the post's video thumbnail (or first frame if available)
- Tapping the hero card navigates to the family page with that video pre-loaded

**Why this works:** For a video-first app, the homepage must lead with video. A static stats dashboard communicates nothing about what makes FamilyTV special. A "now playing" hero says "the TV is on" before the user even opens the app — which is exactly the ambient, always-on promise from the positioning doc.

---

## 3. Stats with Context

**Problem:** "1 post this week" is a number, not a feeling.

**Solution:** Replace cold stat cards with **activity storylines** — human context around what happened, not just that it happened.

### Replace stat cards with a "Recent Activity" strip:

```
┌──────────────────────────────────────────────────────────────┐
│  Recent activity                                            │
│                                                              │
│  📹 Elena shared "Beach day at OB" — 3h ago                 │
│  📹 Marcus added 4 videos to the channel — yesterday        │
│  📹 Grandma Rose replied to "First steps" — 2 days ago     │
│                                                              │
│  View all 12 posts →                                         │
└──────────────────────────────────────────────────────────────┘
```

**For the summary row (members/posts/events):** Keep numeric totals but add a human label:
- Members: **"4 people in your circle"** (not "4 Members")
- Posts: **"2 new this week"** with a small relative timestamp: "last post by Elena · 3h ago"
- Events: **"1 upcoming"** with: "Sofia's birthday · in 12 days"

**No stat should ever appear without an author or timestamp.**

---

## 4. Member Presence: "Who's Home"

**Concept:** Just like you'd glance at a house to see which lights are on, FamilyTV should let you see who's "in the living room" right now.

**Implementation — a persistent "On Now" bar:**

A row of circular member avatars displayed in the hero section:

```
👤 Elena  👤 Marcus  👤 Grandma Rose
   🔴        🟢          ⚪
```

- **Green ring** (🟢): Member has FamilyTV open and is watching right now
- **Gold ring** (🟡): Member has been active in the last 30 minutes (recently watched)
- **Dim/neutral** (⚪): No recent activity

This uses presence data from the Clerk user session + optional heartbeat pings to determine live status.

**On the family page:** Show a "Currently watching" section above the feed tab, with the same avatar indicators. When 2+ members are watching the same video, show "🔴 3 watching 'Sophia's First Steps' now" — creating FOMO and social proof to drive co-viewing.

**Emotional tone:** This should feel like looking through a window and seeing who's home. Not a surveillance tool — a warmth indicator. The gold/green rings should feel like lamplight, not traffic lights.

---

## 5. "Share a Moment" Prominence

**Problem:** Buried in a 3-card quick actions row.

**Solution:** Elevate "Share a moment" to be the **second most prominent element on the dashboard** — after the Now Playing hero.

**Placement options (use both):**

### A. Persistent bottom CTA (mobile + desktop)
A full-width button pinned below the hero, styled as a cinematic action:

```
┌─────────────────────────────────────────────────────────────┐
│  ✦ Share a moment with your family                           │
│    Video or photo from today                                 │
└─────────────────────────────────────────────────────────────┘
```

Style: Dark (#1A1A1E) background, gold border (#D4AF37), Fraunces heading font. Feels like a TV broadcast card, not a form button.

### B. On the family page (feed tab)
Already handled by `CreatePost` being at the top of the feed — this is correct. The redesign keeps this.

### C. Quick action strip (secondary)
Retain a compact 3-action row for desktop but reorder so Share is first:

```
[Share a moment]  [Add an event]  [Invite member]
```

Even in this secondary placement, Share gets left-most position (reading gravity).

---

## 6. Member Names and Avatars from Clerk

**Problem:** `m.userId.slice(0, 8) + "..."` and `${m.userId.slice(0, 8)}@example.com` are placeholders that convey zero warmth.

**Solution — three-tier lookup:**

```typescript
// Priority order for name resolution:
1. user.publicMetadata?.displayName       // Set explicitly by user in settings
2. user.firstName + " " + user.lastName   // Clerk full name
3. user.firstName                         // Clerk first name only
4. "Family member"                        // Final fallback (still better than userId slice)
```

```typescript
// For avatar:
1. user.imageUrl                          // Clerk profile photo
2. Generate initials avatar (e.g., "ES" for Elena Smith) with family gold accent
3. Generic silhouette                     // Final fallback
```

**Implementation:** Create a `useMemberProfile(userId: string)` hook or utility that:
1. Queries the `users` table (join via `familyMemberships.userId`) to get Clerk user metadata
2. Falls back gracefully to stored `displayName` in `publicMetadata` if Clerk API is slow
3. Returns `{ name: string, avatar: string | null, initials: string }`

**In `/app/family/[familyId]/page.tsx`:** Replace the placeholder name assignment:

```typescript
// Before:
name: m.userId.slice(0, 8) + "...",

// After:
name: resolveMemberName(m.userId), // from Clerk lookup utility
email: user?.primaryEmailAddress?.emailAddress ?? `${m.userId.slice(0,8)}@placeholder.family`,
```

**Critical note:** This requires the `users` table to store Clerk user metadata (or a Clerk webhook to sync). If the user record doesn't exist yet, the membership row should trigger creation on first sign-in.

---

## 7. Activity Feed on Dashboard

**Decision: Show last 3 posts as a horizontal scroll strip, not a full vertical feed.**

```
┌──────────────────────────────────────────────────────────────┐
│  Latest from your family channel                              │
│                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │ thumb  │  │ thumb  │  │ thumb  │  │ thumb  │  →         │
│  │        │  │        │  │        │  │        │            │
│  │ Title  │  │ Title  │  │ Title  │  │ Title  │            │
│  │Author  │  │Author  │  │Author  │  │Author  │            │
│  │ 2h ago │  │ Yesterday│ │ 3d ago │  │ 1w ago │            │
│  └────────┘  └────────┘  └────────┘  └────────┘            │
│                                                              │
│  See full channel →                                           │
└──────────────────────────────────────────────────────────────┘
```

**Why horizontal scroll (not vertical list):**
- Mirrors the TV Guide browsing experience — flip through, not scroll down
- Works well on mobile (swipe, not scroll)
- Creates a sense of abundance without overwhelming
- Maintains dashboard as a "front page" not a "feed page"

**What each card shows:**
- Thumbnail (16:9, rounded corners)
- Post title (or "Untitled moment" fallback)
- Author name + avatar (tiny circle)
- Relative timestamp ("2h ago", "Yesterday", "Mar 28")
- A small play icon overlay if it's a video

**"See full channel"** links to `/app/family/[familyId]` (the feed tab).

---

## 8. Empty State: Brand-New Family

**Concept:** "The TV is warming up. Grab the remote."

When a family has 0 posts, 0 events, and only the founding member(s):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📺                                        │
│                                                             │
│   Your Family TV is warming up.                             │
│                                                             │
│   Once you share your first moment, this becomes           │
│   your family's always-on channel — the place             │
│   grandparents open to feel close, even from              │
│   across the miles.                                        │
│                                                             │
│   ┌─────────────────────────────────────────────┐          │
│   │  ✦  Share your first moment                 │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   — or invite family to join first —                        │
│   [Send invite link]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Emotional tone:** Anticipatory, not apologetic. "Warming up" implies the TV is about to turn on — it's not broken, it's ready. The copy should invoke the emotional promise: grandparents, miles, feeling close.

**On the family page:** The empty feed state (`WarmEmptyState` component) should be updated to match this tone, with "Share your first memory" as the primary CTA and "Invite family members" as secondary.

---

## 9. Mobile-First Considerations

**Dashboard layout on mobile:**

```
┌────────────────────────┐
│  [Family name]  [👤+3] │  ← Header: family name + presence avatars
│                        │
│  ┌──────────────────┐  │
│  │ NOW PLAYING       │  │  ← Hero card, 16:9 thumbnail, play button
│  │ [thumbnail]       │  │
│  │ "Sophia's..."    │  │
│  │ ▶ Watch together  │  │
│  └──────────────────┘  │
│                        │
│  ✦ Share a moment      │  ← Full-width CTA button
│                        │
│  Recent activity       │
│  📹 Elena · Beach day  │
│  📹 Marcus · 4 videos  │
│                        │
│  Latest from channel   │
│  [scroll → thumbnails] │
│                        │
│  See full channel  →   │
└────────────────────────┘
```

**Key mobile decisions:**
- Hero is full-width, thumbnail 16:9 on top, text below
- Presence avatars in header (max 4 shown, then "+N")
- "Share a moment" CTA is full-width, 52px tall (thumb-friendly)
- Activity strip is vertical list on mobile (not horizontal scroll) — better for thumb scrolling
- Bottom navigation bar (if added): Home | Share | Family | Calendar | Profile — Share is center and prominent

**Desktop layout:** Two-column. Left column: Now Playing hero + Share CTA. Right column: Activity strip + Latest thumbnails + Stats summary. Sidebar: Family members presence list.

---

## 10. Component Inventory

### New Components

| Component | Description | Notes |
|-----------|-------------|-------|
| `NowPlayingHero` | Full-width hero card showing current/last video with play button and presence indicators | Primary dashboard element. States: has-video, empty, loading. |
| `PresenceAvatar` | Circular avatar with status ring (live/active/inactive) | Reusable. Props: `userId`, `size`, `showName`. |
| `PresenceBar` | Horizontal row of `PresenceAvatar` components with "N watching now" label | Used in hero and family page header. |
| `ActivityFeedStrip` | Horizontal scroll row of `PostThumbnailCard` components | Desktop primary. Mobile: vertical list via `ActivityFeedList`. |
| `PostThumbnailCard` | Compact card: thumbnail, title, author, timestamp | Used in `ActivityFeedStrip`. |
| `ActivityFeedList` | Vertical list version of activity feed | Mobile variant of `ActivityFeedStrip`. |
| `RecentActivityItem` | Single line: icon + author + action + timestamp | For the "Recent activity" strip. |
| `MemberNameResolver` | Utility/hook: resolves userId → display name + avatar from Clerk | Used everywhere member names appear. |
| `ShareMomentCTA` | Full-width cinematic CTA button | Primary action on dashboard. Gold border on dark bg. |
| `StatsWithContext` | Stat row that shows author/timestamp alongside counts | Replaces `StatCard` components. |
| `EmptyFamilyWelcome` | Full-page/panel empty state for new families | "TV is warming up" concept. |
| `FamilyPresenceSidebar` | Desktop-only: right sidebar showing all members with presence | Visible on dashboard when on desktop. |

### Modified Components

| Component | Change |
|-----------|--------|
| `FamilyFeedClient` | Update "You're all caught up! 🎉" to something warmer. Consider removing this message or making it contextual. |
| `WarmEmptyState` | Update to match "TV warming up" tone. Ensure CTA is "Share your first memory." |
| `CreatePost` | No structural change needed — already prominent in feed. Ensure it's also on the dashboard hero (or via `ShareMomentCTA`). |
| `FamilyMembers` | Replace placeholder names with Clerk-resolved names. Show presence indicator (green/gold ring) per member. |

### Deprecated / Removed

| Component | Reason |
|-----------|--------|
| `ActionButton` (quick actions row) | Replaced by `ShareMomentCTA` + top-nav actions. "Add event" and "Invite member" move to family page header. |
| Stat cards with no context | Replaced by `StatsWithContext` and `RecentActivityItem`. |

---

## Summary of Changes by Route

### `/app/dashboard` — New layout:
1. **Hero:** `NowPlayingHero` (video-first, presence bar, "Watch together")
2. **Primary CTA:** `ShareMomentCTA` (full-width, cinematic)
3. **Recent activity:** `RecentActivityItem` list (who did what, when)
4. **Latest thumbnails:** `ActivityFeedStrip` (last 4 posts, horizontal scroll)
5. **Presence sidebar:** `FamilyPresenceSidebar` (desktop only)
6. Remove: stat cards as-is, quick actions row, "Family feed" section with "View feed" button

### `/app/family/[familyId]` — Changes:
1. **Header:** Add `PresenceBar` below family name — "N watching now"
2. **Members tab:** Replace placeholder names with Clerk-resolved names; add presence rings
3. **Feed tab:** Empty state matches "TV warming up" tone
4. Remove: redundant stat display (now on dashboard)

---

## Implementation Priorities

**Phase 1 (MVP, ship next sprint):**
1. `MemberNameResolver` utility — fixes the placeholder name problem everywhere
2. `ShareMomentCTA` — elevates primary action
3. `NowPlayingHero` — replaces stats-first dashboard
4. `RecentActivityItem` — replaces contextless stat cards

**Phase 2 (next sprint):**
5. `PresenceBar` / `PresenceAvatar` — live presence indicators
6. `ActivityFeedStrip` — horizontal thumbnail row
7. `EmptyFamilyWelcome` — warm empty state
8. Update `FamilyMembers` with real names + presence rings

**Phase 3:**
9. `FamilyPresenceSidebar` — desktop presence sidebar
10. `StatsWithContext` — refined stat display
11. Dashboard/family page routing polish

---

*End of spec. Questions, objections, and edge cases welcome — this is a living document.*
