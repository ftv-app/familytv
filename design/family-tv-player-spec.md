# FamilyTV TV Player Screen — Design Spec

**Status:** New (not yet built)
**Version:** 1.0
**Date:** 2026-03-30
**Author:** Principal Designer
**Spec Section:** Section 7.3 (Video Player Screen Hero) of the FamilyTV Design Brief

---

## 1. Overview

The TV Player screen is the **primary screen of FamilyTV** — the cinematic broadcast experience where family members watch video content together. It is the screen that most directly realizes the brand promise: *"private family TV station."*

This spec defines the layout, controls, states, and implementation details for the FamilyTV player. It covers:
1. Full-viewport video player with vignette
2. Tap-to-reveal control overlay
3. Now Playing bar (top)
4. Channel indicator + broadcaster avatar (top)
5. Playback controls (centered)
6. Progress bar (bottom)
7. Now Playing info strip (bottom)

**The player must feel like a TV, not a media library.** Every design decision reinforces broadcast authority — this is a channel you're tuning into, not a file you're opening.

---

## 2. Visual Design

### 2.1 Color Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Background | Cinema Black | `#0D0D0F` | Player surround, page background |
| Surface | Theater Charcoal | `#1A1A1E` | Control bar background, info strip |
| Velvet Red | LIVE | `#C41E3A` | Play button, LIVE badge, progress scrubber |
| Broadcast Gold | Channel | `#D4AF37` | Family callsign, video title, broadcaster name |
| Silver White | Primary text | `#E8E8EC` | Control labels, timecode |
| Muted Silver | Metadata | `#A8A8B0` | Timestamps, duration labels (WCAG AA compliant) |
| Green Signal | Online | `#2ECC71` | Online presence dot |
| Amber | Solo | `#F39C12` | Solo Mode indicator |

> **Note:** Use `#A8A8B0` for Muted Silver on dark backgrounds — this is WCAG AA compliant (5.2:1). Do NOT use `#8E8E96` on Cinema Black — it fails AA at 2.8:1.

### 2.2 Typography

```css
/* Font imports already in globals.css */
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Element | Font | Weight | Size | Color | Notes |
|---------|------|--------|------|-------|-------|
| Family callsign | Oswald | 600 | 18px | `#D4AF37` | Top-left, glow-gold |
| Channel number | Oswald | 500 | 14px | `#8E8E96` | Below callsign |
| Video title (player) | Oswald | 600 | 22–26px | `#D4AF37` | Below video, centered |
| "Chosen by" | Source Sans 3 | 400 | 14px | `#A8A8B0` | Below title |
| Broadcaster name | Source Sans 3 | 600 | 14px | `#E8E8EC` | After "Chosen by" |
| LIVE badge | Oswald | 600 | 11px | `#C41E3A` | Uppercase |
| Timecode | JetBrains Mono | 500 | 13px | `#A8A8B0` | Bottom-right |
| Progress time | JetBrains Mono | 400 | 12px | `#A8A8B0` | Below progress bar |
| Control icons | Lucide | — | 24px | `#E8E8EC` | Centered controls |

### 2.3 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Standard padding |
| `space-4` | 16px | Card/section padding |
| `space-6` | 24px | Control group gaps |
| `space-8` | 32px | Page-level padding |

### 2.4 Elevation / Shadows

| Element | Value |
|---------|-------|
| Control bar | `0 0 80px rgba(0,0,0,0.6)` — deep player surround shadow |
| Vignette | Radial gradient overlay (see Section 4.2 of design brief) |

---

## 3. Layout

### 3.1 Screen Regions

