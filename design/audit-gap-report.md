# FamilyTV Design Gap Report

**Audit Date:** 2026-03-30
**Auditor:** Principal Designer
**Spec Version:** 1.0 (Cinema/Broadcast Pivot)
**Deploy:** https://familytv.vercel.app

---

## Executive Summary

The deployed app is **~35% aligned** with the Cinema/Broadcast design spec. The **core palette and typography are correctly implemented** in `globals.css` and `brand.css`, and the **authenticated app shell** (dashboard, family feed, calendar, members) uses the Cinema Black palette. However, **public auth pages still use the old warm terracotta palette**, and **nearly all TV broadcast-specific features are unimplemented**.

Priority order:
- **P1** — Auth pages (sign-in, sign-up, onboarding) must adopt Cinema Black immediately — these are the first screens new users see
- **P1** — TV Player screen, TV Guide, Now Playing bar, Presence system — the core broadcast experience doesn't exist yet
- **P2** — LIVE badge, image carousel, custom video controls, slideshow builder
- **P3** — Texture/atmosphere polish (CRT scan lines, Ken Burns, filter presets)

---

## Section-by-Section Audit

### Section 1 — Overview / Brand Identity
**Status: 🔄 Partial**

The brand's identity as "private family TV station" is expressed correctly in:
- `globals.css` — Cinema Black palette defined as `--background: #0D0D0F`
- `brand.css` — All color tokens, glow effects, live pulse animation, film grain overlay
- `src/app/page.tsx` — Landing page uses correct palette, Oswald + Source Sans 3 + JetBrains Mono fonts, Broadcast Gold logo

**Gap:** The brand identity is NOT carried through to auth pages (Clerk-hosted sign-in/sign-up), onboarding pages, or the notification/settings/profile pages.

---

### Section 2 — Color System
**Status: ✅ Implemented (palette) | ❌ Not applied everywhere**

CSS variables correctly defined in `globals.css` and `brand.css`:
- Cinema Black `#0D0D0F` → `--background`
- Theater Charcoal `#1A1A1E` → `--card`
- Velvet Red `#C41E3A` → `--color-live`
- Broadcast Gold `#D4AF37` → `--accent`
- Forest `#2D5A4A` → `--primary`
- Silver White `#E8E8EC` → `--foreground`
- Muted Silver `#8E8E96` → `--muted-foreground`

**Gaps:**
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page NOT wrapped in cinema dark context; Clerk's own UI renders with default warm styling
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Same issue
- `src/app/onboarding/page.tsx`, `src/app/onboarding/create-family/page.tsx`, `src/app/onboarding/invite/page.tsx` — All use the old warm terracotta palette
- `src/app/dashboard/notifications/page.tsx` — Uses default shadcn light styling (background not overridden)
- `src/app/settings/page.tsx` — Not confirmed cinema dark
- `src/app/profile/page.tsx` — Not confirmed cinema dark

**Files needing Cinema Black:** `src/app/onboarding/*.tsx`, `src/app/dashboard/notifications/page.tsx`, `src/app/settings/page.tsx`, `src/app/profile/page.tsx`

---

### Section 3 — Typography
**Status: ✅ Implemented (fonts) | 🔄 Partial (usage)**

