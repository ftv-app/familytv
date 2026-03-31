# Family Watch Party — Product Requirements Document

**Version:** 1.0  
**Author:** Strategist  
**Date:** 2026-03-31  
**Status:** Draft for Founder Review

---

## 1. Concept & Vision

### What It Feels Like

Family Watch Party transforms passive video watching into a shared living room experience — even when family members are across the world. When Grandma starts watching the kids' soccer highlights, she sees "Also watching: Mike, Lisa" and knows she's not alone. When someone reacts with 😂 to a funny moment, the whole family feels the laugh ripple through simultaneously. It's the warmth of being together, translated for the distance.

This isn't a chat app bolted onto a video player. It's the feeling of the family couch, recreated digitally.

### Emotional Tone

- **Warm, never intrusive.** The experience enhances watching without demanding attention. You can ignore the chat and just enjoy the video, or lean into the conversation.
- **Private by default.** No one outside the family ever sees or hears anything. This is a living room, not a stage.
- **Lightweight joy.** Reactions and chat are ephemeral by design — there's no thread to maintain, no inbox to check, no history to scroll. What happens in the watch party stays in the watch party (until the next session).
- **Synchronized presence.** The magic moment is knowing others are watching the same frame at the same time. Reactions land together. Chat lands together. You are a audience.

### Why This Matters Now

FamilyTV already solves the technical problem of synchronized playback. But synchronized video is emotionally inert — watching the same frame at the same time is a technical achievement, not a felt experience. Family Watch Party adds the human layer: the gasp when the hero almost dies, the collective eye-roll at a bad joke, the "wait, did you see that?" that turns a solo viewing into a shared memory.

---

## 2. Feature Specifications

### 2.1 Presence ("Also Watching")

#### What It Is

A persistent strip showing which family members are currently watching the same video in real-time. It appears at the top of the video player, visible to all current watchers.

#### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Family Movie Night — The Incredibles                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 👀 Also watching:                                     │ │
│  │  [🟢 Mom] [🟢 Dad] [🟢 Mike] [⚪ Grandma]              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│                    [ VIDEO PLAYER ]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Green dot (🟢):** Actively watching (heartbeat within last 30 seconds)
- **Grey dot (⚪):** Joined the room but inactive for >30 seconds (still counted as "present" but not actively watching — maybe stepped away)
- **Name:** Uses family member's display name from their profile
- **Avatar (optional):** Small circular avatar next to name if available

#### Behavior

| Event | Action |
|---|---|
| User opens video | Join the room → broadcast `user_joined` → appear in everyone's strip with green dot |
| User closes video / navigates away | Leave the room → broadcast `user_left` → disappear from everyone's strip |
| User is idle for >30 seconds | Dot turns grey, name remains |
| User returns from idle | Dot turns green, heartbeat resets |
| User's socket disconnects unexpectedly | Server marks user as grey; after 2 minutes of no reconnect, remove from strip entirely |
| All users leave | Room becomes inactive; chat history preserved for 30 minutes for returning users |

#### Technical Signal

Presence is heartbeat-based. Every 10 seconds, the client sends a `heartbeat` event to the server. The server maintains a TTL map per room. If a heartbeat is missed for 30+ seconds, the user is marked idle. If missed for 2+ minutes, the user is removed from the presence list.

#### Edge Cases

- **Someone joins mid-video:** They see the existing presence strip populated immediately on load.
- **Everyone leaves:** The presence strip shows "Only you" for the last remaining viewer (encouraging, not lonely).
- **Family member with no display name:** Falls back to email username or "Family Member."

---

### 2.2 Quick Reactions

#### What It Is

A compact emoji picker that lets family members react to a specific moment in real-time. Reactions appear as floating bubbles that animate up from the reaction bar and dissolve — they're visible for ~3 seconds and then gone. **Reactions are never stored** — they're purely a real-time, ephemeral experience.

#### Emoji Bar (Reaction Bar)