```
┌──────────────────────────────────────────────────────────────┐
│ [FAMILY CALLSIGN]  ★ THE HENDERSON CHANNEL      [👤👤👤 +3] │ ← Top bar (56px, semi-transparent)
│  Channel 1                                          10:32 AM │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                     [VIDEO CONTENT]                          │ ← Video fills remaining height
│                     (16:9, vignette overlay)                 │
│                                                              │
│                                                              │
│                         [▶ PLAY]                             │ ← Centered play button (72px)
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Thanksgiving Outtakes 2024                                   │ ← Title strip
│  Chosen by: Grandma June  ●  LIVE                            │
│  ───────────────────────────●─────────────  4:22 / 12:34   │ ← Progress bar + timecode
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Control Overlay (tap to reveal)

On tap/click anywhere on the player:
1. Top bar slides in from top (200ms ease-out)
2. Bottom strip fades in (200ms ease-out)
3. Centered play button appears (200ms ease-out)
4. After 3 seconds of inactivity: all controls fade out (200ms ease-in)

Controls auto-hide on mobile after 3 seconds. On desktop, controls persist on hover.

### 3.3 Responsive

| Breakpoint | Player Behavior |
|------------|-----------------|
| Mobile (320–639px) | Full-width, controls bottom-anchored, 48px touch targets |
| Tablet (640–1023px) | Full-width, larger play button (80px) |
| Desktop (1024–1439px) | Full-width, side presence strip visible in top bar |
| TV/Large (1440px+) | Letterboxed Cinema Black bars on sides, max-width 1280px centered |

---

## 4. Component Specifications

### 4.1 Top Bar

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [TV Icon] THE HENDERSON CHANNEL      [👤👤👤 +3]  [📺 Guide] │
│  ★ Channel 1                             10:32 AM             │
└──────────────────────────────────────────────────────────────┘
```

- Background: `rgba(13, 13, 15, 0.85)` with `backdrop-filter: blur(8px)`
- Height: 56px
- Left: TV icon (Lucide `tv`, 16px, Velvet Red) + Family callsign (Oswald 600, 18px, Broadcast Gold with `.glow-gold`)
- Right: Presence avatars (see Section 4.5) + "Guide" button (ghost, Oswald 500, 14px)
- Below callsign: "Channel N" label (Oswald 400, 12px, Muted Silver)

**Presence Strip (top-right):**
- Shows up to 3 avatars (32px circles)
- `+N` overflow badge in Muted Silver
- Green Signal dot (8px) bottom-right of each online avatar
- Tap: tooltip with name and watch duration

### 4.2 Video Container

**Structure:**
```html
<div class="player-container">   <!-- vignette overlay applied here -->
  <video class="player-video" />
  <div class="player-vignette" />  <!-- ::after pseudo, CSS radial gradient -->
</div>
```

**CSS:**
```css
.player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0D0D0F;
  overflow: hidden;
}

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

.player-video {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Never distort — letterbox if needed */
  background: #0D0D0F;
}
```

**Aspect ratio:** Video is always 16:9. On wider viewports, Cinema Black (`#0D0D0F`) letterbox bars appear on left/right.

### 4.3 Centered Play Button

**Default (paused):** Large centered play button
**Playing:** Button disappears (tap to show controls)

**Geometry:**
| Element | Value |
|---------|-------|
| Button size | 72px circle (desktop), 64px (mobile) |
| Background | `#C41E3A` (Velvet Red) |
| Icon | Lucide `play-fill` or `pause-fill`, 32px, white |
| Glow on hover | `.glow-red` class from `brand.css` |
| Touch target | 72×72px (≥48px minimum) |

**States:**
| State | Appearance |
|-------|------------|
| Paused | Play icon, full opacity |
| Playing | No button (tap to show controls) |
| Hover (paused) | Velvet Red glow, slight scale up (1.05×) |
| Buffering | Spinner in Velvet Red, replace play icon |

### 4.4 Skip Controls (−10s / +10s)

**Position:** Left and right of play button (not visible until controls shown)
**Buttons:**
| Control | Icon | Label | Size |
|---------|------|-------|------|
| Skip back | Lucide `skip-back` | `-10s` | 24px icon, 48×48px touch target |
| Skip forward | Lucide `skip-forward` | `+10s` | 24px icon, 48×48px touch target |
| Previous | Lucide `skip-back` (double) | Not shown | Not shown |
| Next | Lucide `skip-forward` (double) | Not shown | Not shown |