Fonts correctly loaded in `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

- `--font-heading: 'Oswald'` — applied to channel callsigns, section labels
- `--font-sans: 'Source Sans 3'` — applied to body text
- `--font-mono: 'JetBrains Mono'` — applied to timecodes

**Gaps:**
- `JetBrains Mono` is NOT used for timecodes in the post-card component (timestamps use `text-xs text-muted-foreground` with default font)
- Section 3.3 Type Scale (1.05× dark mode sizing) is not systematically applied — most body text is standard size, not enlarged for dark mode legibility
- Oswald uppercase with letter-spacing (Section 3.3 "CHANNEL", "UP NEXT") is not used — section headers use `font-heading` without the `letter-spacing: 0.08em` uppercase treatment

---

### Section 4 — Texture & Atmosphere
**Status: 🔄 Partial**

Implemented in `brand.css`:
- ✅ Film grain overlay (body::before, opacity 0.04, mix-blend-mode: overlay)
- ✅ Vignette (`.player-container::after` CSS defined but class not used in any component)
- ✅ Glow effects (`.glow-red`, `.glow-gold`, `.glow-forest` CSS defined)
- ❌ CRT scan lines (`.tv-guide-screen::after` CSS defined but component doesn't exist)

**Gaps:**
- Film grain is applied globally via `body::before` — correct per spec (single point of control)
- Vignette CSS exists but `.player-container` class is not used in any component — video player doesn't have vignette
- CRT scan lines CSS exists but no `<TVGuideScreen>` component uses it

---

### Section 5 — Spacing System
**Status: ✅ Implemented**

4px base unit followed throughout. Border radii match spec:
- Video player container: `12px` — not applicable (player not built)
- Cards: `8px` — used in `cinema-card` class
- Buttons: `6px` primary, `4px` secondary — shadcn defaults
- Avatars: `50%` — implemented

---

### Section 6 — Motion Philosophy
**Status: ❌ Not implemented**

No CSS transition timings defined per spec. No `.ease-out`, `.ease-in-out`, or cubic-bezier curves for the specified interactions. No motion tokens in CSS.

**Gaps:**
- Video cross-fade (500ms) — not implemented
- Channel surf swipe (250ms) — not implemented
- TV Guide slide up (350ms) — not implemented
- Control bar fade (200ms) — not implemented
- Card hover (150ms) — partially implemented via `.cinema-card:hover`
- LIVE dot pulse — implemented in `brand.css` `.live-dot` class, but class not used anywhere

**Skeleton shimmer:** Post-card uses `animate-spin` on a border spinner. Spec requires "opacity pulse instead, slower — 1.5s". Not implemented.

---

### Section 7 — Component Inventory
**Status: ❌ Mostly not implemented**

#### 7.1 Now Playing Bar
**Status: ❌ NOT implemented**
No persistent bottom bar in the app. Does not exist as a component.

#### 7.2 TV Guide Screen
**Status: ❌ NOT implemented**
No TV Guide component exists. No channel switcher, no "NOW PLAYING" / "UP NEXT" layout.

#### 7.3 Video Player Screen
**Status: ❌ NOT implemented**
No custom video player screen exists. The `post-card.tsx` has a basic `VideoPlayer` sub-component that:
- Uses native HTML5 `<video controls>` or YouTube/Vimeo iframe embed
- Has no vignette overlay
- Has no broadcast gold family name
- Has no LIVE badge
- Has no Now Playing bar
- Has no presence avatar strip
- Has no skip controls (`-10s`, `+10s`)
- Has no custom progress bar (Velvet Red scrubber)

#### 7.4 Family Channel Landing Page
**Status: 🔄 Partial**
- ✅ Cinema Black background with film grain
- ✅ Channel callsign in Broadcast Gold, Oswald 700
- ✅ "CHANNEL" subtitle with letter-spacing
- ✅ CTA button in Forest green
- ✅ Family viewer count in JetBrains Mono
- ❌ No image carousel (Ken Burns / slow zoom effect) — spec Section 15.2
- ❌ No "Currently playing" section showing the live video
- ❌ No channel poster thumbnail

#### 7.5 Presence Avatars
**Status: ❌ NOT implemented**
No WebSocket-driven presence system. No online indicator dots (Green Signal). No "SOLO" badge.

#### 7.6 Live Badge
**Status: ❌ NOT implemented**
The `.live-dot` CSS animation exists but no `<LiveBadge>` component uses it. No "LIVE" badge rendered anywhere.

---

### Section 8 — Iconography
**Status: 🔄 Partial**

Lucide icons used throughout (`lucide-react`), which is correct. Play/pause icons mix `svg` inline and Lucide — inconsistent. Channel navigation icons (`chevron-left`, `chevron-right`) exist but no channel surfing UI.

**Gap:** Custom animated LIVE dot SVG (Section 8) not implemented as a reusable component.

---

### Section 9 — Responsive Strategy
**Status: ✅ Partial**

Breakpoints defined in Tailwind. Mobile-first structure. Minimum 44px touch targets implemented on key buttons.

**Gap:** 48px minimum touch target spec (Section 9) — some icon buttons may be below this threshold (e.g., avatar buttons at 40px in post-card).

---

### Section 10 — Accessibility
**Status: 🔄 Partial**

- ✅ Dark background (#0D0D0F) provides good contrast for Silver White (#E8E8EC)
- ✅ Focus indicators styled (Forest green outline)
- ❌ Muted Silver `#8E8E96` on Cinema Black `#0D0D0F` is ~2.8:1 contrast ratio — **fails WCAG AA 4.5:1** for normal text. Should be `#A8A8B0` (5.2:1) per spec Section 10.
- ❌ `prefers-reduced-motion` — no reduction of animation when enabled
- ❌ CRT scan line toggle — not implemented
- ❌ Screen reader announcements for video player — not implemented