Positioned below the video player, or integrated into the player controls (collapsible).

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [ VIDEO PLAYER ]                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 😂   ❤️   😮   👏   😢   🎉   [ + ]                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Default reactions (Phase 1):** 😂 ❤️ 😮 👏 😢 🎉  
**Expanded picker (+):** Opens a grid of ~24 relevant reactions (thumbs up, fire, cry-laughing, heart-eyes, facepalm, shocked, clap, sob, star-eyes, mind-blown, popcorn, etc.)

#### Floating Bubble Animation

When a reaction is sent:

1. The emoji appears as a bubble at the reaction bar
2. It floats upward (translateY from bottom to ~200px above bar), fading in as it rises
3. It drifts slightly left or right (randomized horizontal drift, ±30px) to avoid stacking
4. Duration: 2.5–3 seconds
5. Easing: ease-out (fast start, slow float to stop)
6. Opacity: 1 → 0 (fades out in the final 500ms)
7. Max simultaneous bubbles on screen: 15 (older ones get culled)

**Animation spec (CSS/JS):**
```css
/* Each bubble: */
position: absolute;
bottom: 60px;  /* start above reaction bar */
animation: floatUp 2.8s ease-out forwards;
transform: translateX(calc(-50% + var(--drift)));
pointer-events: none;  /* non-interactive */

@keyframes floatUp {
  0%   { opacity: 0; transform: translateY(0) translateX(var(--drift)); }
  10%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-200px) translateX(var(--drift)); }
}
```

#### Behavior Details

