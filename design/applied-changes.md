# FamilyTV Cinema Black Design System - Applied Changes

## Date: 2026-03-30

## Summary

Applied the new TV/cinema/broadcasting design language ("a private family TV station") to FamilyTV. Pivoted from warm terracotta/cream aesthetic to Cinema Black dark theme.

---

## Files Changed

### 1. `src/app/brand.css`
**Purpose:** Core brand design tokens and styles

**Changes:**
- Replaced warm terracotta palette with Cinema Black palette
- Added all color variables per design brief:
  - Background: `#0D0D0F` (Cinema Black)
  - Surface: `#1A1A1E` (Theater Charcoal)
  - Velvet Red: `#C41E3A` (LIVE indicators, play buttons only)
  - Broadcast Gold: `#D4AF37` (names, callsigns)
  - Forest green: `#2D5A4A` (primary CTAs)
  - Silver White: `#E8E8EC` (primary text)
  - Muted Silver: `#8E8E96` (secondary text)
- Added font imports for Oswald, Source Sans 3, JetBrains Mono
- Added film grain overlay effect (fixed position, 4% opacity)
- Added glow effect classes: `.glow-red`, `.glow-gold`, `.glow-forest`
- Added `.live-dot` animation (pulse for LIVE indicator)
- Added CRT scan line effect (`.tv-guide-screen::after`)
- Added video player vignette effect (`.player-container::after`)
- Added `.cinema-card` component styles
- Added button styles: `.btn-primary`, `.btn-secondary`, `.btn-live`
- Added typography helpers: `.text-gold`, `.text-live`, `.text-silver`, `.heading`, `.timecode`

### 2. `src/app/globals.css`
**Purpose:** Tailwind/shadcn CSS variable overrides

**Changes:**
- Replaced warm oklch colors with Cinema Black hex values
- Updated all color tokens to match design brief palette
- Added `.dark` class overrides for dark mode (now the only mode)
- ThemeProvider now defaults to `dark` theme with system disabled

### 3. `src/app/layout.tsx`
**Purpose:** Root layout with fonts and providers

**Changes:**
- Replaced Fraunces font with **Oswald** (heading/channel callsign)
- Replaced Plus Jakarta Sans with **Source Sans 3** (body text)
- Changed ThemeProvider defaultTheme from `"light"` to `"dark"`
- Disabled `enableSystem` (dark mode only, no light mode toggle)
- Updated Toaster toast style to match cinema palette
- Added `dark` class to html element by default

### 4. `src/app/page.tsx`
**Purpose:** Landing page

**Changes:**
- Replaced warm cream background with Cinema Black (`#0D0D0F`)
- Added TV icon with Velvet Red background
- Brand name "FamilyTV" now in Broadcast Gold (`#D4AF37`) with glow effect
- Cards now use Theater Charcoal (`#1A1A1E`) with ghost borders
- Primary CTAs now Forest green (`#2D5A4A`), not terracotta
- "HOW IT WORKS" section with dark cards
- Feature cards with colored icon backgrounds (Velvet Red, Broadcast Gold, Green Signal)
- Updated all text colors: Silver White for headings, Muted Silver for secondary
- Section headers now uppercase Oswald with letter-spacing

### 5. `src/app/onboarding/page.tsx`
**Purpose:** Welcome/onboarding entry page

**Changes:**
- Cinema Black background
- TV icon replaces generic logo
- "FamilyTV" brand name in Broadcast Gold
- Get Started button in Forest green
- All text uses cinema palette (Silver White, Muted Silver)
- Back link in Muted Silver

### 6. `src/app/onboarding/create-family/page.tsx`
**Purpose:** Family name creation step

**Changes:**
- Cinema Black background
- Progress dots use Forest green (active) and ghost borders (inactive)
- Star icon with Broadcast Gold glow
- "your channel?" text in Broadcast Gold
- Family name suggestions in dark cards with ghost borders
- Continue button in Forest green
- All text uses cinema palette

### 7. `src/app/onboarding/invite/page.tsx`
**Purpose:** Invite family members step

**Changes:**
- Cinema Black background
- Wave/people icon with Green Signal tint
- Progress dots consistent with create-family
- "Copy invite link" button in Forest green
- Email input with dark styling
- "Skip for now" link in Muted Silver

---

## Color Application Rules Applied

Per design brief Section 2.4:

| Color | Hex | Usage | Applied To |
|-------|-----|-------|------------|
| Cinema Black | `#0D0D0F` | Backgrounds | All page backgrounds |
| Theater Charcoal | `#1A1A1E` | Cards, panels | Cards, inputs, modals |
| Velvet Red | `#C41E3A` | LIVE/play only | TV icon, LIVE elements |
| Broadcast Gold | `#D4AF37` | Names/callsigns | Brand name, channel name |
| Forest green | `#2D5A4A` | Primary CTA | All action buttons |
| Silver White | `#E8E8EC` | Primary text | Headings, titles |
| Muted Silver | `#8E8E96` | Secondary text | Descriptions, metadata |
| Green Signal | `#2ECC71` | Online indicators | Success states |

---

## Constraints Followed

- ✅ Dark mode only (no light mode toggle)
- ✅ Never uses pure white `#FFFFFF` or pure black `#000000`
- ✅ Primary CTAs use Forest (`#2D5A4A`), not Velvet Red
- ✅ Velvet Red (`#C41E3A`) reserved for LIVE indicators, play buttons
- ✅ Broadcast Gold (`#D4AF37`) for names and channel callsigns only
- ✅ `npm run build` passes with no errors
- ✅ `npm test` passes (112 tests)

---

## Design Elements Added

- Film grain overlay (4% opacity, fixed position)
- Glow effects for Gold text (30px shadow blur)
- LIVE dot pulse animation (2s ease-in-out infinite)
- CRT scan line effect (ready for TV Guide)
- Video player vignette (radial gradient)
- Ghost borders (`rgba(255,255,255,0.06)`)
- Custom scrollbar (dark tones)

---

## Verification

```
Build: ✅ Successful (exit code 0)
Tests: ✅ 112 passed (9 test files)
Commit: ab87bff
```