**Skip button style:** Ghost/transparent background, Muted Silver icon. On hover: Silver White icon.

```css
.skip-btn {
  background: transparent;
  border: none;
  color: #A8A8B0;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.skip-btn:hover {
  color: #E8E8EC;
}
```

### 4.5 Presence Avatars (Top Bar)

See Section 7.5 of the design brief for full spec. Implementation:

```tsx
// Compact version for top bar
<AvatarGroup max={3} size="sm">
  {watchers.map((watcher) => (
    <div key={watcher.id} className="relative">
      <Avatar>
        <AvatarImage src={watcher.avatarUrl} />
        <AvatarFallback>{getInitials(watcher.name)}</AvatarFallback>
      </Avatar>
      {/* Online dot — green or amber for solo */}
      <span
        className="absolute bottom-0 right-0 w-2 h-2 rounded-full"
        style={{
          backgroundColor: watcher.isSolo ? '#F39C12' : '#2ECC71',
          border: '1px solid #0D0D0F'
        }}
      />
    </div>
  ))}
  {overflowCount > 0 && (
    <span className="text-xs" style={{ color: '#A8A8B0' }}>
      +{overflowCount}
    </span>
  )}
</AvatarGroup>
```

**Avatar specs for player:**
- Size: 32px circle
- Border: `2px solid rgba(212, 175, 55, 0.4)` — subtle Broadcast Gold ring
- Online dot: 8px, Green Signal `#2ECC71` (or Amber `#F39C12` for Solo Mode)
- Dot position: bottom-right of avatar, offset by 1px

### 4.6 LIVE Badge

Per Section 7.6 of the design brief:

```tsx
<div className="flex items-center gap-1.5 px-2 py-1 rounded" 
     style={{ 
       background: 'rgba(196, 30, 58, 0.15)',
       border: '1px solid rgba(196, 30, 58, 0.3)'
     }}>
  <span className="live-dot w-1.5 h-1.5 rounded-full" 
        style={{ backgroundColor: '#C41E3A' }} /> {/* Pulsing */}
  <span className="font-heading text-xs font-semibold uppercase tracking-wide"
        style={{ color: '#C41E3A' }}>
    LIVE
  </span>
</div>
```

**LIVE dot animation** (from `brand.css`):
```css
.live-dot {
  animation: live-pulse 2s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}
```

> The `.live-dot` class is already defined in `brand.css` — reuse it. Only the dot pulses, not the "LIVE" text.

### 4.7 Bottom Title Strip

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Thanksgiving Outtakes 2024                                   │
│  Chosen by: Grandma June  ●  LIVE                             │
│  ───────────────────────────●─────────────  4:22 / 12:34   │
└──────────────────────────────────────────────────────────────┘
```

- Background: `rgba(26, 26, 30, 0.85)` with `backdrop-filter: blur(8px)`
- Padding: `16px 24px`
- Border-top: `1px solid rgba(255, 255, 255, 0.06)`

**Elements (top to bottom):**
1. **Video title** — Oswald 500, 20px, Broadcast Gold `#D4AF37`
2. **Chosen by row** — "Chosen by: [Name]" in Source Sans 3, 14px, Muted Silver `#A8A8B0` + LIVE badge (if live)
3. **Progress bar** — See Section 4.8
4. **Timecode** — JetBrains Mono, 13px, Muted Silver `#A8A8B0`, right-aligned: `"4:22 / 12:34"`

### 4.8 Progress Bar

**Geometry:**
| Element | Value |
|---------|-------|
| Track height | 8px |
| Track color | `#3A3A3E` |
| Track border-radius | 4px |
| Scrubber diameter | 16px circle |
| Scrubber color | `#C41E3A` (Velvet Red) |
| Scrubber hover size | 20px |
| Buffer color | `rgba(255, 255, 255, 0.1)` |
| Glow on scrubber | Velvet Red glow |

