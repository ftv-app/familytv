# Sprint 010 — Activity Stories Feed Design Spec
**Issue:** https://github.com/ftv-app/familytv/issues/37
**Status:** Draft for warmth sign-off
**Author:** Principal Designer

---

## 1. Design Review: Current Dashboard

### What's There
The dashboard at `src/app/(app)/dashboard/page.tsx` + `dashboard-client.tsx` uses a **cinema/theater dark theme**:
- Background: `#0D0D0F` (cinema black)
- Theater charcoal cards: `#1A1A1E`
- Broadcast gold accents: `#D4AF37`
- Stats cards with icons, member presence dots, quick actions

### The Problem
This is an **enterprise analytics dashboard** disguised as a family app. The stats cards (`Members`, `Posts this week`, `Upcoming events`) feel like a SaaS product, not a family scrapbook. **The Activity Feed must break from this aesthetic entirely.**

---

## 2. Brand Warmth Pivot

The Activity Feed (and all family-facing surfaces) must adopt the **warm cream palette**:

| Token | Value | Usage |
|---|---|---|
| `cream-bg` | `#faf8f5` | Page background |
| `terracotta` | `#c4785a` | Primary accent, buttons, links |
| `terracotta-light` | `#d4937a` | Hover states |
| `warm-dark` | `#2D2D2D` | Body text |
| `warm-muted` | `#A8A8B0` | Secondary text (contrast-corrected from `#8E8E96`) |
| `forest-green` | `#2D5A3D` | Focus rings |
| `card-bg` | `#ffffff` | Card backgrounds (white, not charcoal) |

**Typography:**
- Headlines: **Fraunces** (serif, warm, inviting)
- Body/UI: **Plus Jakarta Sans**

**Border radius:** `12px` cards, `8px` buttons

---

## 3. Activity Feed Card — Layout

Each story card should feel like a **polaroid / framed moment**, not a data card.

```
┌─────────────────────────────────────────────────┐
│  ┌────┐  Author Name          ·  2 hours ago   │
│  │ AV │  @handle (optional)                    │
│  └────┘                                        │
│─────────────────────────────────────────────────│
│                                                 │
│   [ Image / Video thumbnail ]                   │
│   or content preview text                       │
│                                                 │
│─────────────────────────────────────────────────│
│  💬 3 comments  ·  ❤️ 12 reactions             │
└─────────────────────────────────────────────────┘
```

### Card Anatomy
- **Avatar:** 44×44px circle, border: 2px solid terracotta when author has posted recently
- **Author name:** Fraunces, 16px semibold, warm-dark
- **Timestamp:** Plus Jakarta Sans, 13px, warm-muted, relative ("2 hours ago")
- **Content preview:** Plus Jakarta Sans, 14px, warm-dark. Max 3 lines with ellipsis.
- **Media:** Full-width, 16:9 aspect ratio crop, rounded-lg corners, subtle shadow
- **Reactions row:** Heart + comment count, terracotta icons, warm-muted text

### Card Spacing Tokens
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--card-padding: 20px
--card-gap: 16px
--feed-gap: 12px  (between cards)
```

### Card Shadow (warm, soft)
```css
box-shadow: 0 2px 12px rgba(196, 120, 90, 0.08), 0 1px 3px rgba(0,0,0,0.06);
border: 1px solid rgba(196, 120, 90, 0.12);
```

### Hover State
- Translate Y: -2px
- Shadow intensifies: `0 6px 20px rgba(196, 120, 90, 0.15)`
- Transition: 200ms ease-out

---

## 4. Empty State

### Copy
- **Headline:** "Your family's story starts here"
- **Body:** "When someone shares a moment, it will appear here"
- **Primary CTA button:** "Share the first moment" → navigates to `#create-post` or equivalent
- **Secondary link:** "Invite family members →" (subtle, below CTA)

### Visual Treatment
- Centered layout, generous vertical padding (80px+)
- Large illustration or emoji: a warm polaroid frame or camera icon in terracotta/cream
- Background: cream `#faf8f5`
- Subtle decorative border or photo-stand graphic
- **No dashboard-style icons** (no charts, no graphs, no data)

---

## 5. Loading Skeleton

Skeleton cards must match the feed card dimensions and maintain the warm aesthetic:

```
┌─────────────────────────────────────────────────┐
│  ┌──┐  ████████████              ██████         │
│  └──┘  ██████████                             │
│─────────────────────────────────────────────────│
│  ██████████████████████████████████████████████│
│  ██████████████████████████████████████         │
│─────────────────────────────────────────────────│
│  ██████  ·  ████████████                       │
└─────────────────────────────────────────────────┘
```

- Skeleton base color: `#f0ede8` (slightly warmer than white)
- Shimmer: `#faf8f5` → `#f0ede8` → `#faf8f5`
- Border radius: 12px (matches card)
- No dark/charcoal skeletons — this is a warm surface

---

## 6. Feed Container

- Max width: `680px`, centered
- Background: `cream #faf8f5`
- Padding: `16px` (mobile), `24px` (desktop)
- "Create post" composer pinned at top (warm terracotta CTA button)

---

## 7. QA Copy Reference (for E2E tests)

| Element | Copy |
|---|---|
| Empty headline | "Your family's story starts here" |
| Empty body | "When someone shares a moment, it will appear here" |
| Empty CTA | "Share the first moment" |
| Feed loaded | "You're all caught up! 🎉" |
| Load more btn | "Load more" |

---

## 8. Out of Scope (post-Sprint 010)

- Infinite scroll (pagination only for Sprint 010)
- Real-time presence dots (dashboard, not feed)
- Reactions interactivity (display only for Sprint 010)

---

## ⚠️ Critical: PostCard Component Needs Redesign

The existing `src/components/post-card.tsx` uses the **dark theater theme**:
```tsx
style={{
  backgroundColor: "#1A1A1E",     // ← charcoal (WRONG)
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
}}
```

**This must be replaced** with the warm scrapbook card design:
- Card background: `#ffffff` (white)
- Border: `1px solid rgba(196, 120, 90, 0.12)`
- Border radius: `12px`
- Warm shadow: `0 2px 12px rgba(196, 120, 90, 0.08)`
- Text colors: warm-dark `#2D2D2D`, warm-muted `#A8A8B0`
- Avatar fallback: terracotta tint (not forest green `#2D5A4A`)

**WarmEmptyState** (`src/components/warm-empty-state.tsx`) is **already correct** — no changes needed there. It uses `#faf8f5` cream, `#c4785a` terracotta, Fraunces headings, and the right palette.