| Action | Behavior |
|---|---|
| Tap/click emoji | Reaction emits immediately; own reaction also shows as bubble for self |
| Tap same emoji repeatedly | Each tap fires a new bubble (spam is allowed — it's family) |
| User watches but doesn't react | No action needed |
| Network disconnect | Pending reactions are dropped (best-effort, not queued) |
| Emoji picker open, tap outside | Picker closes |

#### Technical Notes

- Reactions emit via WebSocket (`reaction:send` event with `{ emoji: "😂", timestamp: <videoTimestamp> }`)
- Server broadcasts to all room members via Socket.IO
- **No persistence.** Server does not write reactions to Postgres. They exist only in the WebSocket frame.
- Rate limit: max 1 reaction per 200ms per user (prevents emoji spam without blocking enthusiastic reactors)

---

### 2.3 Live Chat

#### What It Is

A persistent chat sidebar where family members can type and read messages during a watch session. Chat history (last 100 messages) is persisted per family per session and available on page reload. Messages are scoped to a viewing session — when everyone leaves and the session expires, the chat is accessible but inactive.

#### UI Layout: Sidebar (Desktop / Large Screens)

```
┌──────────────────┬──────────────────────────────────────────┐
│                  │  👀 Also watching: Mom, Dad, Mike       │
│   LIVE CHAT      │                                          │
│                  │  ┌────────────────────────────────────┐ │
│  ┌────────────┐  │  │                                    │ │
│  │ 🟢 Mom     │  │  │        [ VIDEO PLAYER ]           │ │
│  │ What a    │  │  │                                    │ │
│  │ save!      │  │  │                                    │ │
│  │ 2m ago    │  │  └────────────────────────────────────┘ │
│  ├────────────┤  │                                          │
│  │ 🟢 Dad     │  │  😂❤️😂                                  │
│  │ HAHAHA     │  │  ┌────────────────────────────────────┐ │
│  │ 1m ago    │  │  │ 😂  ❤️  😮  👏  😢  🎉  [ + ]       │ │
│  └────────────┘  │  └────────────────────────────────────┘ │
│                  │                                          │
│  [ Type a message...                              ] [Send] │
└──────────────────┴──────────────────────────────────────────┘
```

- **Sidebar width:** 300px on desktop; collapsible via toggle
- **Chat messages:** Stack bottom-up, newest at bottom
- **Message bubble:** Name + avatar, message text, relative timestamp
- **Own messages:** Right-aligned or visually distinguished (subtle highlight or "You" label)
- **Auto-scroll:** Chat auto-scrolls to newest message unless user has scrolled up (at which point it shows a "new messages ↓" pill)

#### UI Layout: Overlay Mode (Mobile / Fullscreen Video)

On mobile or when fullscreen is engaged, the sidebar collapses into a chat overlay:

```
┌─────────────────────────────────────────┐
│                                         │
│         [ FULLSCREEN VIDEO ]            │
│                                         │
│  ┌──────────────┐                       │
│  │ Live Chat    │                       │
│  │ ─────────── │                       │
│  │ Mom: Wow!   │                       │
│  │ Dad: LOL    │                       │
│  │ Mike: 🔥    │                       │
│  │ ─────────── │                       │
│  │ [ msg... ]⬆️ │  ← tap to expand     │
│  └──────────────┘                       │
│                                         │
│  😂 ❤️ 😮 👏 😢 🎉 [ + ]               │
└─────────────────────────────────────────┘
```

- Chat overlay is a semi-transparent panel, 40% screen width, anchored bottom-left
- Tap the header to expand/collapse
- Reaction bar stays visible at bottom
- "New messages ↓" pill appears when scrolled up

#### Chat Message Specification

| Field | Value |
|---|---|
| `id` | UUID v4 |
| `familyId` | From session context |
| `roomId` | `${familyId}:${videoId}:${sessionId}` |
| `userId` | From Clerk JWT |
| `userName` | Display name at time of send |
| `text` | Max 500 characters; no markdown (plain text only) |
| `timestamp` | ISO 8601 UTC |
| `videoTimestamp` | Current video playback position when sent (so messages can be linked to moments) |

#### Chat History

- **Storage:** Neon Postgres, `family_chat_messages` table
- **Retention:** Last 100 messages per room (`roomId`)
- **On join:** Client receives last 100 messages immediately on room join (via WebSocket `history` event)
- **Pagination:** Not in Phase 1. Future: "Load earlier messages" trigger at top of chat.
- **Cleanup:** A background job (pgcron or similar) purges messages older than 7 days per room, or when the 100-message cap is exceeded, oldest are deleted first.

#### Real-Time Delivery

1. Client sends `chat:send` event with message payload
2. Server validates (auth via Clerk, text length, rate limit: 1 message per 2 seconds per user)
3. Server writes to Neon Postgres
4. Server broadcasts `chat:new` to all clients in the room (including sender, for confirmed delivery)
5. Client appends to chat list

#### Edge Cases

| Scenario | Behavior |
|---|---|
| Empty chat | Shows "No messages yet. Say something!" with a subtle wave animation |
| Rapid sending | Rate limited; UI shows "Slow down!" tooltip |
| Offensive word detected | Phase 1: No filter. Phase 2: Basic word filter. Family trust model applies. |
| User sends while disconnected | Message not sent; no queue. "You're offline" banner. |
| 100 message cap reached | Oldest messages deleted server-side; all clients receive `chat:pruned` event and refresh history |
| Session ends (everyone leaves) | Chat remains for 30 minutes; re-joiners see history. After 30 min idle, room is archived. |

---

## 3. Technical Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients (Web)                        │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│   │ Player  │  │ Player  │  │ Player  │  │ Player  │        │
│   │ + Chat  │  │ + Chat  │  │ + Chat  │  │ + Chat  │        │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└────────┼───────────┼───────────┼───────────┼────────────────┘
         │           │           │           │
         └───────────┴─────┬─────┴───────────┘
                           │ Socket.IO (WebSocket + HTTP long-poll fallback)
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  Socket.IO Server (Node.js)                  │
│                                                              │
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐  │
│  │ Auth       │   │ Rooms      │   │ Event Handlers     │  │
│  │ Middleware │   │ Manager    │   │ - presence:*       │  │
│  │ (Clerk)    │   │            │   │ - reaction:*       │  │
│  └────────────┘   └────────────┘   │ - chat:*           │  │
│                                    └────────────────────┘  │
└──────────────────────────┬─────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Redis       │  │ Neon Postgres   │  │ Clerk           │
│ (Presence,  │  │ (Chat history,  │  │ (Auth only —    │
│  Pub/Sub,    │  │  room state,   │  │  no user data   │
│  Socket.IO   │  │  sessions)     │  │  stored here)   │
│  adapter)   │  │                 │  │                 │
└─────────────┘  └─────────────────┘  └─────────────────┘
```

### Stack

| Layer | Technology |
|---|---|
| WebSocket Server | Node.js + Socket.IO 4.x |
| Horizontal Scaling | Socket.IO Redis Adapter (Redis) |
| Database | Neon Postgres (serverless) |
| ORM | Prisma |
| Auth | Clerk (JWT verification middleware) |
| Background Jobs | pgcron (via Neon) or BullMQ |
| Client SDK | Socket.IO client (bundled with frontend) |

### Room Architecture

**Room ID format:** `family:${familyId}:video:${videoId}:session:${sessionId}`

- `familyId`: The family account ID (from Clerk or custom)
- `videoId`: The video being watched (from FamilyTV's existing video table)
- `sessionId`: A UUID generated when the first family member initiates synchronized playback; reused by all joiners

A session is considered **active** while at least one user is connected. After the last user disconnects, the session is marked inactive but chat history is retained for 30 minutes.

### Socket.IO Event Reference

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `room:join` | `{ familyId, videoId, sessionId }` | Join a watch party room |
| `presence:heartbeat` | `{ roomId }` | Keep presence alive |
| `reaction:send` | `{ emoji, videoTimestamp }` | Send a reaction |
| `chat:send` | `{ text, videoTimestamp }` | Send a chat message |

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room:joined` | `{ presence[], history[] }` | Confirmation + initial state |
| `presence:update` | `{ users: [{ id, name, avatar, status }] }` | Presence changed |
| `reaction:new` | `{ userId, userName, emoji, videoTimestamp }` | New reaction |
| `chat:new` | `{ id, userId, userName, text, timestamp, videoTimestamp }` | New message |
| `chat:history` | `ChatMessage[]` | History on join |
| `chat:pruned` | `{ oldestId }` | Oldest messages removed |

### Auth Flow

1. Client connects to Socket.IO with `Authorization: Bearer <Clerk JWT>` header
2. Socket.IO server middleware intercepts, verifies JWT via Clerk's `verifyToken()`
3. Extract `userId`, `familyId`, `displayName` from JWT claims
4. Reject connection if token invalid or expired (disconnect with code 4001)
5. All subsequent events are scoped to the authenticated user's family

**Clerk JWT Claims Expected:**
```json
{
  "sub": "user_abc123",           // userId
  "family_id": "family_xyz789",   // custom claim added via Clerk Webhooks
  "name": "Mom",
  "avatar_url": "https://..."
}
```

*Note: `family_id` is added via Clerk's metadata/webhook system when a user is created or assigned to a family.*

### Redis Schema

Used for Socket.IO adapter (pub/sub for horizontal scaling) + presence state.

```
# Presence state (Hash)
presence:{roomId} → {
  { oderId": { "name": "Mom", "avatar": "url", "status": "green", "lastSeen": 1711900000 },
  ...
}

# Room metadata (String with TTL)
room:{roomId}:meta → { "familyId": "...", "videoId": "...", "createdAt": "...", "activeUntil": 1711903600 }
TTL: 30 minutes after last user leaves
```

### Neon Postgres Schema

```sql
CREATE TABLE family_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  video_timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_messages ON family_chat_messages (room_id, created_at DESC);
CREATE INDEX idx_family_messages ON family_chat_messages (family_id, created_at DESC);

-- Periodic cleanup: keep last 100 messages per room
DELETE FROM family_chat_messages
WHERE id NOT IN (
  SELECT id FROM family_chat_messages
  WHERE room_id = family_chat_messages.room_id
  ORDER BY created_at DESC
  LIMIT 100
);
-- Run via pgcron every 5 minutes
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
REDIS_URL=rediss://user:pass@host:6379
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SOCKET_PORT=3001
SOCKET_CORS_ORIGIN=https://familytv.app
```

---

## 4. UI Design

### Layout Principles

1. **Video is king.** The video player always gets the most space. Chat and reactions are overlays/adjoining panels, never competitors.
2. **Progressive disclosure.** Presence is always visible. Chat is visible on desktop sidebar by default, collapsed on mobile. Reactions are always visible below video.
3. **Non-blocking.** Users can watch without interacting. None of these features require action to function.
4. **Consistent with FamilyTV's design language.** Use the existing color palette, typography, and component styles. This spec defines behavior and layout; designers should apply FamilyTV's visual identity.

### Desktop Layout (1280px+)

```
┌────────────────────────────────────────────────────────────────────┐
│  [FamilyTV Header / Navigation — existing]                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────┐  ┌─────────────────┐ │
│  │                                         │  │  LIVE CHAT      │ │
│  │  [VIDEO PLAYER — 16:9]                  │  │                 │ │
│  │                                         │  │  [scrollable]   │ │
│  │                                         │  │                 │ │
│  │  ─────────────────────────────────────  │  │                 │ │
│  │  😂 ❤️ 😮 👏 😢 🎉 [+]  ← reactions     │  │  ─────────────── │ │
│  └─────────────────────────────────────────┘  │                 │ │
│                                               │  [input] [send]  │ │
│  👀 Also watching: 🟢 Mom 🟢 Dad 🟢 Mike      │                 │ │
│                                               └─────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

- Video: ~70% width
- Chat sidebar: 300px fixed width, right side
- Presence strip: below video, above reactions
- Reaction bar: inside video container, bottom overlay (semi-transparent background)

### Mobile Layout (< 768px)

```
┌────────────────────────────┐
│ [FamilyTV Header]          │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │                        │ │
│ │   [VIDEO PLAYER]       │ │
│ │                        │ │
│ │  ────────────────────  │ │
│ │  😂❤️😮👏😢🎉 [+]      │ │
│ └────────────────────────┘ │
│                            │
│ 👀 🟢 Mom 🟢 Dad           │
│                            │
│ ┌──────────────────────┐   │
│ │ 💬 2 new messages ↓   │   │
│ └──────────────────────┘   │
│  [ tap to open chat ]      │
└────────────────────────────┘
```

- Full-width video
- Chat: collapsible overlay (bottom-left, semi-transparent)
- Presence: compact strip above chat toggle

### Animation Specifications

| Element | Animation |
|---|---|
| Reaction bubble | `floatUp` keyframe, 2.8s, ease-out, random horizontal drift ±30px |
| Presence dot (green ↔ grey) | CSS transition 0.3s ease |
| User joins presence strip | Slide in from right, opacity 0→1, 300ms |
| User leaves presence strip | Fade out, 200ms |
| Chat message appears | Slide up from bottom of list, 200ms ease-out |
| New message notification pill | Bounce in from left, 300ms |
| Chat sidebar toggle (mobile) | Slide up from bottom, 250ms ease-out |
| Video pause from idle | No animation change; presence dot goes grey |

### Component Inventory

| Component | States |
|---|---|
| Reaction Bubble | spawning → floating → fading → gone |
| Presence Dot | green (active) / grey (idle) / absent |
| Chat Message | own message / other's message / system message ("joined") |
| Chat Input | empty / typing / submitting / error ("slow down") |
| Chat Overlay (mobile) | collapsed / expanded |
| Reaction Bar | default / emoji picker open |
| Emoji Picker | closed / open (grid of 24 emojis) |

---

## 5. Privacy & Safety

### Core Principle: Family-Only by Architecture

Family Watch Party is not a public product. It is architecturally impossible for a non-family member to join a watch party.

| Layer | Protection |
|---|---|
| **Auth** | Clerk authentication required. JWT verified on every Socket.IO connection. |
| **Family scoping** | Rooms are keyed by `familyId`. A user can only join rooms for families they belong to (enforced server-side by JWT claim check). |
| **No invite links** | Unlike Teleparty, there are no shareable room codes. You can only join if you're already in the family. |
| **No cross-family visibility** | Presence, chat, and reactions are never visible outside the family room. |
| **No recording** | Chat and reactions are not recorded. Ephemeral by design. |
| **No DMs** | Only room-wide chat, no private messaging. Family transparency. |

### Content Safety

**Phase 1:** No automated content filtering. Family trust model — the assumption is that a family sharing a private video platform already trusts each other. This is explicitly not a public social platform.

**Phase 2 (future):**
- Basic word filter (predefined blocklist) for chat
- Optional "quiet watching mode" per user
- User-level mute/block within the family (unlikely to be needed, but available)

### Quiet Watching Mode

Users who want to watch without social features can:
1. **Hide chat:** Toggle to collapse the chat sidebar/overlay
2. **Mute reactions:** Toggle to stop reaction bubble animations (presence strip remains visible)
3. **Hide presence:** Toggle to remove your name from the "Also watching" strip for other users (you still see them)

These are per-session toggles, not account settings. Designed for the parent who wants to watch the kids' recital alone but still feels good knowing family is watching.

### Data Privacy

- No chat data is used for analytics or advertising
- No cross-platform data sharing
- Chat history is automatically deleted after 7 days (via pgcron job)
- No reactions are stored anywhere

---

## 6. Phasing

### Phase 1: MVP — "We Watch Together"

**Goal:** Launch the core real-time experience to a small group of family testers.

**Includes:**
- [ ] Socket.IO server with Clerk auth
- [ ] Room join/leave (presence strip)
- [ ] Heartbeat-based presence (green/grey dots)
- [ ] Quick reactions with floating bubbles (ephemeral)
- [ ] Live chat with last 100 messages
- [ ] Chat persistence in Neon Postgres
- [ ] Chat history on room join
- [ ] Desktop sidebar layout (mobile: simplified overlay)
- [ ] Basic rate limiting (chat: 2s, reactions: 200ms)

**Excludes:**
- [ ] Emoji picker ("+" button is visible but disabled or shows "coming soon")
- [ ] Message word filter
- [ ] "New messages" pill and scroll-to-bottom UX
- [ ] Quiet watching mode toggles
- [ ] Horizontal scaling (Redis) — single server is fine for MVP
- [ ] Session persistence (rooms expire when all users leave)
- [ ] Mobile-optimized chat overlay

**Success criteria:** 5 families use it for 2 weeks without critical bugs. Chat and presence work reliably. Reactions feel joyful.

---

### Phase 2: Polish & Scale

**Goal:** Robust, polished, mobile-first.

**Includes:**
- [ ] Socket.IO Redis adapter for horizontal scaling
- [ ] Full emoji picker (+ button works)
- [ ] "New messages" pill / scroll-to-bottom
- [ ] Mobile chat overlay with proper gesture support
- [ ] Quiet watching mode (hide chat, mute reactions, hide presence)
- [ ] Basic chat word filter
- [ ] Session persistence (room state survives if users reconnect within 30 min)
- [ ] "Load earlier messages" pagination
- [ ] Auto-hide chat for users who haven't interacted in 10 minutes (opt-in)
- [ ] Push notification for @family mentions (stretch goal)

**Success criteria:** 50+ concurrent rooms. <100ms reaction latency at P95. 0 critical privacy incidents.

---

## 7. Metrics

### How We Know It's Working

#### Engagement Metrics (Phase 1)

| Metric | Definition | Target |
|---|---|---|
| **Watch Party Start Rate** | % of video sessions that have ≥1 other family member join | TBD after baseline |
| **Presence Duration** | Avg time a user stays in a room (from join to leave) | >50% of video watch time |
| **Reaction Rate** | Avg reactions per user per hour of watch time | >2 reactions/hour |
| **Chat Participation Rate** | % of watch party sessions with ≥1 chat message | >30% |
| **Chat Messages / Session** | Avg messages per session | >3 messages |

#### System Health Metrics

| Metric | Definition | Target |
|---|---|---|
| **Socket Connection Success Rate** | % of join attempts that result in successful room connection | >99% |
| **Reaction Delivery Latency** | P95 time from reaction:send to reaction:new received by other clients | <200ms |
| **Chat Delivery Latency** | P95 time from chat:send to chat:new received by other clients | <300ms |
| **Presence Accuracy** | % of time presence strip matches actual connected users | >99% |
| **Error Rate** | % of Socket events that result in server error | <0.1% |

#### Privacy & Safety Metrics

| Metric | Definition | Target |
|---|---|---|
| **Unauthorized Join Attempts** | Count of rejected room:join events (wrong family) | Monitor only |
| **Auth Failure Rate** | % of Socket.IO connection attempts that fail Clerk verification | <1% |

### Instrumentation

- **Client-side:** Track `watch_party_joined`, `reaction_sent`, `chat_message_sent`, `chat_message_received`, `presence_updated`, `session_duration`
- **Server-side:** Track connection counts per room, event throughput, latency histograms, error counts
- **Use existing analytics** (e.g., PostHog, Plausible) — no need to build custom dashboards for Phase 1

---

## 8. Competitive Analysis

### Existing Watch-Together Products

| Product | Real-Time Social | Privacy | Family Focus | Persistence |
|---|---|---|---|---|
| **Teleparty (Netflix Party)** | ✅ Chat, reactions | ❌ Public rooms with invite links | ❌ No | Chat only |
| **Watch2Gether** | ✅ Chat, reactions | ❌ Public rooms | ❌ No | No |
| **Kukufm (and similar)** | ✅ Reactions | ❌ Mixed | ❌ No | No |
| **Discord Watch Parties** | ✅ Chat, reactions, voice | ✅ Private servers | ❌ General purpose | No |
| **Instagram Live / Facebook Watch** | ✅ Reactions, live comments | ❌ Public by default | ❌ No | No |
| **FamilyTV Watch Party** | ✅ Presence, reactions, chat | ✅ Family-only, no invite links | ✅ Core | Chat only |

### What Makes FamilyTV Different

1. **Privacy-first architecture.** You cannot stumble into a FamilyTV watch party. There are no room codes to share, no public directories, no "discover" features. You must be authenticated as a family member to even attempt a connection. This is the single largest differentiator from Teleparty/Watch2Gether.

2. **Family as the social unit.** FamilyTV's existing product is built around family identity. Watch Party is not an add-on — it's an extension of a shared family space. The presence strip shows *family*, not friends or strangers.

3. **No ads, ever.** Teleparty and Watch2Gether are free with ads. FamilyTV is private family infrastructure with no advertising. Chat and reactions are never monetized.

4. **No thread maintenance.** Reactions are ephemeral. Chat history is temporary (7 days). There's no "inbox" to check, no social performance pressure. Watch a video, react in the moment, move on.

5. **Presence, not performance.** The "Also watching" feature is unique. Most watch-together tools have no sense of shared presence — you know people are there because they're chatting, but you don't know who's silently watching. FamilyTV's presence strip creates the "I'm not alone" feeling that makes the whole product emotionally compelling.

6. **Tighter sync.** FamilyTV already solves synchronized playback. Many third-party watch-together tools have sync drift issues. FamilyTV Watch Party inherits the existing sync engine.

### Positioning Statement

> Family Watch Party is to private family video what the family couch is to living room TV — a place where you're together even when you're apart. Unlike Teleparty, there's no sharing, no invites, no strangers. Unlike Discord, there's no servers to manage, no features to learn, no noise from outside the family. It's watching together, the way it should be.

---

## Appendix A: Socket.IO Event Full Reference

*See Section 3 for event summary. This appendix is for engineer reference during implementation.*

## Appendix B: Component Wireframes

*Placeholder — to be filled by design team using Figma. Wireframes should cover:*
- *Desktop: video + sidebar + presence strip + reaction bar*
- *Mobile: video + collapsible chat overlay + reaction bar*
- *Emoji picker modal*
- *Quiet watching mode toggles*

## Appendix C: Testing Checklist

- [ ] Two users in same family can join same room and see each other's presence
- [ ] User not in the family cannot join the room (auth rejection)
- [ ] Reactions from one user appear on all other users' screens within 200ms
- [ ] Reactions do not persist after page refresh
- [ ] Chat messages persist across page refreshes (up to 100)
- [ ] Chat history loads on room join
- [ ] Rate limiting prevents message spam (shows tooltip)
- [ ] Presence dot goes grey after 30s idle
- [ ] User removal from presence strip after 2 min disconnect
- [ ] Mobile chat overlay toggles open/closed
- [ ] Socket reconnects automatically after brief network drop

---

*End of PRD — v1.0*
