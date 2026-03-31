# CTM-223: Server-Authoritative Sync Clock

## Overview

FamilyTV uses a server-authoritative time source for synchronized playback across clients. The server provides wall-clock UTC time, and clients use an NTP-like RTT handshake to correct for clock drift and network latency.

## Algorithm

### NTP-like 4-way RTT Handshake (Client-side)

```
Client                           Server
   |----- T1 (client send) ------>|
   |                                |  T2 (server recv)
   |                                |  T3 (server send)
   |<------ T4 (client recv) ------|
```

**Round Trip Time (RTT):**
```
RTT = (T4 - T1) - (T3 - T2)
```

**Clock Offset:**
```
offset = ((T2 - T1) + (T3 - T4)) / 2
```

**Corrected Server Time (client-side):**
```
correctedTime = serverTime + offset
```

This algorithm is lightweight and provides accurate drift correction without server-side state.

## Clock Source

- **Source:** System `Date.now()` (wall-clock UTC)
- **Resolution:** Millisecond
- **Range:** Standard Unix epoch (64-bit)
- **No external NTP dependency** — relies on OS/system clock

## Client Drift Correction

### EMA Smoothing

Client maintains a smoothed offset using Exponential Moving Average:

```
smoothedOffset = α * rawOffset + (1 - α) * smoothedOffset
// α = 0.2 (smoothing factor)
```

### Re-sync Triggers

- **Startup:** Initial sync on app load
- **Periodic:** Every 30 seconds during active playback
- **Buffer underrun:** Immediate re-sync on playback stall
- **Reconnect:** Sync after network reconnection

## Latency Compensation

- **Per-client RTT tracking:** Each client tracks its own RTT independently
- **Stateless server:** Server maintains no client state; all correction happens client-side
- **RTT estimation:** Clients use rolling average of last 5 RTT measurements

## Edge Cases

### Network Partition
- If no sync for >60 seconds, client pauses playback and re-syncs
- Playback resumes only after fresh sync confirms clock validity

### Clock Skew
- **±30 seconds:** Warning logged, playback continues
- **>±5 minutes:** Playback blocked, user notification shown
- **Recovery:** Automatic re-sync attempts to realign

### Leap Seconds
- Handled by OS/UTC standard library
- No special handling required in application code

## API

### `GET /api/sync/clock`

Returns server clock information for client synchronization.

**Request:** None

**Response (200 OK):**
```json
{
  "serverTime": 1743466200000,
  "iso": "2026-03-31T20:10:00.000Z",
  "offset": 0,
  "uptime": 3600000,
  "health": "OK"
}
```

**Response (503 Service Unavailable):**
```json
{
  "error": "Clock not initialized"
}
```

### Response Fields

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| serverTime  | number | Server Unix epoch in milliseconds    |
| iso         | string | ISO 8601 UTC timestamp              |
| offset      | number | Reserved for future offset tracking  |
| uptime      | number | Server clock module uptime (ms)      |
| health      | string | Clock health status                  |

## Database

**None required.** This implementation is fully stateless to support horizontal scaling.

- Each server instance runs independently
- No shared state between instances
- Clients sync per-server (load balancer routes consistently during session)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client A  │     │   Client B  │     │   Client C  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  GET /api/sync/clock                   │
       │ ──────────────────────────────────────►│
       │◄────────────────────────────────────── │
       │  { serverTime, iso, uptime, health }   │
       │                                     │
       │  (RTT handshake happens client-side) │
       │  (EMA smoothing applied)             │
       │                                     │
       ▼                                     ▼
┌─────────────────────────────────────────────────┐
│              Next.js Server (stateless)          │
│  - /api/sync/clock route                        │
│  - Returns server time on each request           │
└─────────────────────────────────────────────────┘
```

## Implementation Notes

- Server module initializes lazily on first request
- Health transitions: `INITIALIZING` → `OK` after init
- Drift warnings are rate-limited to prevent log spam
- All timestamps are UTC; no timezone conversion in server
