# FamilyTV Design Brief — Cinema/Broadcast Pivot

**Status:** Active  
**Version:** 1.0  
**Date:** 2026-03-30  
**Author:** Principal Designer  
**Supersedes:** Previous warm-terracotta design language  
**Governs:** All UI, brand, motion, and accessibility decisions for FamilyTV Phase 1–4

---

## 1. Overview

This brief defines the visual language for FamilyTV's transformation from "family media library" to **"private family TV station."** Every design decision must serve two sometimes-competing goals:

1. **Cinematic authority** — this is a broadcast-quality viewing experience
2. **Domestic warmth** — this is still a family's living room, not a screening room

The brand is no longer metaphorically a TV. It is literally a TV channel. The visual system must earn that identity on sight.

---

## 2. Color System

### 2.1 Primary Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | **Cinema Black** | `#0D0D0F` | Primary app background, video player surround |
| Surface | **Theater Charcoal** | `#1A1A1E` | Cards, panels, TV Guide background, modals |
| Surface Elevated | **Shadow Gray** | `#252529` | Hover states, active cards, expanded panels |
| Surface Highest | **Slate** | `#2E2E34` | Dropdowns, tooltips, popovers |
| Border | **Ghost** | `rgba(255,255,255,0.06)` | Subtle card edges, dividers — never solid white at >6% |
| Primary Accent | **Velvet Red** | `#C41E3A` | Now Playing indicator, LIVE badge, primary play button, alerts |
| Secondary Accent | **Broadcast Gold** | `#D4AF37` | Channel callsign, family name, premium timestamps, star ratings |
| Text Primary | **Silver White** | `#E8E8EC` | Headings, video titles, primary labels |
| Text Secondary | **Muted Silver** | `#8E8E96` | Timestamps, metadata, "Chosen by," captions |
| Text Tertiary | **Dim** | `#5A5A62` | Placeholders, disabled states |
| Success | **Green Signal** | `#2ECC71` | Online indicators, sync confirmed, "Joined Live" |
| Warning | **Amber** | `#F39C12` | Solo Mode badge, reconnecting state, "X minutes behind" |
| Danger | **Alert Red** | `#E74C3C` | Errors, sync failures |

### 2.2 Warmth Palette (Small accents, never dominant)

These keep the dark palette from feeling cold or clinical:

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Warm Cream | **Cream** | `#FDF8F3` | Secondary text on dark when warmth needed, contrast labels, button text on dark |
| Terracotta Tint | **Terracotta Warm** | `#C4785A` | Accent borders on family member avatars, "welcome" tones in onboarding |
| Forest Action | **Forest** | `#2D5A4A` | Primary buttons (CTA), success states, positive actions |
| Forest Light | **Forest Lighter** | `#3D7A64` | Button hover states |
| Forest Glow | **Forest Glow** | `rgba(45,90,74,0.35)` | Button glow/shadow on dark bg |

### 2.3 Dark Mode Only — No Light Mode Toggle

FamilyTV Channel View is **dark-mode exclusive.** The cinema aesthetic is not an alternate theme — it is the product.

Exception: Settings screens, forms, and utility pages (calendar, family roster) may use `#1A1A1E` or `#FDF8F3` as appropriate for readability of dense information. The video player and TV Guide screens are always cinema dark.

### 2.4 Color Application Rules