**Critical accessibility gap:** `#8E8E96` used for timestamps, metadata, and most secondary text fails WCAG AA contrast on dark backgrounds. Must replace with `#A8A8B0` throughout.

---

### Section 11 — Shadows & Elevation
**Status: ✅ Implemented in CSS**

`brand.css` defines all shadow tokens:
- `sm`: `0 2px 8px rgba(0,0,0,0.3)` — used in `.cinema-card`
- `md`: `0 4px 20px rgba(0,0,0,0.4)` — defined
- `lg`: `0 8px 40px rgba(0,0,0,0.5)` — defined
- `glow-forest`, `glow-gold` — defined but not used in components

---

### Section 12 — What This Design Is NOT
**Status: ✅ Brand intent respected**

No violations found in the implemented palette. Not cold, not clinical, not brutalist.

---

### Section 13 — Implementation Notes
**Status: 🔄 Partial**

- ✅ `globals.css` overrides Tailwind colors with cinema palette
- ✅ CSS custom properties defined on `:root`
- ✅ Film grain on `body::before`
- ❌ No `<TVGuideScreen>` component
- ❌ No cross-fade video transition (two `<video>` elements)
- ❌ No WebSocket presence
- ❌ No `position: sticky` Now Playing bar

---

### Section 14 — Image Handling & Display
**Status: 🔄 Partial**

