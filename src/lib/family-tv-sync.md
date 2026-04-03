# Family TV — Synchronized Playback Architecture

## Overview

Family TV synchronized playback uses **Socket.IO** over WebSocket as the primary transport, with a fallback to **long-polling** for restrictive network environments. Socket.IO is chosen over raw WebSockets for:

1. **Automatic reconnection** with exponential backoff — critical for mobile networks
2. **Room/namespace semantics** — perfect for family-channel scoping without manual tracking
3. **Binary payload support** — useful for streaming media metadata efficiently
4. **Transport fallback** — works through corporate proxies that block WS
5. **Mature client libraries** — React Native / Expo support out of the box

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Web      │  │ iOS App  │  │Android   │  │ Web      │        │
│  │ (React)  │  │ (RN)     │  │ (RN)     │  │ (React)  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                             │                                     │
│                      Socket.IO Client                             │
└─────────────────────────────┬────────────────────────────────────┘
                              │ ws:// or https://
                              │ (WebSocket with polling fallback)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Socket.IO Server                             │
│                     (Vercel Edge or                              │
│                      separate Node process)                      │
│                                                                  │
│  Namespace: /tv                                                  │
│  Room per family: tv:family:{familyId}                           │
│  Room per channel: tv:family:{familyId}:channel:{n}              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Auth         │  │ Sync         │  │ Presence     │           │
│  │ Middleware   │  │ Coordinator  │  │ Manager      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌────────────┐  ┌────────────┐  ┌────────────────────┐
      │ Neon DB   │  │ Auth       │  │ (Future: Redis for  │
      │ tv_*      │  │ (Clerk)    │  │  sub-100ms fanout)  │
      │ tables    │  │            │  │                    │
      └────────────┘  └────────────┘  └────────────────────┘
```

## Connection Lifecycle

### 1. Client Connect

```
Client                          Socket.IO Server
  │                                     │
  │──── CONNECT (auth token) ──────────▶│
  │                                     │ Validate Clerk JWT
  │                                     │ Verify family membership
  │                                     │ Join room: tv:family:{familyId}
  │◀─── CONNECTION ACK (session) ───────│
  │                                     │
  │──── SYNC STATE REQUEST ────────────▶│
  │                                     │ Fetch current session from Neon
  │◀─── SYNC STATE RESPONSE ────────────│ (active video, position, broadcaster)
```

### 2. Joining an Active Session (Late Viewer)

```
Server                            Late Client                Other Clients
  │                                   │                          │
  │◀──── JOIN SESSION ───────────────│                          │
  │      GET /api/tv/sessions/:fid   │                          │
  │──── SESSION STATE ──────────────▶│                          │
  │                                   │                          │
  │                                   │──── PRESENCE UPDATE ────▶│
  │                                   │  (user joined, presence)  │
```

## Room Structure

```
Namespace: /tv

Room hierarchy:
  tv:family:{familyId}          — all members, all channels
  tv:family:{familyId}:live     — members watching live (not solo)
  tv:family:{familyId}:channel:{n}  — members on specific channel

Broadcasting (leader → followers):
  Only clients in the broadcaster role emit authoritative events.
  Server validates broadcaster status before relaying.
```

## Sync Events (Client ↔ Server)

### Outbound (Client → Server)

```typescript
// Play action
{ type: "playback", action: "play", videoId: string, position: number, timestamp: string }

// Pause action
{ type: "playback", action: "pause", videoId: string, position: number, timestamp: string }

// Seek action
{ type: "playback", action: "seek", videoId: string, position: number, seekTarget: number, timestamp: string }

// Skip
{ type: "playback", action: "skip_forward" | "skip_back", videoId: string, position: number, timestamp: string }

// Video change (broadcaster only)
{ type: "playback", action: "video_change", videoId: string, timestamp: string }

// Solo mode toggle
{ type: "presence", soloMode: boolean }