- **Never use pure white (#FFFFFF) on dark backgrounds** — it causes bloom/bleed on most screens. Use Silver White `#E8E8EC` for primary text.
- **Never use pure black (#000000)** — it flattens depth. Cinema Black `#0D0D0F` retains subtle depth.
- **Velvet Red is for LIVING things only** — live indicator, play button, alert badges. Do not use on cards, backgrounds, or structural elements.
- **Broadcast Gold is for NAMES** — channel callsign, family name, video titles on the player. It is a "premium attention" color. Use sparingly.
- **Forest green is the action color** — primary CTA buttons, "Join Live," queue additions. It contrasts Velvet Red deliberately (warm vs. hot).

---

## 3. Typography

### 3.1 Font Stack

```
Display / Channel Callsign:  'Oswald', 'Arial Narrow', sans-serif   — weight 600–700
Headings / Section Labels:   'Oswald', sans-serif                    — weight 500–600
Body / Metadata:             'Source Sans 3', 'Source Sans Pro', sans-serif — weight 400–600
Mono / Timecode:             'JetBrains Mono', 'Fira Code', monospace        — weight 400–500
```

### 3.2 Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Do not use:** Inter, Roboto, Arial, Open Sans, Lato. These are generic. Oswald + Source Sans + JetBrains Mono are the fixed typographic identity.

### 3.3 Type Scale (Dark Mode — 1.05× Light Mode Sizes)

Dark backgrounds make type feel thinner and smaller. Sizes below are tuned for dark-mode legibility. Increase from standard Tailwind/semantic scale by ~5%:

| Role | Size (px) | Size (rem) | Weight | Line Height | Tracking |
|------|-----------|------------|--------|-------------|----------|
| Channel Callsign (TV) | 56–72 | 3.5–4.5rem | 700 | 1.0–1.1 | -0.02em |
| Page Title (Now Playing) | 32–40 | 2–2.5rem | 600 | 1.1 | -0.01em |
| Section Header ("UP NEXT") | 14–16 | 0.875–1rem | 600 | 1.0 | 0.08em (uppercase) |
| Video Title (Large) | 22–26 | 1.375–1.625rem | 500 | 1.2 | 0 |
| Video Title (List) | 16–18 | 1–1.125rem | 500 | 1.3 | 0 |
| Body Text | 15–16 | 0.9375–1rem | 400 | 1.5 | 0 |
| Metadata ("Chosen by") | 13–14 | 0.8125–0.875rem | 400 | 1.4 | 0 |
| Timestamp / Timecode | 13–14 | 0.8125–0.875rem | 500 (mono) | 1.0 | 0.05em |
| Badge / Label | 11–12 | 0.6875–0.75rem | 600 | 1.0 | 0.06em |

### 3.4 Type Color by Context

- **On Cinema Black:** `#E8E8EC` (Silver White) — primary text
- **On Theater Charcoal:** `#E8E8EC` or `#FDF8F3` (Cream) for warm-tone labels
- **Metadata, timestamps:** `#8E8E96` (Muted Silver)
- **Disabled:** `#5A5A62` (Dim)
- **LIVE badge:** `#C41E3A` (Velvet Red)
- **Channel callsign:** `#D4AF37` (Broadcast Gold)

---

## 4. Texture & Atmosphere

### 4.1 Film Grain Overlay

A subtle film grain texture overlays the entire app background, fixed (does not scroll), at **3–5% opacity**.

Implementation: SVG noise filter or CSS `background-image: url("data:image/svg+xml,...")` applied to `::before` pseudo-element on the root app container.

- Opacity: `0.03–0.05` (tune per component)
- Blend mode: `overlay` or `soft-light`
- Noise pattern: high-frequency, monochrome
- NOT a moving animation — film grain is static, like real film stock

### 4.2 CRT Scan Line Effect (TV Guide Only)

The TV Guide screen (not the player) carries a subtle CRT scan line effect:

```css
/* Scan line overlay — TV Guide only */
.tv-guide-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 100;
}
```

This is a **nostalgic broadcast nod** — not a distracting overlay. The lines are barely visible. If it causes accessibility issues (photosensitivity), provide a toggle in accessibility settings to disable scan lines.

### 4.3 Vignette on Video Player

The video player edges carry a soft radial vignette — darker at corners, transparent at center. This frames the video as a "screen within a screen" and draws the eye to the center.

```css
.player-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 55%,
    rgba(13, 13, 15, 0.5) 100%
  );
  pointer-events: none;
  z-index: 10;
}
```

The vignette should be barely perceptible —families should feel immersed, not framed.

### 4.4 No Harsh Borders

- **Cards and panels:** Use `box-shadow` with low-opacity blacks, or subtle border `rgba(255,255,255,0.06)`. Never `border: 1px solid #333`.
- **Buttons:** Border-radius + subtle inner glow (Forest) for primary, ghost borders for secondary.
- **Video player frame:** No visible border at all. The video edge dissolves into the vignette.

### 4.5 Glow Effects

Where glows are needed (play button, live indicator, "now watching" avatars), use `box-shadow` with color-matched glows:

```css
/* Velvet Red glow — play button hover, live dot */
.glow-red {
  box-shadow: 0 0 20px rgba(196, 30, 58, 0.5), 0 0 40px rgba(196, 30, 58, 0.2);
}

/* Broadcast Gold glow — channel callsign, family name */
.glow-gold {
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3);
}

/* Forest glow — primary CTA buttons */
.glow-forest {
  box-shadow: 0 4px 20px rgba(45, 90, 74, 0.4), 0 0 40px rgba(45, 90, 74, 0.15);
}
```

---

## 5. Spacing System

Base unit: **4px**. All spacing is a multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight internal padding (icon + label) |
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Standard element padding |
| `space-4` | 16px | Card padding, section gaps |
| `space-6` | 24px | Major section separation |
| `space-8` | 32px | Page-level padding |
| `space-12` | 48px | Screen top/bottom margins on TV-size viewports |
| `space-16` | 64px | Hero element breathing room |

**Border radius:**
- Video player container: `12px`
- Cards (TV Guide list items): `8px`
- Buttons: `6px` (primary), `4px` (secondary/icon)
- Avatars: `50%` (circle)
- LIVE badge: `4px`
- Input fields: `6px`

---

## 6. Motion Philosophy

FamilyTV motion is **deliberate, smooth, and authoritative.** Think broadcast studio — not TikTok. Transitions are choreographed, not frenetic.

### 6.1 Core Principles

1. **No bounce, no spring** — Easing curves are smooth ease-in-out or custom cubic-bezier. No overshoot.
2. **Cross-fade over cut** — Video transitions dissolve, not hard-switch. 400–600ms cross-fade.
3. **Channel navigation is tactile** — Swiping channels feels like clicking a real remote: fast, decisive, 250ms max.
4. **Presence fades, not pops** — Avatars appearing/disappearing fade over 300ms.
5. **Playback controls reveal on interaction, then fade** — Controls appear on tap, fade out after 3 seconds of inactivity.

### 6.2 Transition Timings

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Video cross-fade (Next in queue) | 500ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Channel surf swipe | 250ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| TV Guide slide up | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Control bar fade (show/hide) | 200ms | `ease-out` |
| Card hover (scale + shadow lift) | 150ms | `ease-out` |
| Avatar presence fade | 300ms | `ease-in-out` |
| Toast notification enter | 250ms | `ease-out` |
| Toast notification exit | 200ms | `ease-in` |
| Modal / sheet open | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Solo Mode badge appear | 200ms | `ease-out` |

### 6.3 Prohibited Animations

- ❌ Scale bounce on button press
- ❌ Skeleton shimmer animation (use opacity pulse instead, slower — 1.5s)
- ❌ Hard-cut video transitions
- ❌ Particle effects, confetti, snow
- ❌ Continuous ambient motion (no floating, rotating, or pulsing elements except the LIVE indicator)
- ❌ Parallax scrolling on TV player screen

### 6.4 LIVE Indicator Animation

The only continuous animation in the TV view is the **LIVE dot** — a slow, steady pulse:

```css
.live-dot {
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}
```

The pulse is slow enough to not distract from video content. Do not animate the LIVE text — only the dot.

---

## 7. Component Inventory

### 7.1 Now Playing Bar (Persistent)

A minimal bottom bar that persists across all FamilyTV screens (except when in PiP).

```
┌──────────────────────────────────────────────────────────────┐
│  [▶/▮▮]  Thanksgiving Outtakes 2024     ──:–– / –:––:––  [👤👤👤 3] │
└──────────────────────────────────────────────────────────────┘
```

- Background: `#1A1A1E` with top border `rgba(255,255,255,0.06)`
- Height: 56px
- Play/pause button: 40px touch target, Velvet Red when playing
- Video title: truncated with ellipsis, Silver White
- Timecode: JetBrains Mono, Muted Silver
- Viewer avatars: stacked circles (max 3 visible + "+N" overflow), Green Signal dot on each "online" avatar
- Tap bar: expands mini-player; swipe down: minimize to bar

### 7.2 TV Guide Screen

Slides up from bottom (350ms ease-out). Full-height sheet on mobile, modal on desktop.

```
┌─────────────────────────────────────────────────────────────┐
│  ★ THE HENDERSON CHANNEL                    [LIVE ●] [✕]   │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  NOW PLAYING                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Thumbnail — 16:9]                                     │ │
│  │                                                       │ │
│  │  Thanksgiving Outtakes 2024                            │ │
│  │  Chosen by: Grandma June  ●  4:22 / 12:34             │ │
│  │  [⏮]  [⏸ Pause]  [+10s]   [Skip to Next ▶]            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  UP NEXT ───────────────────────────────────────────────── │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [thumb] Kids Swimming — Summer 2024          2:30  Sarah │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [thumb] Lily's First Bike Ride                1:15  Mike │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [thumb] Dad's 70th Birthday Toast             3:45  Tom │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [◀ Channel 2]    ● 1 ●    [Channel 3 ▶]                   │
└─────────────────────────────────────────────────────────────┘
```

- Background: `#0D0D0F` with CRT scan line overlay
- NOW PLAYING thumbnail: 16:9, border-radius `12px`, soft vignette on thumbnail edges
- "UP NEXT" list: vertical stack of `8px` gap cards, each with thumbnail (80×45px), title, duration, member name
- Active queue item (next to play): left border `3px solid #C41E3A`
- Channel switcher: horizontal dots (● active, ○ inactive), channel name label below

### 7.3 Video Player Screen (Hero)

The primary screen. The video fills the viewport with a subtle vignette overlay.

```
┌─────────────────────────────────────────────────────────────┐
│ [Family Logo/Callsign — top left, Broadcast Gold]           │
│                              [👤 Presence Strip — top right] │
│                                                             │
│                                                             │
│                    [VIDEO CONTENT]                          │
│                                                             │
│                                                             │
│  [⏮ –10s]          [▶ PLAY]          [+10s ⏭]               │
│                                                             │
│  Thanksgiving Outtakes 2024                                 │
│  Chosen by: Grandma June  ●  LIVE                           │
│  ───────────────────────────–●─────────────  4:22 / 12:34   │
└─────────────────────────────────────────────────────────────┘
```

- Video fills viewport. Vignette draws eye to center.
- Controls appear on tap, auto-hide after 3s
- Progress bar: Velvet Red scrubber, `#3A3A3E` track, `8px` height, grows to `12px` on hover
- Family name/callsign: Broadcast Gold, Oswald 600, top-left, subtle glow
- LIVE badge: Velvet Red dot (pulsing) + "LIVE" text in Oswald 500 uppercase
- Play button: 72px circle, Velvet Red, centered, soft glow on hover

### 7.4 Family Channel Landing Page

When the user first opens FamilyTV (not logged in to a session), they arrive at a landing page that feels like **tuning into a TV channel**.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                   ★ THE HENDERSON FAMILY ★                  │
│                         CHANNEL                              │
│                                                             │
│                   ┌─────────────────────┐                   │
│                   │   [Animated/Static  │                   │
│                   │    Channel Poster]  │                   │
│                   │                     │                   │
│                   └─────────────────────┘                   │
│                                                             │
│               Currently playing:                            │
│           Thanksgiving Outtakes 2024                       │
│           Chosen by: Grandma June                           │
│                                                             │
│              [  ▶ JOIN THE BROADCAST  ]                      │
│                                                             │
│                   4 family members watching now             │
│                                                             │
│              📺 Available on Web · iOS · Android             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Background: Cinema Black with film grain overlay
- Channel callsign: Broadcast Gold, Oswald 700, large (64px), centered, text-shadow glow
- "CHANNEL" subtitle: Silver White, Oswald 400, letter-spacing 0.3em
- Channel poster: 16:9 thumbnail of current video, border-radius `12px`, subtle shadow
- "Currently playing" section: muted, small type, Muted Silver
- CTA button: Forest green, large (full-width on mobile), rounded `8px`, glow on hover
- Family viewer count: beneath CTA, Muted Silver, JetBrains Mono for the number
- Platform badges: small, Silver White icons

### 7.5 Presence Avatars

Family members currently watching:

- Avatar: 32px circle, colored border matching family's color assignment
- Online indicator: 8px Green Signal dot, bottom-right of avatar, pulsing slowly (4s cycle)
- Solo Mode: Amber dot instead of green, yellow "SOLO" badge beneath
- Hover: tooltip with name and "Watched for X minutes"

### 7.6 Live Badge

```
┌──────────────┐
│  ●  LIVE     │   ← Oswald 600, 11px, Velvet Red, border-radius 4px
└──────────────┘
```

- Background: `rgba(196, 30, 58, 0.15)` — barely-there red bg
- Border: `1px solid rgba(196, 30, 58, 0.3)`
- Dot: 6px, Velvet Red, animated pulse (2s ease-in-out infinite)
- Padding: 4px 8px

---

## 8. Iconography

- **Style:** Outlined icons (Lucide icon set — consistent 24px, 1.5px stroke)
- **Play/Pause:** Phosphor icons or Lucide `play-fill` / `pause-fill` — not mix of solid/outline
- **Channel navigation:** `chevron-left` / `chevron-right`
- **Skip:** `skip-forward` / `skip-back` with duration label (-10s, +10s)
- **Live indicator:** custom animated SVG dot
- **Guide:** `tv` or `layout-grid`
- **Presence:** `eye` or `users`
- **Solo mode:** `user` with horizontal line through (custom)
- **No custom icons** — all icons from the same library, same weight

---

## 9. Responsive Strategy

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | 320–639px | Single column, bottom-anchored controls, Now Playing bar persistent |
| Tablet | 640–1023px | Two-column TV Guide, larger player controls |
| Desktop | 1024–1439px | Side-by-side player + guide panel, expanded presence strip |
| TV / Large | 1440px+ | Cinematic letterboxing on sides, max player width 1280px, centered |

### Mobile-First

- All TV Guide interactions are designed for thumb-at-rest (see PRD Section 4.4)
- Minimum touch target: **48×48px** for all interactive elements
- Bottom-anchored controls on mobile (play/pause, skip) — reachable without hand shift
- Swipe up from player: opens TV Guide
- Swipe left/right on guide: channel up/down

---

## 10. Accessibility

- **Color contrast:** All text on Cinema Black and Theater Charcoal must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
- **Muted Silver `#8E8E96` fails AA on `#0D0D0F`** — use `#A8A8B0` (5.2:1) for Muted Silver on dark
- **Focus indicators:** Visible, styled to match brand (Forest green outline, 2px, offset 2px) — never remove focus rings
- **LIVE dot animation:** Respects `prefers-reduced-motion` — replace pulse with static filled dot
- **CRT scan lines:** Provide toggle in accessibility settings to disable
- **Screen reader:** All controls labeled. Video player announces: "[Title], chosen by [Member], [time elapsed] of [duration], [LIVE or CATCH-UP]"

---

## 11. Shadows & Elevation

| Elevation | Value | Usage |
|-----------|-------|-------|
| `sm` | `0 2px 8px rgba(0,0,0,0.3)` | Card resting, subtle lift |
| `md` | `0 4px 20px rgba(0,0,0,0.4)` | Hovered cards, open modals |
| `lg` | `0 8px 40px rgba(0,0,0,0.5)` | Dropdowns, popovers, TV Guide sheet |
| `player` | `0 0 80px rgba(0,0,0,0.6)` | Video player surround — deep, immersive |
| `glow-forest` | `0 4px 20px rgba(45,90,74,0.4)` | CTA buttons |
| `glow-gold` | `0 0 30px rgba(212,175,55,0.3)` | Broadcast Gold text |

**No white or light shadows.** All shadows are black with varying opacity. Shadows define depth on a dark canvas — light shadows would look broken.

---

## 12. What This Design Is NOT

- **Not cold or clinical** — warmth comes from rounded corners, inviting copy, Broadcast Gold family names, and cream-on-dark secondary text
- **Not "dark mode" as an accessibility afterthought** — Cinema Black is the primary, canonical background
- **Not brutalist** — no harsh white-on-black, no exposed structure, no utilitarian coldness
- **Not TikTok/Reels vertical video** — FamilyTV is a 16:9 widescreen broadcast experience
- **Not a streaming service clone** — it has personality. The "living room" warmth is the differentiator.

---

## 13. Implementation Notes for Frontend Dev

- **Tailwind config:** Override `colors` with the palette above. Add custom `fontFamily` tokens.
- **CSS custom properties:** Define all colors as `--color-*` variables on `:root` for dark mode scope.
- **Grain overlay:** Implement as a fixed `::before` on `#app-root` — single point of control.
- **CRT scan lines:** Implement as a component-level `::after` on `<TVGuideScreen>` only.
- **Video player:** Use `<video>` with custom controls overlay. Do not use native browser controls.
- **Cross-fade transition:** Two `<video>` elements, opacity cross-fade managed in JS. Current video fades out (500ms), next fades in.
- **Presence:** WebSocket-driven. Avatars update via React state from WebSocket events. No polling.
- **Now Playing bar:** `position: sticky` bottom on mobile, `position: fixed` on desktop.

---

## 14. Image Handling & Display

### 14.1 Image Card Design (Feed/Grid)

**Aspect Ratios:**
- `1:1` — Square thumbnails in grid/feed views
- `16:9` — Landscape hero images, featured content
- `4:3` — Portrait images (preserves portrait framing with side bars on wide screens)

**Card Styling:**
- Border radius: `8px`
- Shadows: `box-shadow: 0 2px 8px rgba(0,0,0,0.3)` resting; on hover: `box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(212,175,55,0.1)` (soft glow in Broadcast Gold)
- Hover lift: `transform: translateY(-2px)`, `150ms ease-out`

**Hover Overlay:**
- Gradient: `linear-gradient(to top, rgba(13,13,15,0.85) 0%, rgba(13,13,15,0.4) 50%, transparent 100%)` from bottom
- Overlay reveals: family member name (Silver White, Source Sans 600) + timestamp (JetBrains Mono, Muted Silver)
- Both in Broadcast Gold (`#D4AF37`) accent for the member name; timestamp in Muted Silver

---

### 14.2 Image Gallery / Lightbox

**Backdrop:**
- Background: `rgba(13, 13, 15, 0.95)` (Cinema Black at 95% opacity)
- Backdrop covers full viewport, `position: fixed`, `z-index: 1000`

**Image Display:**
- Centered in viewport, `max-height: 90vh` and `max-width: 90vw`, whichever dimension is smaller constrains
- `object-fit: contain` — images never crop in lightbox
- Letterboxing with Cinema Black bars when image aspect ratio differs from viewport

**Close Button:**
- Position: top-right corner, `16px` from edges
- Style: `24px` circle, Velvet Red (`#C41E3A`) background, white `×` icon (Lucide `x`)
- Hover: `box-shadow: 0 0 12px rgba(196,30,58,0.5)`

**Navigation:**
- Arrow buttons (Lucide `chevron-left` / `chevron-right`) on left/right edges of viewport, `48px` touch targets
- Keyboard: `←` / `→` arrow keys
- Mobile: swipe left/right gesture detection (touch start → touch end delta > 50px)
- Arrow color: Silver White, `32px` icons

**Image Counter:**
- Position: bottom center, `16px` from bottom
- Style: `"3 of 12"` format
- Font: JetBrains Mono, `13px`, Muted Silver (`#8E8E96`)

---

### 14.3 Image Thumbnails

**Blur Placeholder:**
- Auto-generated tiny base64 blur placeholder (10px wide, heavily blurred via CSS `filter: blur(20px)`) shown instantly while full image loads
- Placeholder color-extracted from image or neutral dark (`#1A1A1E`) as fallback

**Skeleton Loading State:**
- Background: Cinema Black (`#0D0D0F`)
- Shimmer: subtle opacity pulse — `animation: skeleton-pulse 1.5s ease-in-out infinite`
- Shimmer color: `rgba(255,255,255,0.03)` peak, `rgba(255,255,255,0.01)` trough
- Shape matches target image aspect ratio (no layout shift)

**Lazy Loading:**
- Use `loading="lazy"` attribute on `<img>` elements
- Intersection Observer as progressive enhancement: load full image when within `200px` of viewport
- Images outside viewport render placeholder only (no network request)

**Low-Quality Image Placeholder (LQP):**
- Serve a 20px wide WebP placeholder inline as base64 `src`
- Full image loads over it using `onload` swap — no flash of empty container
- Technique: `<img>` starts with LQP base64 `src`, JS swaps to full `src` on load event

---

### 14.4 Media Type Indicators

**Badge Placement:** Top-left corner of image card, `8px` inset from edges

**Video Badge:**
- Icon: Lucide `video` or `film` (24px stroke icon), `14px` size
- Background: Velvet Red (`#C41E3A`)
- Icon color: white
- Badge: `24px` circle
- Position: absolute, `top: 8px`, `left: 8px`

**Photo Badge:**
- Icon: Lucide `image` (24px stroke icon), `14px` size
- Background: Theater Charcoal (`#1A1A1E`) with `1px solid rgba(255,255,255,0.1)` border
- Icon color: Silver White
- Badge: `24px` circle
- Position: same as video badge — mutually exclusive per media item

---

### 14.5 Image Upload Flow

**Drag-and-Drop Zone:**
- Default: dashed border `2px dashed rgba(255,255,255,0.15)`, border-radius `12px`
- Active (file hovering): border color transitions to Broadcast Gold (`#D4AF37`), background `rgba(212,175,55,0.05)`, `200ms` transition
- Drop zone min-height: `160px`
- Copy: "Drop photos and videos here" in Muted Silver, Source Sans 400

**Upload Progress Bar:**
- Track: `rgba(255,255,255,0.1)`, `4px` height, border-radius `2px`
- Fill: Forest green (`#2D5A4A`), full rounded ends
- Animation: width transitions smoothly as upload progresses, `150ms` ease-out
- Label: percentage in JetBrains Mono, Muted Silver, `12px`, above the bar

**Error State:**
- Border: `2px solid Velvet Red (`#C41E3A`)`
- Error message below drop zone: Alert Red (`#E74C3C`), Source Sans 400, `13px`
- Icon: Lucide `alert-circle` in Alert Red, inline before message

**Success State:**
- Drop zone border: `2px solid Green Signal (`#2ECC71`)`
- Checkmark: Lucide `check-circle` in Green Signal, fades in `300ms ease-out`
- Optional: brief "Upload complete" text, then zone resets to default

---

### 14.6 Album / Collection Grid

**Grid Layout:**
- Desktop (≥1024px): 3 columns
- Tablet (640–1023px): 2 columns
- Mobile (<640px): 1 column
- Gap: `12px` between items

**Cover Image:**
- Defaults to first image in the collection (chronologically earliest)
- User can manually set any image as album cover via context menu
- Cover uses `object-fit: cover`, matches card aspect ratio (1:1 or 16:9 depending on album type)

**Album Card:**
- Border radius: `8px`
- Shadow: `box-shadow: 0 2px 8px rgba(0,0,0,0.3)` resting; `0 4px 16px rgba(0,0,0,0.4)` hover
- Bottom overlay: gradient from transparent to `rgba(13,13,15,0.7)` at bottom
- Family member avatar: `24px` circle, positioned bottom-left, `12px` from edges
- Member name: Source Sans 500, Silver White, `13px`, next to avatar
- Album title: Oswald 500, Silver White, `14px`, below avatar/name row
- Image count: JetBrains Mono, Muted Silver, `12px`, e.g. `"42 photos"`

---

### 14.7 Image Aspect Ratio Handling

| Context | `object-fit` | Behavior |
|---------|--------------|----------|
| Feed/grid thumbnails | `cover` | Fills the card, crops excess — no distortion |
| Album cover | `cover` | Same as thumbnails |
| Portrait images in grid | `cover` | Center-cropped to fit square/landscape card |
| Full-screen viewer (lightbox) | `contain` | Full image visible, Cinema Black letterbox bars if needed |
| Profile avatars | `cover` | Circle crop, center-focused |

**No image distortion ever.** If source image doesn't match card aspect ratio, `object-fit: cover` crops the excess. The lightbox always uses `object-fit: contain` with black bars rather than any distortion.

---

### 14.8 Optimization Notes

**Format Strategy:**
- Serve WebP as primary format for all images
- JPEG fallback for browsers without WebP support (auto-detected via `<picture>` element or CDN negotiation)
- Compression target: 80% quality for WebP/JPEG (adjust per image type — photos `~80%`, graphics/avatars `~85%`)

**Responsive Images (`srcset`):**
```
<img
  src="image-800w.webp"
  srcset="image-400w.webp 400w, image-800w.webp 800w, image-1200w.webp 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```
- Generate 400w, 800w, 1200w variants at build/upload time
- `sizes` attribute tells browser which variant to download based on layout width

**Display Density (`srcset` + `sizes`):**
- 1x, 2x, 3x variants for Retina/HiDPI displays
- Combine with width-based srcset: browser picks smallest image that still looks sharp at native device pixel ratio

**Upload Limits:**
- Per image: `50MB` maximum file size (any format)
- Per family per month: `5GB` total media storage (photos + videos combined)
- Enforce on client (before upload) and reject on server with clear error message

---

## 15. Landing Page Image Integration

The landing page is the channel's "on-air" frame — the first thing families see before signing in. It must feel like tuning into a warm, welcoming broadcast from the very first moment.

### 15.1 Hero Visual Treatment

The login/signup card floats over a full-bleed background image, creating depth and emotional warmth immediately.

**Background Image:**
- Full-bleed, edge-to-edge behind the entire viewport (not just the card)
- Subject: candid family gathering or living room moment — warm lighting, natural interaction (not posed)
- Mood: intimate, domestic, authentic — grandparents with grandchildren, shared laughter, holiday meals, backyard scenes
- Fallback: If no family imagery is available, use a soft cinematic living room still (warm lamp light, soft window glow, textured fabric)
- Image should not contain readable text, prominent faces that might distract, or anything that competes with the card CTA

**Gradient Overlay:**
- Direction: top-to-bottom (dark at top fading to transparent toward bottom) OR center-out radial
- Colors: Cinema Black `rgba(13, 13, 15, 0.70)` → transparent
- Purpose: ensures all text on the card remains legible regardless of background image brightness
- Implementation: CSS `linear-gradient` or `radial-gradient` positioned above the image, below the card

**Film Grain Overlay (Hero):**
- Same film grain treatment as app-wide (Section 4.1)
- Opacity: 3% (`0.03`) — subtle texture, barely perceptible, adds analog warmth without visible noise
- Blend mode: `overlay`
- Fixed position, does not scroll
- Single implementation can cover hero area; does not need to be repeated if already on root `::before`

### 15.2 Image Carousel on Landing Page

Behind the CTA area, a slowly rotating carousel of family imagery keeps the page alive between visits.

**Carousel Content:**
- 3–5 images cycling through a "featured families" collection
- Content: family candid moments, not posed studio shots — birthday candles, beach days, Sunday dinners, graduation celebrations
- All images share the same warm, candid quality as the hero background
- If insufficient family content exists: curated stock imagery matching the warm/candid aesthetic (labeled "placeholder" in comments, replaced in production)

**Auto-Advance Timing:**
- Interval: every 5 seconds
- Transition: slow cross-fade, 800ms duration, `ease-in-out` curve
- No hard cuts or slides — only opacity cross-fade

**Cinematic Zoom Effect:**
- Subtle Ken Burns / slow zoom on each image: `transform: scale(1.0)` → `scale(1.03)` over the 5-second interval
- Restart: each new image begins at `scale(1.0)` and zooms to `scale(1.03)` before the next transition
- Effect: adds depth and a cinematic feel without being distracting
- Implementation: CSS `animation` on each image, `animation-duration: 5s`, `animation-timing-function: ease-in-out`

**Carousel Implementation Notes:**
- Stack images absolutely positioned in the same container, z-index layering
- Only the topmost image has `opacity: 1`; others are `opacity: 0`
- On transition: fade out current (800ms), fade in next (800ms), simultaneously apply zoom animation
- No visible carousel controls (arrows/dots) — fully automated, hands-off
- Disable carousel (show static hero image) when `prefers-reduced-motion` is enabled

### 15.3 Landing Page Layout

**Logo / Wordmark:**
- Display: "FamilyTV" wordmark
- Font: Oswald 600 weight
- Color: Broadcast Gold `#D4AF37`
- Effect: soft glow — `text-shadow: 0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2)`
- Position: centered above tagline, above the fold

**Tagline:**
- Text: "Your family's private channel"
- Font: Source Sans 3, weight 300 (light)
- Color: Cream `#FDF8F3`
- Size: 18–20px / 1.125–1.25rem
- Letter-spacing: `0.02em`
- Position: directly below logo, centered

**CTA Buttons (Primary):**
- Background: Forest `#2D5A4A`
- Text color: Cream `#FDF8F3`
- Border radius: `8px`
- Padding: `14px 32px`
- Font: Source Sans 3, weight 600
- Hover state: Forest Lighter `#3D7A64`, subtle glow shadow `box-shadow: 0 4px 16px rgba(45, 90, 74, 0.4)`
- Active/press: slight scale down (`scale(0.98)`), `100ms` transition

**Secondary Link:**
- Text: "Learn about FamilyTV"
- Font: Source Sans 3, weight 400
- Color: Muted Silver `#8E8E96`
- Text decoration: none (no underline default)
- Hover: color transitions to Velvet Red `#C41E3A`, `200ms ease`
- Position: beneath or beside the primary CTA

**Landing Page Card:**
- Background: Theater Charcoal `rgba(26, 26, 30, 0.85)` with `backdrop-filter: blur(8px)`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Border radius: `12px`
- Shadow: `0 8px 40px rgba(0, 0, 0, 0.5)`
- Max-width: `420px`
- Padding: `40px`
- Centering: vertically and horizontally centered in viewport (flexbox `center`)

### 15.4 Social Proof Images

Testimonial cards with authentic family imagery reinforce trust and belonging on the landing page.

**Card Layout:**
- Background: Theater Charcoal `#1A1A1E`
- Border: `1px solid rgba(13, 13, 15, 0.8)` — subtle Cinema Black border, visible on dark backgrounds
- Border radius: `12px`
- Padding: `16px`
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
- Width: `280px` (fixed width; cards arranged in a horizontal row or scrollable strip)

**Avatar:**
- Shape: circle (`border-radius: 50%`)
- Size: `48px` diameter
- Image: real family photo — smiling, casual, warm (not corporate headshots)
- Border: `2px solid rgba(212, 175, 55, 0.4)` — subtle Broadcast Gold ring
- `object-fit: cover`

**Family Name:**
- Font: Oswald 500, `14px`
- Color: Broadcast Gold `#D4AF37`
- Position: right of avatar, vertically centered with avatar
- Format: "The [Family Name] Family" or "[Family Name] Family"

**Quote:**
- Font: Source Sans 3, weight 400, `14px`, italic
- Color: Silver White `#E8E8EC`
- Line height: `1.5`
- Max lines: 3 (truncate with ellipsis if longer)
- Position: below the avatar + family name row
- Opening quotation mark: Broadcast Gold `#D4AF37`, `24px`, as decorative prefix

**Card Arrangement:**
- Horizontal row of 3 cards (desktop), scrollable on mobile
- Gap between cards: `16px`
- Section heading above: "Families love FamilyTV" — Oswald 500, Silver White, `16px`, uppercase, letter-spacing `0.08em`

**Social Proof Section Spacing:**
- Margin above section: `48px`
- Margin below section: `32px`
- Card grid: centered, `flex-wrap: wrap` on mobile

---

*Brief version: 1.0 | Status: Active | Review: Before Phase 2 sprint planning*

---

## 16. Slideshow Feature

Families can create planned slideshows from their shared images, with filters and auto-scroll. Slideshows feel like private family broadcasts — curated, warm, and cinematic.

### 16.1 Slideshow Builder

**Image Selection:**
- Multi-select grid from family library — checkmarks appear on selected images
- Selected images show a Velvet Red checkmark badge in top-right corner
- Drag-and-drop reorder within the builder
- Minimum 1 image, maximum 100 images per slideshow

**Metadata:**
- Slideshow title: Oswald 600, Broadcast Gold (`#D4AF37`), 22px
- Title input field: Source Sans 400, Theater Charcoal background, Cinema Black text, 6px radius

**Duration Per Slide:**
- Radio button group: 3s / 5s / 8s / 15s
- Style: JetBrains Mono labels, Forest green selected state, Theater Charcoal unselected
- Default: 5s

**Transition Style:**
- Options: Cross-fade (default) / Slide left / Slide right / Zoom
- Styled identically to duration radio buttons
- Cross-fade: 500ms ease-in-out
- Slide transitions: 400ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Zoom: 600ms `cubic-bezier(0.4, 0, 0.2, 1)`

### 16.2 Filter Presets

All filters applied via CSS filters on the displayed image. Preview thumbnail in builder updates in real-time.

| Filter Name | CSS Values | Notes |
|-------------|-----------|-------|
| **Original** | `filter: none` | No processing |
| **Warm Glow** | `filter: sepia(20%) brightness(105%)` | Warm tint from cream palette |
| **Cinematic** | `filter: contrast(110%) saturate(90%)` + vignette overlay | Slight vignette via CSS pseudo-element |
| **Memory** | `filter: brightness(95%) contrast(95%)` + blur edges | Edge blur via gradient mask, cream tint `rgba(253,248,243,0.1)` |

**Filter Display:**
- Filter name shown in JetBrains Mono below preview thumbnail
- Font size: 12px, Muted Silver (`#8E8E96`)
- Real-time preview as filter is selected (no "apply" step)

### 16.3 Slideshow Player

**Full-Screen Display:**
- Background: Cinema Black (`#0D0D0F`) full viewport
- Image centered with `object-fit: contain`
- Soft vignette overlay on image edges: same radial gradient as Section 4.3

**Progress Bar:**
- Position: bottom of screen, full width
- Height: 3px
- Color: Forest (`#2D5A4A`)
- Shows elapsed / total time in JetBrains Mono (e.g., "0:15 / 2:30")
- Timecode display: top-right, JetBrains Mono 13px, Muted Silver

**Pause on Hover:**
- Hovering over the player area pauses playback
- Cursor changes to pointer; play/pause icon appears centered

**Controls (fade in on hover, 200ms ease-out):**

| Control | Position | Style |
|---------|----------|-------|
| Play/Pause | Bottom center | 24px Lucide icon, Velvet Red (`#C41E3A`) |
| Previous | Bottom center, left of Play/Pause | 20px arrow, Muted Silver |
| Next | Bottom center, right of Play/Pause | 20px arrow, Muted Silver |
| Exit (X) | Top-right corner | Velvet Red circle, 24px, white × icon |

**Now Playing Label:**
- Format: "Now playing: [Slideshow Title]"
- Font: Oswald 400, Broadcast Gold, 16px
- Position: Top-left, below family callsign

### 16.4 Sharing & Scheduling

**Share Slideshow:**
- "Share Slideshow" button: Forest green, Oswald 500, 14px
- Generates a family-internal link (e.g., `/family/slideshow/[id]`)
- Only family members can access — no public URL
- Copy-to-clipboard on click with "Copied!" confirmation toast

**Schedule for Later:**
- Date/time picker: UTC-anchored timestamps
- UI: Theater Charcoal panel, Source Sans labels
- Time displayed in family member's local timezone with UTC reference in JetBrains Mono
- Minimum schedule lead time: 5 minutes from now

**Scheduled Slideshow Feed Card:**
- Card style: 16:9 thumbnail, border-radius 8px
- Title: Oswald 500, Silver White
- "Upcoming Slideshow" badge: Forest background, Cream text, 4px radius
- Duration badge: JetBrains Mono, Muted Silver, bottom-right of thumbnail
- Filter name: JetBrains Mono, Muted Silver, below title
- Card hover: `translateY(-2px)`, `box-shadow: 0 4px 16px rgba(0,0,0,0.4)`, 150ms ease-out
- Scheduled time shown in Cream text, Source Sans 400

**Notifications:**
- Push notification to all family members when scheduled slideshow begins
- Notification text: "[Family Name] Slideshow: [Title] is starting now"
- In-app notification appears in family feed

### 16.5 Design Details

**Builder Screen Layout:**
- Background: Cinema Black (`#0D0D0F`)
- Left panel (70%): Image selection grid — 4 columns desktop, 3 tablet, 2 mobile, gap 8px
- Right sidebar (30%): Slideshow settings — title, duration, transition, filter, share/schedule buttons
- Sidebar background: Theater Charcoal (`#1A1A1E`), 8px radius, 16px padding

**Feed Slideshow Card:**
- Thumbnail: 16:9 aspect ratio, `object-fit: cover`
- Title: Oswald 500, Silver White, 14px
- Duration badge: JetBrains Mono, Muted Silver, positioned bottom-right of thumbnail
- Filter name: JetBrains Mono 11px, Muted Silver, below title
- Shadow: `0 2px 8px rgba(0,0,0,0.3)` resting; `0 4px 16px rgba(0,0,0,0.5)` hover

**Transitions Reference:**
| Transition | CSS Animation | Duration |
|-----------|---------------|----------|
| Cross-fade | `opacity: 0→1` crossfade | 500ms |
| Slide left | `translateX(100%→0)` | 400ms |
| Slide right | `translateX(-100%→0)` | 400ms |
| Zoom | `transform: scale(0.95→1)` + opacity | 600ms |

All easing: `cubic-bezier(0.4, 0, 0.2, 1)` (smooth ease-in-out)

---

*Section 16 added: Slideshow Feature | Status: Active | Version: 1.0*
