# Tailwind Theme Audit — 2026-04-06

**Audit:** #12 — Tailwind theme tokens vs. design brief
**Date:** 2026-04-06 01:28 UTC
**Auditor:** CEO (Atlas)
**Status:** IN PROGRESS

---

## Token Mapping: Design Brief → Current CSS

| Design Token | Specified Hex/oklch | Usage | Current in brand.css | Status |
|---|---|---|---|---|
| Cinema Black (background) | `#0D0D0F` | App bg (dark mode) | `--background: oklch(0.145 0.015 50)` | ⚠️ oklch equivalent (confirmed via design brief conversion) |
| Theater Charcoal (surface) | `#1A1A1E` | Cards, panels | `--card: oklch(0.185 0.015 50)` | ⚠️ oklch equivalent |
| Velvet Red (primary accent) | `#C41E3A` | Live indicator, play button | NOT present as `--color-destructive` is warm red | ❌ Missing |
| Forest (primary action) | `#2D5A4A` | CTA buttons, "Join Live" | `--color-ring: #2D5A3D` (wrong hex!) | ❌ Wrong hex |
| Broadcast Gold | `#D4AF37` | Channel callsign, family name | `--color-accent: oklch(70% 0.1 80)` (warm gold, not broadcast gold) | ⚠️ Tone mismatch |
| Silver White (text) | `#E8E8EC` | Headings, titles | `--foreground: oklch(0.18 0.015 50)` in dark mode | ⚠️ oklch equivalent |
| Terracotta Warm | `#C4785A` | Avatar borders, "welcome" tones | `--color-primary: oklch(55% 0.12 50)` | ⚠️ Used as PRIMARY, but brief says small accent only |
| Focus ring | `#2D5A4A` | Focus indicator | `#2D5A3D` in brand.css, `#2D5A4A` in globals.css | ❌ Inconsistent across files |

---

## Issues Found

### 1. Forest hex mismatch (CTM-221 follow-up)
- **Design brief:** `--color-ring: #2D5A4A` (Forest)
- **brand.css line 52:** `--color-ring: #2D5A3D` (wrong hex!)
- **globals.css line 92, 152:** `--ring: #2D5A4A` (correct)
- **brand.css line 179:** `outline: 2px solid #2D5A3D` (wrong hex!)
- **Impact:** Focus ring color is inconsistent between files. One file has the right hex, one doesn't.

### 2. Forest NOT designated as primary action color
- **Design brief:** "Forest green is the action color — primary CTA buttons, 'Join Live,' queue additions"
- **Current brand.css:** `--color-primary: oklch(55% 0.12 50)` (terracotta) — terracotta is NOT the primary action color per the brief
- **Impact:** Primary buttons use the wrong color. Forest green (#2D5A4A) should be the primary button color, not terracotta.

### 3. Terracotta overused
- **Design brief:** "Terracotta Tint — Accent borders on family member avatars, 'welcome' tones in onboarding" — small accents
- **Current:** Terracotta is the `--color-primary` used on all primary buttons
- **Impact:** Design language mismatch. Terracotta should be a secondary accent, not primary.

### 4. Velvet Red missing as distinct token
- **Design brief:** Velvet Red `#C41E3A` — "for LIVING things only — live indicator, play button, alert badges"
- **Current:** `--color-destructive: oklch(50% 0.2 25)` is the closest but it's described as "warm red" not "Velvet Red"
- **Impact:** No dedicated Velvet Red token for LIVE/play button use cases

### 5. Broadcast Gold tone mismatch
- **Design brief:** `#D4AF37` — "Channel callsign, family name, premium timestamps"
- **Current:** `--color-accent: oklch(70% 0.1 80)` — warm gold, different tone
- **Impact:** Family names and channel callsigns won't have the premium "Broadcast Gold" appearance

---

## Files Reviewed

- `src/app/brand.css` — brand token overrides
- `src/app/globals.css` — warm palette CSS variables
- `design/family-tv-design-brief.md` — source of truth

---

## Fixes Required

1. **brand.css line 52:** Change `--color-ring: #2D5A3D` → `--color-ring: #2D5A4A`
2. **brand.css line 179:** Change `outline: 2px solid #2D5A3D` → `outline: 2px solid #2D5A4A`
3. **Add `--color-velvet-red: #C41E3A`** as a dedicated token for live/play use cases
4. **Add `--color-forest` and `--color-forest-light`** tokens for CTA buttons
5. **Deprecate terracotta as primary** — add a note that `--color-primary` should transition to Forest
6. **Add Broadcast Gold token** `--color-gold: #D4AF37` for names/callsigns

---

## Verification

Run: `grep -n "2D5A" src/app/brand.css src/app/globals.css` to confirm all focus ring instances use `#2D5A4A`.