#### 14.1 Image Card Design
**Status: ✅ Implemented (post-card)**
- Cards use `#1A1A1E` background with `rgba(255,255,255,0.06)` border — correct
- Hover lift: not explicitly implemented in post-card (shadcn Card doesn't have the hover translateY(-2px))
- Hover overlay with gradient — NOT implemented (caption/metadata shown below, not overlaid)
- `object-fit: cover` — used

#### 14.2 Image Lightbox
**Status: 🔄 Partial**
- ✅ Backdrop `rgba(13, 13, 15, 0.95)` — close (uses `bg-black/80`)
- ✅ `max-height: 90vh`, `max-width: 90vw` — correct
- ✅ `object-contain` — correct
- ✅ Close button exists (top-right)
- ❌ Close button uses white background, not Velvet Red circle — not per spec
- ❌ No image counter ("3 of 12")
- ❌ No keyboard navigation (← →) for images
- ❌ No swipe gesture detection
- ❌ No letterboxing with Cinema Black bars — just uses `rounded-lg`

#### 14.3 Image Thumbnails
**Status: ✅ Partial**
- `loading="lazy"` — not present on post-card images
- No blur placeholder — shows spinner instead
- Skeleton uses spin animation, not opacity pulse — not per spec

#### 14.4 Media Type Indicators
**Status: ❌ NOT implemented**
No video/photo badges on post-card thumbnails. The spec says video badge is top-left corner, Velvet Red circle with film icon.

#### 14.5 Image Upload Flow
**Status: ❌ NOT implemented**
No drag-and-drop upload zone component exists.

#### 14.6 Album / Collection Grid
**Status: ❌ NOT implemented**
No album/collection UI.

#### 14.7 Image Aspect Ratio
**Status: ✅ Implemented**
`object-fit: cover` on thumbnails, `object-contain` in lightbox.

---

### Section 15 — Landing Page Image Integration
**Status: 🔄 Partial**

#### 15.1 Hero Visual Treatment
**Status: ✅ Implemented**
Landing page uses Cinema Black background. No full-bleed background image (which is fine for MVP — spec says it's optional).

#### 15.2 Image Carousel
**Status: ❌ NOT implemented**
No carousel on the landing page. No Ken Burns zoom effect. No cross-fade auto-advance.

#### 15.3 Landing Page Layout
**Status: ✅ Implemented**
- ✅ Logo in Broadcast Gold with glow
- ✅ Tagline in Cream
- ✅ Primary CTA in Forest green
- ✅ Card with `backdrop-filter: blur(8px)` and `rgba(26,26,30,0.85)`
- ❌ Social proof section with family testimonial cards — NOT implemented

#### 15.4 Social Proof Images
**Status: ❌ NOT implemented**
No "Families love FamilyTV" testimonial section.

---

### Section 16 — Slideshow Feature
**Status: ❌ NOT implemented**

No slideshow builder, no slideshow player, no filter presets, no sharing/scheduling. This entire feature is absent.

---

## Summary Gap Table

| Section | Feature | File(s) | Priority |
|---------|---------|---------|----------|
| 2 | Auth pages still use warm terracotta | `sign-in/`, `sign-up/`, Clerk components | P1 |
| 2 | Onboarding pages still warm terracotta | `onboarding/` | P1 |
| 2 | Settings/profile/notifications not cinema dark | `settings/`, `profile/`, `notifications/` | P1 |
| 7.1 | Now Playing bar | Component not built | P1 |
| 7.2 | TV Guide screen | Component not built | P1 |
| 7.3 | Video Player screen (hero) | Component not built | P1 |
| 7.5 | Presence Avatars (WebSocket) | No component, no WebSocket | P1 |
| 7.6 | LIVE badge component | Component not built | P2 |
| 14.2 | Lightbox — close button, counter, keyboard nav | `image-lightbox.tsx` | P2 |
| 14.4 | Video/photo media type badges | `post-card.tsx` | P2 |
| 14.5 | Drag-and-drop upload zone | No component | P2 |
| 16 | Slideshow builder + player | Not built | P2 |
| 15.2 | Image carousel + Ken Burns | `src/app/page.tsx` | P3 |
| 15.4 | Social proof section | Not built | P3 |
| 4 | CRT scan line toggle | Not implemented | P3 |
| 6 | Motion/timing system | No CSS tokens | P3 |
| 10 | Muted Silver contrast (#A8A8B0 fix) | `globals.css`, `brand.css` | P1 (a11y) |
| 8 | Live dot animated SVG component | No component | P2 |

---

## Files Requiring Changes (Priority Order)

### P1 — Must Fix
| File | Change |
|------|--------|
| `src/app/onboarding/page.tsx` | Apply Cinema Black palette, replace warm terracotta |
| `src/app/onboarding/create-family/page.tsx` | Apply Cinema Black palette |
| `src/app/onboarding/invite/page.tsx` | Apply Cinema Black palette |
| `src/app/dashboard/notifications/page.tsx` | Apply Cinema Black palette |
| `src/app/settings/page.tsx` | Apply Cinema Black palette |
| `src/app/profile/page.tsx` | Apply Cinema Black palette |
| `src/app/brand.css` | Replace `#8E8E96` with `#A8A8B0` for WCAG AA compliance |
| `globals.css` | Replace `#8E8E96` with `#A8A8B0` for WCAG AA compliance |

### P1 — Must Build (New Components)
| Component | File |
|-----------|------|
| Now Playing bar | `src/components/now-playing-bar.tsx` |
| TV Guide screen | `src/components/tv-guide-screen.tsx` |
| Video Player screen | `src/components/video-player-screen.tsx` |
| Presence Avatars | `src/components/presence-avatars.tsx` |
| LIVE badge | `src/components/live-badge.tsx` |

### P2 — Should Fix
| File | Change |
|------|--------|
| `src/components/image-lightbox.tsx` | Velvet Red close button, image counter, keyboard nav |
| `src/components/post-card.tsx` | Video/photo media type badges, JetBrains Mono timestamps |

### P2 — Should Build (New)
| Component | Description |
|-----------|-------------|
| Slideshow builder | `src/components/slideshow-builder.tsx` |
| Slideshow player | `src/components/slideshow-player.tsx` |
| Upload drop zone | `src/components/upload-dropzone.tsx` |

### P3 — Nice to Have
| Feature | File |
|---------|------|
| Landing page carousel | `src/app/page.tsx` |
| Social proof section | `src/app/page.tsx` |
| Motion timing CSS tokens | `globals.css` or `brand.css` |
| CRT scan line toggle | Accessibility settings |

---

*End of Gap Report*
