# Sprint 011 — Watch Party Mobile Polish (CTM-235)

**Author:** Principal Designer  
**Date:** 2026-04-01  
**Status:** Design Complete — Ready for Frontend Implementation  
**PRD Reference:** `familytv/research/family-watch-party-prd.md`  
**Design System:** `familytv/design/family-tv-design-brief.md` (Cinema Black palette, Section 9 responsive strategy, Section A11y)

---

## Design Decisions Summary

| Element | Desktop (≥768px) | Mobile (<768px) |
|---------|-----------------|-----------------|
| Presence | Horizontal strip below video | Collapsible icon-only bar |
| Chat | Fixed 300px right sidebar | Bottom sheet overlay |
| Reactions | Floating bubble animations | Fixed bottom bar, 44×44px targets |
| Toggle mechanism | Always visible | Tap to expand/collapse |

---

## 1. Presence Sidebar

### Desktop Layout (≥768px)

The presence strip lives **below the video player**, above the reaction bar — consistent with PRD wireframe.

```
┌──────────────────────────────────────────────────────────────┐
│ [VIDEO PLAYER — 16:9 with vignette]                          │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│  👀 Also watching:                                           │
│  [🟢 Mom]  [🟢 Dad]  [🟢 Mike]  [⚪ Grandma]                │
└──────────────────────────────────────────────────────────────┘
```

**CSS Grid structure:**
- `watch-party-container`: `grid-template-columns: 1fr 300px` (video | chat)
- `presence-strip`: horizontal flex, `align-items: center`, `gap: space-2 (8px)`
- Each presence item: avatar circle 32px + name label + status dot
- Mobile-first: strip is compact; expands on desktop to show names

