# WebSocket Sync Latency Research — Family TV

*Last updated: 2026-03-30 | Researcher: sub-agent*

---

## Executive Summary

For synchronized watch-party experiences, **300-500ms end-to-end latency is the acceptable threshold** — anything above this and viewers notice desync, especially during action moments. For conversational video chat, the bar is stricter: **150-300ms round-trip**. Family TV's <500ms target (from the PRD) is well-calibrated: it matches industry standards for watch-party sync while being technically achievable with WebSocket + smart client-side buffering.

---

## Latency Tolerance by Use Case

Research from Stream.io, Oxagile, and industry implementations establishes clear latency bands:

| Use Case | Required Latency | What happens above threshold |
|----------|-----------------|------------------------------|
| **Video chat / conferencing** | 150-300ms round-trip | Conversations feel stilted; people talk over each other |
| **Interactive livestreams** | 200-500ms | Participants feel disconnected from host |
| **Sports watch parties** | 300-500ms | **Critical:** Spoilers happen — someone cheers before others see the goal |
| **Live shopping / auctions** | 200-500ms | Bid confusion; missed purchases |
| **Cloud gaming** | 60-100ms | Game becomes unplayable |
| **Family video sync (Family TV)** | <500ms target | If Grandma pauses and Grandpa sees the pause 1+ second later, it breaks the "together" illusion |

**Key insight for Family TV:** The emotional experience of synchronized viewing depends less on absolute latency and more on **all viewers being within the same latency band**. If everyone is at ~400ms, it feels synchronized. If one viewer is at 400ms and another at 1200ms, the 1200ms viewer sees events "early" from the first viewer's perspective — destroying immersion.

---

## How Existing Platforms Handle Sync

### Netflix Party / Teleparty
- Uses WebSocket to broadcast playback state changes (play, pause, seek)
- The **host's video player is authoritative** — all clients follow the host's position
- No publicly documented latency SLA, but user reports suggest 300-800ms depending on network conditions
- Does NOT stream video through Teleparty servers — each client streams from Netflix independently; only control signals go through WebSocket
- Sync mechanism: when a sync event fires, clients calculate the delta between their current position and target position, then seek

### Watch2Gether (W2G)
- WebSocket-based state coordination
- **Notable feature:** Manual latency compensation dial — users can tune their sync offset by ±5 seconds to compensate for network variance
- Uses a buffer-based approach: incoming sync events are held briefly to ensure all clients process them in the same frame window
- Discord bot integration (CinemaBot, W2G Bot) uses WebSocket heartbeat pings to measure RTT and auto-adjust sync offset

### Mzelo
- WebSocket sync for YouTube and direct links
- No documented latency compensation mechanism
- Uses a "state save" model for virtual browser sessions

### Technical Common Denominator
All major platforms use:
1. **WebSocket for control signaling** (play/pause/seek events)
2. **Direct streaming from source** (Netflix, YouTube, etc.) — NOT proxying video through sync server
3. **Fan-out model** — one authoritative client (host/broadcaster) drives playback
4. **Client-side buffering** to absorb network jitter and smooth out sync events

---

## Latency Breakdown for Family TV

### End-to-End Latency Components

```
Total latency = T1 (broadcaster action) + T2 (network to server) 
              + T3 (server processing + fan-out) + T4 (network to clients) 
              + T5 (client buffering + playback)
```

| Component | Typical Range | Family TV Target |
|-----------|--------------|-----------------|
| T1: Broadcaster input latency | <10ms (local) | <10ms |
| T2: Upstream to sync server | 20-200ms (varies by geography) | <100ms (edge hosting) |
| T3: Server fan-out | 5-50ms | <20ms |
| T4: Downstream to clients | 20-200ms | <100ms |
| T5: Client buffering/display | 50-200ms | <100ms |
| **Total** | **~300-700ms** | **<500ms** |

### Geographic Variance — The Real Problem

The biggest sync challenge is not absolute latency but **latency variance across viewers**. If Viewer A is in Ohio (50ms from server) and Viewer B is in London (150ms from server), their raw latency differs by 100ms — which is imperceptible. But if A is on LTE (200ms) and B is on fiber (20ms), the 180ms gap becomes noticeable.