// Heartbeat (every 15 seconds)
{ type: "presence", heartbeat: true }
```

### Inbound (Server → Clients)

```typescript
// Authoritative playback event (fanned out to room)
{
  type: "sync",
  action: "play" | "pause" | "seek" | "video_change",
  videoId: string,
  position: number,
  broadcasterId: string,
  serverTimestamp: string,  // ISO UTC — used for conflict resolution
  eventId: string            // UUID — deduplication key
}

// Presence update
{
  type: "presence",
  userId: string,
  nickname: string,
  soloMode: boolean,
  online: boolean,
  viewerCount: number
}

// Session state sync (sent on reconnect)
{
  type: "session_state",
  videoId: string,
  position: number,
  broadcasterId: string,
  isLive: boolean,
  channelNumber: number
}

// Catch-up notification (late viewer joined)
{
  type: "catch_up",
  userId: string,
  displayName: string,
  joinedAt: string
}
```

## Reconciliation Algorithm

When a follower receives a sync event:

```
1. Receive event from server
2. If event.eventId already seen → discard (dedup)
3. Calculate client clock_delta = Date.now() - event.serverTimestamp
4. If clock_delta > 2000ms → log warning (high latency)
5. Apply event to local player:
   - play/pause → toggle playback state
   - seek → set position to event.position
   - video_change → load new video at position 0
6. Broadcast acknowledgment to server (optional, for logging)
```

When a broadcaster's event is delayed/lost:
```
1. Follower detects playback drift > 2 seconds
2. Follower requests resync: { type: "resync_request" }
3. Server responds with current session state
4. Follower reconciles position
```

## Broadcaster Transfer

When a follower claims the remote:
```
1. Client A (current broadcaster): emit claim_request
2. Server: verify Client A is still broadcaster in DB
3. Server: update tv_sessions.broadcaster_id = Client B
4. Server: emit broadcaster_changed { newBroadcasterId: B }
5. All clients update UI to show B as broadcaster
6. Client B's controls become authoritative
```

## Conflict Resolution

If two events arrive with the same `serverTimestamp` (within 50ms):
- Use the lower `eventId` (lexicographic UUID sort) as tiebreaker
- Loser is discarded and client reconciles locally

If a client goes offline during a seek:
- Server uses its own clock, not client's timestamp
- Late reconnection receives full session state, not event replay

## Vercel Deployment Note

Socket.IO requires a persistent server process, which conflicts with Vercel's stateless function model. Two options:

**Option A: Separate Socket.IO server** (recommended for MVP)
- Deploy as a separate Node.js service (Railway, Fly.io, or VPS)
- URL: `wss://tv.familytv.com` (or similar)
- Communicate with Vercel API routes only for DB operations

**Option B: Vercel Serverless + Pusher/Ably** (simpler ops)
- Use Pusher Channels or Ably for WebSocket transport
- Vercel functions handle API/auth only
- Third-party handles real-time fanout
- Cost: ~$50/mo for family-scale usage (10-20 concurrent connections)

**Recommendation for Phase 1 MVP:** Option B with **Ably** (free tier: 100 concurrent connections, enough for MVP family testing). Migrate to Option A before public launch.

## Offline / Reconnect Behavior

- Socket.IO auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- On reconnect: client sends `{ type: "resync_request" }`
- Server responds with full `session_state`
- If gap > 5 minutes: server treats as new viewer (start from beginning)
- If gap < 10 seconds: silent resume
- If gap 10s–5min: show "The channel has moved. [Join Live] or [Watch from here]"

## Security

- All Socket.IO connections require a Clerk JWT token in the handshake
- Server validates `family_id` membership from Clerk claims
- Rooms are keyed by `family_id` — users cannot join rooms they don't belong to
- Broadcast rate limit: max 1 sync event per 100ms per broadcaster
- Anti-spam: if > 5 events arrive from a client in 1 second, disconnect the client