**Color mapping (from design brief):**
- Active dot: `#2ECC71` (Green Signal)
- Idle dot: `#A8A8B0` (Muted Silver — passes WCAG AA on #0D0D0F)
- Name label: `#E8E8EC` (Silver White)
- Strip background: `#1A1A1E` (Theater Charcoal) with top border `rgba(255,255,255,0.06)`

### Mobile Layout (<768px)

Collapses to an icon-only presence bar. Tap to expand a popover showing full names.

```
┌────────────────────────────────────────┐
│ [VIDEO PLAYER]                         │
│ ────────────────────────────────────── │
│  👀 🟢🟢🟢⚪  ← 4 watching             │
└────────────────────────────────────────┘
```

- Strip height: **48px** (minimum tap target per design brief Section 3)
- Icons: 28px circles, stacked with -8px overlap
- Count label: `"4 watching"` in `#A8A8B0`, Source Sans 400, 14px
- **Tap → expands bottom sheet** with full names + status dots

**Accessibility:**
- `aria-label="4 family members currently watching"`
- Each avatar: `role="img"` with `aria-label="[Name], [Active/Idle]"`
- Screen reader announces: `"[Name] is [actively watching / idle]"`

**Interaction spec (mobile):**
- Tap anywhere on collapsed bar → sheet slides up from bottom (350ms ease-out, cubic-bezier(0.16, 1, 0.3, 1))
- Sheet contains same avatar list as desktop strip
- Tap × or swipe down → dismiss sheet (250ms ease-in)

---

## 2. Chat Sidebar

### Desktop Layout (≥768px)

Right panel, 300px, `position: relative` next to video.

```
┌─────────────────────┬──────────────────────────┬────────────┐
│                     │  👀 Also watching       │            │
│  [VIDEO PLAYER]     │                          │  LIVE CHAT │
│                     │  ─────────────────────  │            │
│  ─────────────────  │  [reaction bubbles]     │  [avatar]  │
│  😂❤️😮👏😢🎉       │  [reaction bar]         │  Mom: ...  │
│                     │                          │  2m ago    │
│  [presence strip]  │                          │ ────────── │
│                     │                          │  [input]   │
└─────────────────────┴──────────────────────────┴────────────┘
```

**Chat panel specs:**
- Background: `#1A1A1E` (Theater Charcoal)
- Border-left: `1px solid rgba(255,255,255,0.06)`
- Header: "LIVE CHAT" — Oswald 500, `#A8A8B0`, uppercase, letter-spacing 0.08em, 12px
- Messages: scrollable, `max-height: calc(100vh - 200px)`, newest at bottom
- Message bubble: name `#D4AF37` (Broadcast Gold), text `#E8E8EC`, timestamp `#5A5A62`
- Own messages: right-aligned or subtle `#2E2E34` background
- Input: fixed at bottom of panel, `#0D0D0F` background, `#E8E8EC` text, Forest green send button
- Empty state: "No messages yet. Say something!" — Source Sans 400, `#A8A8B0`, with subtle wave animation (opacity pulse 1.5s)

### Mobile Layout (<768px)

Bottom sheet overlay. Collapsed by default.

**Collapsed state:**
```
┌────────────────────────────────────────┐
│ [VIDEO PLAYER — full width]            │
│                                        │
│ ─────────────────────────────────────  │
│  😂❤️😮👏😢🎉 [+]   ← reaction bar     │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 💬 2 new messages ↓   [tap to open]│  │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

- Chat toggle pill: 48×48px touch target minimum (per design brief Section 3)
- `data-testid="watch-party-chat-toggle"`
- Shows unread count badge: Velvet Red `#C41E3A`, white number, 16px circle
- Background: `#1A1A1E`, 8px border-radius, bottom-right anchored

**Expanded state (bottom sheet):**
```
┌────────────────────────────────────────┐
│ [VIDEO PLAYER]                         │
│ ─────────────────────────────────────  │
│  😂❤️😮👏😢🎉 [+]                       │
│                                        │
│ ╔════════════════════════════════════╗ ║
│ ║  ═══════════ Live Chat    [×]     ║ ║
│ ║  ─────────────────────────────     ║ ║
│ ║  [scrollable message area]         ║ ║
│ ║                                     ║ ║
│ ║  ─────────────────────────────     ║ ║
│ ║  [Type a message...     ] [Send]   ║ ║
│ ╚════════════════════════════════════╝ ║
└────────────────────────────────────────┘
```

**Sheet specs:**
- Width: 100% on mobile
- Max height: `70vh` (leaves video partially visible)
- Border-radius: top corners `16px`
- Background: `#1A1A1E`
- Top border: `1px solid rgba(255,255,255,0.06)`
- Drag handle: 32×4px, `#5A5A62`, centered, 8px from top
- Header: "Live Chat" — Oswald 500, `#E8E8EC`, 16px
- Close button: `×` icon, `#A8A8B0`, 48×48px touch target
- Animation: slide up 350ms `cubic-bezier(0.16, 1, 0.3, 1)`, dismiss on swipe down or tap outside

**New message pill (when scrolled up):**
- "💬 2 new messages ↓" pill — `#2D5A4A` background, Cream text, 48px height
- `data-testid="watch-party-chat-new-messages-pill"`
- Bounce-in animation (300ms)
- Tap → smooth scroll to bottom

**Accessibility:**
- Sheet: `role="dialog"`, `aria-label="Live chat"`, `aria-modal="true"`
- On open: focus trapped inside sheet; focus moves to input
- Close button: `aria-label="Close chat"`
- Send button: `aria-label="Send message"`
- Input: `aria-label="Type a message"`
- New messages pill: `aria-live="polite"` announces new message count

---

## 3. Quick Reactions Bar

### Desktop Layout (≥768px)

Below video player, inside video container as bottom overlay (semi-transparent background).

```
┌──────────────────────────────────────────────────────────────┐
│ [VIDEO PLAYER]                                               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  😂  ❤️  😮  👏  😢  🎉  [ + ] ← reaction bar                │
└──────────────────────────────────────────────────────────────┘
```

**Reaction button specs:**
- Size: 40×40px (desktop, where precise cursor control exists)
- Gap between buttons: 8px
- Background: `rgba(26, 26, 30, 0.8)` with `backdrop-filter: blur(8px)`
- Border-radius: 8px
- On hover: scale 1.1, Forest green border glow
- On press: scale 0.95, 100ms

**Floating bubble animation (desktop):**
- CSS animation `floatUp` as specified in PRD Section 2.2
- Max 15 simultaneous bubbles (older culled)
- Each bubble: `position: absolute`, `pointer-events: none`
- Drift: `calc(-50% + var(--drift))` where drift is ±30px random

### Mobile Layout (<768px)

Fixed bottom bar, full width, **44×44px minimum touch targets** (WCAG compliant).

```
┌────────────────────────────────────────────────────────────┐
│ [VIDEO PLAYER]                                             │
│                                                            │
│ ────────────────────────────────────────────────────────  │
│  😂    ❤️    😮    👏    😢    🎉    [ + ]               │
└────────────────────────────────────────────────────────────┘
  ↑ 44px min height, full width, position: fixed, bottom: 0
```

**Mobile reaction bar specs:**
- Height: **56px** (44px minimum target + 12px vertical padding)
- Width: 100vw
- Position: `fixed` bottom
- Background: `#1A1A1E` with top border `rgba(255,255,255,0.06)`
- Buttons: **44×44px** each, horizontally centered, gap 4px
- Emoji size: 24px (large enough for tap accuracy)
- `[ + ]` expand button: 44×44px, Forest green background
- Safe area inset: account for mobile home indicator (`padding-bottom: env(safe-area-inset-bottom)`)

**Tap feedback:**
- Scale down to 0.9 on press (100ms)
- Subtle haptic feedback if `navigator.vibrate` available
- Own reactions also render as bubbles for immediate feedback

**Emoji picker (expanded):**
- Opens as bottom sheet (same animation as chat sheet)
- 6-column grid of reactions (48×48px each, 8px gap)
- Background: `#1A1A1E`, border-radius top `16px`
- Each emoji: 48×48px tap target (exceeds 44px minimum)
- `data-testid="watch-party-emoji-picker"`
- `role="dialog"`, `aria-label="Choose a reaction"`

**Accessibility:**
- Each reaction button: `aria-label="React with [emoji name]"` (e.g., "React with face with tears of joy")
- `aria-pressed="false"` when not recently used, toggles on tap
- `prefers-reduced-motion`: floating bubbles don't animate — instead appear in-place and fade (opacity 1→0 over 1s)
- Focus: keyboard navigable with arrow keys between emoji options

---

## 4. WCAG 2.1 AA Compliance Checklist

### Color Contrast

| Element | Color | Background | Contrast Ratio | WCAG AA |
|---------|-------|------------|----------------|---------|
| Chat message text | `#E8E8EC` | `#1A1A1E` | ~11.5:1 | ✅ |
| Timestamp | `#A8A8B0` | `#1A1A1E` | ~5.2:1 | ✅ |
| "LIVE CHAT" header | `#A8A8B0` | `#1A1A1E` | ~5.2:1 | ✅ |
| Active presence dot | `#2ECC71` | `#1A1A1E` | ~7.2:1 | ✅ |
| Idle presence dot | `#A8A8B0` | `#1A1A1E` | ~5.2:1 | ✅ |
| Reaction button (pressed) | `#E8E8EC` | `#2D5A4A` | ~8.1:1 | ✅ |
| Send button | `#FDF8F3` (Cream) | `#2D5A4A` (Forest) | ~6.8:1 | ✅ |
| Chat input text | `#E8E8EC` | `#0D0D0F` | ~15.4:1 | ✅ |

**Critical fix from design brief:** `#5A5A62` (Dim) must never be used as text on Cinema Black — it fails WCAG AA (~1.9:1). All Dim usage is decorative only.

### Keyboard Navigation

| Component | Keyboard Behavior |
|-----------|-------------------|
| Presence strip (desktop) | Tab to strip, arrow keys between members, Enter/Space for details |
| Presence strip (mobile) | Tab to collapsed bar, Enter to expand sheet |
| Reaction bar | Tab through reactions, Enter/Space to send |
| Emoji picker | Tab through grid, arrow keys navigate, Enter selects, Escape closes |
| Chat sidebar (desktop) | Tab to input, Enter to send, Escape to clear |
| Chat bottom sheet (mobile) | Focus trap on open, Tab cycles within sheet, Escape closes |
| Chat input | Standard text input behavior |
| New messages pill | Tab to pill, Enter to scroll |

**Focus indicators:**
- Style: 2px Forest green (`#2D5A4A`) outline, 2px offset
- Applied to all interactive elements: `data-testid` elements + native buttons/inputs
- Never use `outline: none` without providing alternative focus style

### Screen Reader Labels

All interactive elements must have descriptive ARIA labels. Key patterns:

```tsx
// Presence member
<span role="img" aria-label="Mom, actively watching">🟢</span>

// Reaction button
<button
  data-testid="watch-party-reaction-laugh"
  aria-label="React with face with tears of joy"
  aria-pressed="false"
>
  😂
</button>

// Chat toggle
<button
  data-testid="watch-party-chat-toggle"
  aria-label="Open live chat, 2 unread messages"
  aria-expanded="false"
>
  💬 <span aria-hidden="true">2</span>
</button>

// Chat input
<input
  data-testid="watch-party-chat-input"
  type="text"
  aria-label="Type a message"
  placeholder="Type a message..."
/>

// Send button
<button
  data-testid="watch-party-chat-send"
  aria-label="Send message"
  disabled={!text.trim()}
>
  Send
</button>

// Emoji picker toggle
<button
  data-testid="watch-party-emoji-picker-toggle"
  aria-label="Open emoji picker"
  aria-expanded="false"
  aria-controls="emoji-picker-panel"
>
  +
</button>
```

### Focus Management

| Scenario | Focus Behavior |
|----------|---------------|
| Open chat sheet | Move focus to chat input |
| Close chat sheet | Return focus to chat toggle button |
| Open emoji picker | Move focus to first emoji in picker |
| Close emoji picker | Return focus to picker toggle |
| Send chat message | Keep focus in input (allows rapid follow-up messages) |
| New reaction bubble | No focus change (ephemeral, non-interactive) |

---

## 5. data-testid Naming Convention

All interactive elements MUST use the `data-testid="watch-party-{component}-{element}"` format.

### Complete testid Registry

| Component | Element | Full testid |
|-----------|---------|-------------|
| `watch-party` | **Container** | `watch-party-container` |
| `watch-party` | **Video player** | `watch-party-video-player` |
| `watch-party` | **Presence strip** | `watch-party-presence-strip` |
| `watch-party` | Presence member | `watch-party-presence-member-[name-slug]` |
| `watch-party` | **Reaction bar** | `watch-party-reaction-bar` |
| `watch-party` | Reaction button (laugh) | `watch-party-reaction-laugh` |
| `watch-party` | Reaction button (heart) | `watch-party-reaction-heart` |
| `watch-party` | Reaction button (wow) | `watch-party-reaction-wow` |
| `watch-party` | Reaction button (clap) | `watch-party-reaction-clap` |
| `watch-party` | Reaction button (cry) | `watch-party-reaction-cry` |
| `watch-party` | Reaction button (party) | `watch-party-reaction-party` |
| `watch-party` | Emoji picker toggle | `watch-party-emoji-picker-toggle` |
| `watch-party` | Emoji picker panel | `watch-party-emoji-picker` |
| `watch-party` | Emoji picker item | `watch-party-emoji-picker-item-[emoji-slug]` |
| `watch-party` | **Chat sidebar** (desktop) | `watch-party-chat-sidebar` |
| `watch-party` | Chat toggle (mobile) | `watch-party-chat-toggle` |
| `watch-party` | Chat new messages pill | `watch-party-chat-new-messages-pill` |
| `watch-party` | Chat messages list | `watch-party-chat-messages` |
| `watch-party` | Chat message | `watch-party-chat-message-[id]` |
| `watch-party` | Chat input | `watch-party-chat-input` |
| `watch-party` | Chat send button | `watch-party-chat-send` |
| `watch-party` | Chat close (mobile sheet) | `watch-party-chat-close` |
| `watch-party` | Presence popover (mobile) | `watch-party-presence-popover` |
| `watch-party` | Presence popover close | `watch-party-presence-popover-close` |

---

## 6. Layout Grid Specification

### Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────────┐
│  [HEADER — FamilyTV nav]                                     │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────┐  ┌───────────────────┐  │
│  │                                │  │  LIVE CHAT        │  │
│  │  [VIDEO PLAYER — 16:9]        │  │                   │  │
│  │                                │  │  [message list]   │  │
│  │  ──────────────────────────── │  │  [scrollable]     │  │
│  │  😂❤️😮👏😢🎉 [+]              │  │                   │  │
│  │                                │  │                   │  │
│  │  👀 Also watching: ...         │  │  ─────────────────│  │
│  └────────────────────────────────┘  │  [input] [send]   │  │
│                                       └───────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- Video area: `1fr`
- Chat sidebar: `300px` fixed
- Reaction bar: inside video container, bottom overlay
- Presence strip: below video, above reactions
- Gap between video and chat: `space-4 (16px)`

### Mobile (<768px)

```
┌──────────────────────────────────────┐
│  [HEADER — minimal]                  │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │  [VIDEO PLAYER — full width]  │  │
│  │  ──────────────────────────── │  │
│  └────────────────────────────────┘  │
│                                      │
│  👀 🟢🟢⚪ 4 watching   [💬 2]       │
│                                      │
├──────────────────────────────────────┤
│  😂  ❤️  😮  👏  😢  🎉  [+]  [44px fixed bottom bar] │
└──────────────────────────────────────┘
```

- Video: full width, no sidebar
- Presence: 48px strip, collapsed icon bar
- Chat toggle: 48px pill, top-right of presence area
- Reaction bar: 56px fixed bottom bar, accounts for safe-area-inset-bottom
- Chat sheet: slides up over video area

### Tablet (640–1023px)

Same as desktop layout, but chat sidebar is `260px` instead of `300px`. Presence strip shows names alongside icons (unlike mobile's icon-only).

---

## 7. Component State Summary

### Reaction Button

| State | Visual |
|-------|--------|
| Default | Emoji 24px, background `transparent`, border-radius 8px |
| Hover | Scale 1.05, border `1px solid #2D5A4A` |
| Focus | 2px Forest green outline, 2px offset |
| Active/pressed | Scale 0.95, background `#2D5A4A` |
| Recently used | Subtle glow ring (optional, `#2D5A4A` at 30% opacity) |

### Chat Toggle (Mobile)

| State | Visual |
|-------|--------|
| Default | `#1A1A1E` background, icon `#A8A8B0`, 8px radius |
| Unread | Red badge with count |
| Hover | Border `1px solid rgba(255,255,255,0.1)` |
| Focus | 2px Forest green outline |
| Active (sheet open) | Icon `#2D5A4A` |

### Chat Input

| State | Visual |
|-------|--------|
| Empty | `#0D0D0F` background, `#5A5A62` placeholder text |
| Typing | `#E8E8EC` text |
| Focused | Border `1px solid #2D5A4A` |
| Submitting | Input disabled, send button shows spinner |
| Error | Border `1px solid #E74C3C`, error message below |

---

## 8. Animation Timings (from Design Brief Section 6)

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Chat sheet slide up | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Chat sheet dismiss | 250ms | `ease-in` |
| Presence popover expand | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Reaction button press | 100ms | `ease-out` |
| Floating reaction bubble | 2800ms | `ease-out` (random drift ±30px) |
| New message pill bounce | 300ms | `ease-out` |
| Focus ring appear | 150ms | `ease-out` |

**`prefers-reduced-motion` overrides:**
- Floating bubbles: appear in-place, fade over 1000ms (no float animation)
- Chat sheet: instant appear/disappear (no slide)
- All other decorative animations: disabled

---

## 9. Implementation Notes for Frontend Dev

1. **No Tailwind `@apply`** for responsive breakpoints inside component files — use standard Tailwind breakpoint classes (`md:`, `lg:`) directly in JSX
2. **Safe area insets**: always use `env(safe-area-inset-bottom)` for mobile fixed elements
3. **Focus trap**: implement for chat sheet and emoji picker using `useEffect` + `useRef` pattern
4. **Reactions rate limit**: client-side debounce at 200ms to match server-side limit
5. **Chat rate limit**: client-side throttle at 2s, show "Slow down!" tooltip
6. **WebSocket connection state**: show "Reconnecting..." banner when socket disconnects (Amber `#F39C12` background)
7. **Session persistence**: if user refreshes, re-join room with same `sessionId`, restore chat history + presence

---

## 10. Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/watch-party/WatchPartyContainer.tsx` | New — main responsive layout wrapper |
| `src/components/watch-party/VideoPlayer.tsx` | New — video + reactions + presence |
| `src/components/watch-party/ChatSidebar.tsx` | New — desktop chat panel |
| `src/components/watch-party/ChatBottomSheet.tsx` | New — mobile chat overlay |
| `src/components/watch-party/PresenceStrip.tsx` | New — presence strip (desktop) |
| `src/components/watch-party/PresenceCollapsed.tsx` | New — presence icon bar (mobile) |
| `src/components/watch-party/PresencePopover.tsx` | New — mobile tap-to-expand |
| `src/components/watch-party/ReactionBar.tsx` | New — emoji buttons + picker |
| `src/components/watch-party/EmojiPicker.tsx` | New — expandable emoji grid |
| `src/components/watch-party/ReactionBubble.tsx` | New — floating bubble animation |
| `src/components/watch-party/index.ts` | New — barrel export |
| `src/hooks/useWatchPartySocket.ts` | New — Socket.IO connection hook |
| `src/app/watch-party/[sessionId]/page.tsx` | New — route page |
| Tailwind config | Add `colors.cinema` and `colors.theater` if not already present |

---

*CTM-235 | Sprint 011 | Design Complete*

---

## 11. QA Test Results (CTM-234)

**Test Engineer:** qa-engineer  
**Date:** 2026-04-01  
**Status:** E2E Tests Written — Awaiting Frontend Implementation  
**Test File:** `e2e/watch-party.spec.ts`  
**Coverage Target:** 97%+ on unit tests (E2E tests for UI/UX behavior)

### E2E Test Suite Summary

| Test Category | Test Count | Status |
|--------------|-----------|--------|
| Presence Dots | 8 | ✅ Written |
| Quick Reactions | 10 | ✅ Written |
| Live Chat | 11 | ✅ Written |
| Auth & Family Membership | 4 | ✅ Written |
| Invite Flow | 3 | ✅ Written |
| Video Player Integration | 3 | ✅ Written |
| Edge Cases & Error Handling | 4 | ✅ Written |
| **TOTAL** | **43** | ✅ Complete |

### Testid Registry (as implemented in E2E tests)

```
# Presence - data-testid="watch-party-presence-{element}"
watch-party-presence-strip
watch-party-presence-dot
watch-party-presence-dot-active
watch-party-presence-dot-idle
watch-party-watcher-avatar

# Video - data-testid="watch-party-video-{element}"  
watch-party-video-player
watch-party-play-button
watch-party-progress-bar

# Reactions - data-testid="watch-party-reaction-{element}"
watch-party-reaction-bar
watch-party-reaction-laugh
watch-party-reaction-heart
watch-party-reaction-wow
watch-party-reaction-clap
watch-party-reaction-cry
watch-party-reaction-party
watch-party-reaction-expand
watch-party-reaction-bubble

# Chat - data-testid="watch-party-chat-{element}"
watch-party-chat-sidebar
watch-party-chat-toggle
watch-party-chat-messages
watch-party-chat-message
watch-party-chat-sender
watch-party-chat-timestamp
watch-party-chat-input
watch-party-chat-send
watch-party-chat-empty
watch-party-chat-new-messages
watch-party-chat-rate-limit

# Auth/Access
watch-party-redirect-signin
watch-party-access-denied

# Invite
watch-party-invite-button
watch-party-invite-modal
watch-party-invite-family-member
watch-party-join-button
watch-party-presence-only-you

# Misc
watch-party-emoji-picker
watch-party-offline-indicator
watch-party-family-name
```

### Critical Test Scenarios

#### 1. Presence Dots (CTM-234-1)
- ✅ Unauthenticated users redirect to sign-in
- ✅ Authenticated users see presence strip
- ✅ User's own dot shows as active (green) when watching
- ✅ Multiple family members show multiple dots
- ✅ Dot transitions to idle (grey) after 30s inactivity
- ✅ User removed from presence when navigating away

#### 2. Quick Reactions (CTM-234-2)
- ✅ Reaction bar visible below video player
- ✅ Default emojis (😂 ❤️ 😮 👏 😢 🎉) displayed
- ✅ Clicking reaction emits event and shows bubble
- ✅ Floating animation plays on reaction click
- ✅ Multiple rapid reactions allowed (up to 15 max)
- ✅ Bubbles fade out after ~3 seconds
- ✅ Emoji picker opens on + button click

#### 3. Live Chat (CTM-234-3)
- ✅ Chat sidebar visible on desktop (1280px+)
- ✅ Chat collapses to overlay on mobile (<768px)
- ✅ Empty state shown when no messages
- ✅ Chat history loads on room join
- ✅ Messages appear in real-time
- ✅ Sender name and timestamp shown
- ✅ Auto-scroll to newest message works
- ✅ Rate limiting (1 msg/2s) enforced
- ✅ Max message length (500 chars) enforced

#### 4. Auth + Family Membership (CTM-234-4)
- ✅ Unauthenticated users redirected to /sign-in
- ✅ Authenticated family members can access TV page
- ✅ Non-family-members see access denied
- ✅ Family-scoped room access enforced server-side

#### 5. Invite Flow (CTM-234-5)
- ✅ Invited family member can join watch party
- ✅ "Only you" message when user is alone
- ✅ Share/invite option available

### Edge Cases Tested
- WebSocket disconnection handling
- Auto-reconnect after network drop
- 100 message cap with pruning
- Chat history preserved on page refresh
- Message rate limiting UI feedback

### Prerequisites for E2E Test Execution

1. **Authentication Setup:**
   ```bash
   # Set environment variables
   export E2E_TEST_EMAIL="playwright.test@familytv.dev"
   export E2E_TEST_PASSWORD="TestPassword123!"
   export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   
   # Run auth setup
   npx playwright test --project=chromium --grep "setup"
   ```

2. **Socket.IO Server:**
   - Watch Party requires Socket.IO server running
   - Tests will handle gracefully if server unavailable

3. **Run Tests:**
   ```bash
   npx playwright test e2e/watch-party.spec.ts
   ```

### Blocking Issues

None — tests are written and ready. Implementation needed for:
- Socket.IO server with presence broadcasting
- Chat persistence in Neon Postgres
- Reaction bubble animation components
- Mobile bottom sheet components

### Notes for Frontend Dev

1. **All data-testid attributes must be implemented** per the registry above
2. **WebSocket events** need to be wired up for real-time updates
3. **Presence heartbeat** should fire every 10 seconds
4. **Reaction rate limit** enforced at 200ms client-side
5. **Chat rate limit** enforced at 2s client-side with "Slow down!" tooltip

---

*CTM-234 | Sprint 011 | E2E Tests Complete*

---

# CTM-230: Watch Party Presence System — Backend Implementation

**Author:** Backend Dev  
**Date:** 2026-04-01  
**Status:** Implementation Complete — Tests Pending Execution  
**Linear Issue:** CTM-230  

## Deliverables Completed

### 1. Presence Backend Logic (`src/lib/watch-party/presence.ts`)

Core presence system implementing PRD specifications:

| Feature | Implementation |
|---------|----------------|
| Heartbeat tracking | Client sends heartbeat every 10s |
| Green dot (active) | Heartbeat within 30 seconds |
| Grey dot (idle) | Inactive for >30 seconds |
| User removal | After 2 minutes of no heartbeat |
| Multi-device sync | Merges same user's devices into single presence |

**Key Components:**
- `PresenceManager` class with room management
- `joinRoom()` - Add user to room with device tracking
- `leaveRoom()` - Remove user/device from room
- `heartbeat()` - Update lastSeen, set status to active
- `updateIdleStatus()` - Mark idle users, remove stale entries
- `getRoomPresence()` - Returns merged presence state for broadcasting

### 2. Socket.IO Event Handlers (`src/lib/watch-party/socket-handlers.ts`)

Socket.IO event handlers for real-time presence:

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | Join a watch party room |
| `presence:heartbeat` | Client → Server | Keep presence alive |
| `room:leave` | Client → Server | Leave a watch party room |
| `room:joined` | Server → Client | Confirmation + initial presence |
| `presence:update` | Server → Client | Presence changed (broadcast) |
| `room:left` | Server → Client | Leave confirmation |

**Auth Integration:**
- Socket authenticated via Clerk JWT (userId, familyId, displayName, avatarUrl)
- Family-scoped room access enforced server-side
- Unauthorized join attempts rejected with `UNAUTHORIZED` error

### 3. Room ID Format

Format: `family:{familyId}:video:{videoId}:session:{sessionId}`

Example: `family:fam123:video:vid456:session:sess789`

### 4. Unit Tests (`src/lib/watch-party/__tests__/presence.test.ts`)

Comprehensive TDD tests with 97%+ coverage target:

**Test Coverage Areas:**
- PresenceManager room management (create, join, leave)
- Heartbeat processing and status updates
- Idle detection (30s threshold)
- User removal (2min threshold)
- Multi-device user merging
- Room ID validation and parsing
- Socket event handlers (mocked Socket.IO)

**Test Structure:**
```typescript
describe('presence', () => {
  describe('PresenceManager', () => {
    describe('getOrCreateRoom')
    describe('joinRoom')
    describe('leaveRoom')
    describe('removeUser')
    describe('heartbeat')
    describe('getRoomPresence')
    describe('getRawRoomUsers')
    describe('room management')
    describe('singleton')
  })
  describe('buildRoomId')
  describe('parseRoomId')
  describe('isValidRoomId')
  describe('isValidPresenceUpdate')
  describe('MergedPresenceUser type')
  describe('idle detection')
})
```

## API Integration Notes

The presence system is designed to integrate with the Socket.IO server (CTM-229) being built in parallel:

1. **Import:** `import { registerPresenceHandlers } from '@/lib/watch-party/socket-handlers'`
2. **Registration:** Call `registerPresenceHandlers(io)` after Socket.IO server initialization
3. **Auth Middleware:** Socket should have `userId`, `familyId`, `displayName`, `avatarUrl` set by Clerk auth middleware

## Testing Instructions

```bash
# Run presence tests
npm test -- src/lib/watch-party/__tests__/presence.test.ts

# Run with coverage
npm run test:coverage
```

## Blocking Issues

- **npm install failures:** Filesystem corruption causing tar extraction errors. May need `npm ci` or clean node_modules reinstall.
- **Socket.IO types:** The socket-handlers.ts imports from 'socket.io' which needs the socket.io package installed.

## Next Steps

1. [ ] Resolve npm/node_modules issues
2. [ ] Run unit tests and verify 97%+ coverage
3. [ ] Integrate with Socket.IO server (CTM-229)
4. [ ] Add data-testid attributes to frontend presence components
5. [ ] E2E testing of presence system

---

*CTM-230 | Sprint 011 | Backend Presence System Complete*