**Solution:** Server-authoritative timestamps + client-side interpolation:
1. Server stamps every sync event with a UTC timestamp
2. Clients receive the event and calculate: `targetPlaybackTime = serverTimestamp + bufferWindow`
3. Buffer window absorbs variance (typical: 200-400ms buffer)
4. Client plays the event at `targetPlaybackTime`, not upon receipt

---

## The "Feels Off" Threshold

Research on human perception of audiovisual desync (from video conferencing literature):

- **<100ms:** Imperceptible — feels perfectly synchronized
- **100-300ms:** Usually imperceptible for non-interactive content; noticeable for speech
- **300-500ms:** Noticeable during quiet moments; during action, often masked by visual activity
- **500ms-1s:** Consistently noticeable; pauses feel delayed; "are they ahead or behind?" confusion
- **>1s:** Broken — someone will spoil the moment ("Did you see when the dog knocked over the cake?!")
- **>3s:** Unwatchable together; spontaneous reactions are impossible

**Family TV's <500ms target captures the 300-500ms "noticeable but not broken" band.** The goal is to stay consistently below 500ms so the experience never crosses into the "off" zone. Variability (jitter) matters as much as absolute latency — a consistent 450ms connection feels better than one that alternates between 200ms and 800ms.

---

## Technical Recommendations for Family TV

### 1. WebSocket + Heartbeat for Presence and Drift Detection
- Send heartbeat every 5 seconds
- Include client timestamp in heartbeat
- Server tracks per-client RTT and can warn if a client is drifting
- Drift threshold: if a client is >500ms off from server-authoritative time, trigger a resync

### 2. Server-Authoritative Playback Clock
- Server maintains the canonical playback position: `serverPosition = lastKnownPosition + (now - lastEventTime)`
- Never trust client's self-reported position for sync decisions
- All seek/play/pause events reference absolute server timestamps

### 3. Smart Buffer Window
- Client buffers incoming sync events for 200-400ms before acting on them
- This absorbs network jitter and prevents "stuttering" from out-of-order events
- Buffer window should be adaptive: larger on high-jitter connections, smaller on stable ones

### 4. Catch-Up Mode (Graceful Desync)
- If a viewer falls >10 seconds behind (network dropout, device pause), don't force-resync
- Show: "The channel moved ahead by X minutes. [Join Live] or [Watch from here]"
- This is the design decision from the PRD — it prevents frustrating "jumps" for viewers with intermittent connectivity

### 5. Skip-Forward / Skip-Back Tolerance
- 10-second skip events are broadcast but should be applied immediately on client (no buffer) to feel responsive
- Play/pause can be buffered slightly; skips should be near-instantaneous

### 6. WebRTC for P2P Media (Future Consideration)
- For family video files stored on FamilyTV's own storage (Vercel Blob), WebRTC P2P delivery would eliminate media proxy costs and reduce latency vs. HLS/DASH streaming
- However, WebRTC adds connection complexity (STUN/TURN servers, ICE candidates)
- **Recommendation for Phase 1:** Use signed Blob URLs with video delivered through standard HTTPS; WebSocket handles only the sync signal. This is the same model Teleparty uses.
- **Phase 2/3:** Evaluate WebRTC P2P for family video files if cost or latency becomes an issue.

---

## References

- Stream.io Blog: "How Low-Latency Video Streaming Works" — https://getstream.io/blog/low-latency-video-streaming/
- Oxagile: "Ultra Low Latency Video Streaming Guide" — https://www.oxagile.com/article/ultra-low-latency-streaming/
- Softvelum SLDP: Low-delay protocol analysis — https://softvelum.com/sldp/
- Ankit Koche: "Measuring Latency of WebSocket Messages" — https://ankitbko.github.io/blog/2022/06/websocket-latency/
- Lifetips Alibaba: "Anime Watch Party Tech: Bots vs Native Sync" — community research on CinemaBot/WebSocket sync
- Playbox Technology: "Why Sub-Second Latency Matters" — https://playboxtechnology.com/2025/05/why-sub%E2%80%91second-latency-matters-in-live-streaming-and-how-to-achieve-it/

---

## Key Numbers to Remember

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|-----------|--------------|
| Sync event latency (端 to 端) | <300ms | <500ms | >1000ms |
| Buffer window | 200-400ms | 400-600ms | >1000ms |
| Drift before resync | N/A | >10s behind | N/A |
| Catch-up threshold (offer resync) | 10s | 30s | >60s |