**CSS:**
```css
.progress-track {
  width: 100%;
  height: 8px;
  background: #3A3A3E;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: height 150ms ease-out;
}

.progress-track:hover {
  height: 12px;
}

.progress-scrubber {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #C41E3A;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.6);
  transition: width 150ms ease-out, height 150ms ease-out;
}

.progress-track:hover .progress-scrubber {
  width: 20px;
  height: 20px;
}
```

**Click to seek:** Clicking the progress bar jumps to that position. Scrubber position = (clickX / trackWidth) × duration.

**Keyboard:** Arrow keys ±10 seconds, Home = start, End = end.

---

## 5. TV Guide Integration

Swipe up (mobile) or click "Guide" button (top-right) to open the TV Guide screen. Player continues in background (or PiP if supported).

**TV Guide Screen Spec:** Not in this document — see Section 7.2 of the design brief for the TV Guide layout spec.

---

## 6. Cross-Fade Video Transition

Per Section 13 of the design brief, when advancing to the next video in the queue, use a dual-video cross-fade:

```tsx
// Two <video> elements, cross-fade between them
const [currentVideo, setCurrentVideo] = useState(video1);
const [fadeOut, setFadeOut] = useState(false);

async function playNext(nextVideo) {
  // Start fade out of current (500ms)
  setFadeOut(true);
  await sleep(500);
  
  // Swap to next video, start fade in
  setCurrentVideo(nextVideo);
  setFadeOut(false);
}
```

```css
/* Current video fades out */
.video-current {
  transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}
.video-current.fade-out {
  opacity: 0;
}

/* Next video fades in */
.video-next {
  opacity: 0;
  transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
.video-next.visible {
  opacity: 1;
}
```

---

## 7. Solo Mode

When only one family member is watching, the presence avatar gets an **Amber dot** instead of Green Signal, and a "SOLO" badge appears beneath the presence strip:

```tsx
{watchers.length === 1 && (
  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
        style={{ 
          background: 'rgba(243, 156, 18, 0.15)',
          border: '1px solid rgba(243, 156, 18, 0.3)',
          color: '#F39C12'
        }}>
    SOLO
  </span>
)}
```

---

## 8. Component Files

| Component | File | Status |
|-----------|------|--------|
| TVPlayerScreen | `src/components/tv-player-screen.tsx` | **Not built** |
| NowPlayingBar | `src/components/now-playing-bar.tsx` | **Not built** |
| TVGuideScreen | `src/components/tv-guide-screen.tsx` | **Not built** |
| LiveBadge | `src/components/live-badge.tsx` | **Not built** |
| PresenceAvatars | `src/components/presence-avatars.tsx` | **Not built** |
| ProgressBar | (inside `tv-player-screen.tsx`) | **Not built** |

---

## 9. State Map

| State | Player UI | Controls | Play Button |
|-------|-----------|----------|-------------|
| Idle (no content) | Black screen | Hidden | Hidden |
| Paused | Video paused | Visible (fade in on tap) | Play icon centered |
| Playing | Video playing | Auto-hide after 3s | Hidden |
| Buffering | Video frozen | Visible | Velvet Red spinner |
| Seeking | Video frozen | Visible | Hidden |
| Next video loading | Cross-fade out | Hidden | Hidden |
| Error | Black screen + error message | Visible | Play icon + retry |

---

## 10. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Skip back 10s |
| `→` | Skip forward 10s |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute toggle |
| `G` | Open TV Guide |
| `Escape` | Exit player / minimize to bar |
| `F` | Fullscreen toggle |

---

## 11. Accessibility

- All controls have `aria-label` attributes
- Video player announces: `"[Title], chosen by [Member], [time elapsed] of [duration], [LIVE or CATCH-UP]"`
- LIVE dot animation: `prefers-reduced-motion` → replace pulse with static filled dot
- Progress bar: keyboard operable, announces time position on change
- Minimum touch targets: 48×48px on all interactive elements
- Focus ring: Forest green (`#2D5A4A`), 2px, offset 2px

---

*End of TV Player Spec*
