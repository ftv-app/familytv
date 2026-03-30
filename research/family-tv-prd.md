# Family TV — Product Requirements Document

> *"A living room you can share across distances."*

---

## 1. Concept & Vision

### What It Is

Family TV is a synchronized, broadcast-style video player that transforms your family's private video library into a continuous, shared viewing experience. It's not a video hosting platform. It's not a chat app. It's a **private television station built exclusively for your family** — one that plays your family's videos the way a real TV station plays programming, with a schedule, a "now playing" indicator, and synchronized playback across every screen, in every location, for every member.

When your mother in Ohio, your brother in Oregon, and your cousin in London all open Family TV at 7pm local time, they are watching **the same frame of the same video at the same moment** — just as if they were all sitting on the same couch.

### The Emotional Core

Modern families are geographically scattered. The average American family lives across three time zones. Holiday videos sit unwatched in cloud storage. Birthday greetings arrive as attachments that nobody opens. The "shared memory" becomes a private archive instead of a shared experience.

Family TV solves this. It brings back the feeling of the family gathered around the television — not watching *content*, but watching *each other's moments*. The video of your daughter's first steps. The chaos of last Thanksgiving. Your father telling the same story he's told for forty years. These aren't files in a folder. They are **programming**. They have appointment value. They create a shared reference point.

When someone says "did you see the video of the kids from last weekend?", everyone who was watching Family TV knows **exactly** which video, because it was playing **for everyone at the same time**.

This is the emotional promise: **togetherness without proximity**.

### Differentiation from Every Other Family App

| App | What it does | The gap Family TV fills |
|-----|-------------|------------------------|
| Google Photos | Stashes videos privately | No shared viewing experience, no sync |
| Apple Photos (Shared Album) | Lets you share albums | No playback sync, no TV metaphor, no schedule |
| WhatsApp / Signal | Sends video files | Downloads expire, no shared context, chaotic |
| Facebook Family | Social feed of family posts | Public-by-default, algorithm-driven, no sync |
| Cluster (by Apartment Therapy) | Private photo/video sharing | No video playback sync, no TV metaphor |
| FamilyWall | Family coordination | Calendar focus, not video-centric |
| Cozi | Family organizer | Not video-focused at all |

Every competitor treats video as a **file**. Family TV treats video as **programming**. That's the distinction that makes it a brand, not just an app.

---

## 2. The TV Metaphor

### Design Inspiration

The TV metaphor is not cosmetic. It is the entire UX philosophy. We are building on the emotional architecture of what television meant to families before streaming fragmented it.

**Reference points:**

- **Netflix "Continue Watching"** — The persistent, ambient sense that something is always happening, and you can drop in at any moment
- **YouTube TV's Live Guide** — The elegant grid of what's on now and what's coming next; the satisfaction of seeing a schedule laid out
- **The old Channel Surfer** — The tactile pleasure of flipping through channels, landing on something unexpected, feeling the serendipity of broadcast TV
- **Appointment Television** — The cultural memory of "we all gather to watch this at this time" (The Simpsons on Sunday, the Super Bowl, etc.)
- **The TV callsign** — Stations have names: WABC, KFI, CNN. Your family channel has a name too. "The Smith Family Channel."

### Making It Feel Like Channel-Surfing Together

The core interaction is not "I open my phone and watch a video." The core interaction is **"I turn on the TV and it's already on, already playing, already waiting for me."**

When you open Family TV, you don't see a library. You see a **channel**. The channel is already on. Someone (or the algorithm) left it tuned there. You can change what's playing (surf the schedule), or you can just sit and watch. But the default state is **the TV is on**. You don't have to choose to watch. You just... watch.

This is fundamentally different from every other family app, where the user must actively seek out content. Family TV puts the content in front of you, synchronized, ambient, and always waiting.

---

## 3. Core Mechanics

### 3.1 Synchronized Playback

Synchronized playback is the technical and emotional centerpiece of Family TV.

**The rule:** When any family member plays, pauses, seeks, or skips, that action propagates to every currently-connected family member's screen within 500ms.

**The nuance:** Synchronized playback does not mean rigid lockstep. It means **shared temporal experience**. If someone in a different time zone joins 10 minutes late, they watch from the beginning — but they see the "this video started 10 minutes ago" indicator, and their playback position is independent until they catch up or explicitly sync to live.

**States:**

- **Live mode:** All viewers are watching the same moment. If the broadcaster (person who chose the video) pauses, everyone pauses. When they resume, everyone resumes.
- **Catch-up mode:** A late viewer is watching from an earlier position. They see a banner: "The Hendersons started watching 8 minutes ago." They can "Join Live" at any time.
- **Solo mode:** A viewer can temporarily disengage from sync to watch at their own pace. They are still "in the channel" but their playback is local. They see a yellow "Solo Mode" badge. When they want to rejoin, one tap resyncs them to the live moment.

**Sync events propagate:**
- Play / Pause
- Seek (scrubbing)
- Skip forward/back 10 seconds
- Video change (switching to next item in schedule)

**Sync events do NOT propagate:**
- Volume changes (personal preference)
- Picture-in-Picture toggling (personal UI state)
- Subtitle/language preferences (personal)

### 3.2 The TV Guide

The TV Guide is the schedule view. It shows:

```
┌─────────────────────────────────────────────────────┐
│  THE HENDERSON FAMILY CHANNEL        [LIVE ●]       │
├─────────────────────────────────────────────────────┤
│  NOW PLAYING                                         │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Thumbnail]                                 │   │
│  │  Thanksgiving 2024 — The Outtakes            │   │
│  │  Chosen by: Grandma June                     │   │
│  │  ▶ 12:34 / 4:22:10                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  UP NEXT                                             │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Thumb]  Kids Swimming - Summer '24          │   │
│  │           2:30 • Added by: Mike               │   │
│  ├──────────────────────────────────────────────┤   │
│  │  [Thumb]  Lily's First Bike Ride             │   │
│  │           1:15 • Added by: Sarah              │   │
│  ├──────────────────────────────────────────────┤   │
│  │  [Thumb]  Dad's 70th Birthday Toast           │   │
│  │           3:45 • Added by: Tom                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [ ▶ Play Next ]              [ 📺 Full Schedule ] │
└─────────────────────────────────────────────────────┘
```

The guide is the "channel lineup." It shows what's playing now and what's queued up next. It creates the ambient expectation that something is always on and something is always coming.

### 3.3 Simulated Broadcast Schedule

The schedule is not random, but it is also not a cold algorithmic feed. It is a **family-curated channel lineup**.

**How it works:**

The schedule is assembled from the family video library using a set of rules designed to feel like a human program director, not a recommendation engine:

1. **Recently-added videos float to the top.** A video posted yesterday has a higher chance of being "on the air" today. This respects recency.

2. **Videos from the current season/month are prioritized.** Thanksgiving videos play around Thanksgiving. Summer swimming videos play in summer. This is temporal relevance, not surveillance.

3. **Variety enforcement.** The schedule tries not to play two videos from the same person in a row. It tries to intersperse kids' videos with adults' videos, short with long.

4. **The "Program Director" queue.** Any family member can manually add videos to the "up next" queue, which overrides the algorithmic selection. This is like DVRing a show — you decide what plays next.

5. **Daily reset.** At midnight local time, the channel refreshes with a new "morning lineup," giving early risers a fresh experience.

**What happens when someone posts a new video?**

New videos enter the schedule in one of two modes (user-configurable per family):

- **"Goes on the air" immediately:** The video is immediately added to the Up Next queue and a notification goes out to all family members: "New video on your family channel: Lily's First Steps — watch now!"
- **"Saved for next lineup":** The video is added to the library but waits for the next schedule refresh (morning or evening). This prevents a 3am video post from disrupting overnight watchers.

The family admin chooses the mode. Default: **"Goes on the air immediately"** — because the emotional promise of Family TV is that moments are live, not archived.

### 3.4 Who Controls the Channel?

The viewer who initiated the current video is called the **Broadcaster**. The broadcaster's controls are authoritative. When they act, everyone follows.

However, any family member can:

- **Claim the remote:** Take over as broadcaster by tapping "I'm choosing next." The previous broadcaster's session becomes solo mode.
- **Suggest a video:** Queue a video without taking over the remote. It goes to the Up Next list.
- **Skip to next:** Vote to skip the current video. If a majority of active viewers vote, the channel advances to the next item.

This prevents any one person from being a tyrant while still giving the experience a sense of shared curation.

---

## 4. The Interface — TV / Cinema / Broadcasting Design Language

### 4.1 Color Palette

This is NOT the warm cream palette of the rest of FamilyTV. Family TV is the **cinema lobby after the lights go down**.

| Role | Color | Hex | Use |
|------|-------|-----|-----|
| Background | Deep Cinema Black | `#0D0D0F` | Primary background |
| Surface | Theater Charcoal | `#1A1A1E` | Cards, panels, guide background |
| Surface Elevated | Shadow Gray | `#252529` | Hover states, active panels |
| Primary Accent | Velvet Red | `#C41E3A` | Now Playing indicator, Live badge, play buttons |
| Secondary Accent | Broadcast Gold | `#D4AF37` | Channel callsign, premium touches |
| Text Primary | Silver White | `#E8E8EC` | Headings, main text |
| Text Secondary | Muted Silver | `#8E8E96` | Timestamps, metadata, captions |
| Success | Green Signal | `#2ECC71` | Online indicators, sync status |
| Warning | Amber Alert | `#F39C12` | Solo mode badge, reconnecting state |

### 4.2 Typography

Family TV uses type with authority. This is not a casual family album — it is a broadcast station.

**Primary (Headings / Channel Callsign):** `Oswald` — Condensed, bold, TV-station authority. Used for the channel name, "NOW PLAYING," and section headers.

**Secondary (Body / Metadata):** `Source Sans Pro` — Clean, readable, designed for interfaces. Used for video titles, timestamps, member names.

**Mono (Timecode / Technical):** `JetBrains Mono` — For the playback timer and sync status indicators.

**Font sizes:** Generous. Video titles are large (20-24px). The channel callsign is massive (48-64px on TV-sized screens). Controls are thumb-friendly (minimum 48px tap targets).

### 4.3 TV-Style Home Screen

The home screen is a single, immersive view:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ★ THE HENDERSON CHANNEL ★              │
│                                                     │
│    ┌───────────────────────────────────────────┐     │
│    │                                           │     │
│    │                                           │     │
│    │           [NOW PLAYING VIDEO]            │     │
│    │                                           │     │
│    │                                           │     │
│    │  Thanksgiving Outtakes 2024               │     │
│    │  Chosen by: Grandma June  ● 4:22 / 12:34 │     │
│    └───────────────────────────────────────────┘     │
│                                                     │
│    [⏮ -10s]  [⏸ Pause]  [+10s ⏭]   [📺 Guide]      │
│                                                     │
│    ─────────── UP NEXT ───────────                 │
│    [thumb] Kids Swimming...  2:30  Sarah    ▶       │
│    [thumb] Lily's Bike...   1:15  Mike     ▶       │
│    [thumb] Dad's Toast...   3:45  Tom      ▶       │
│                                                     │
│    👤👤👤 4 watching now — Sarah, Mike, Lily         │
└─────────────────────────────────────────────────────┘
```

The video is the hero. The controls are large and satisfying. The channel identity is always visible. The "4 watching now" indicator shows you are not alone.

### 4.4 TV Remote Metaphor (Mobile)

On mobile, the controls are designed for a **thumb at rest**, not a finger that must hunt and peck:

- **Single tap center:** Play / Pause
- **Swipe left:** Skip back 10 seconds
- **Swipe right:** Skip forward 10 seconds
- **Swipe up:** Open the TV Guide
- **Swipe down:** Minimize to PiP
- **Long press:** Open the broadcaster menu (claim remote, suggest video, solo mode)

These are the same muscle-memory gestures as a real TV remote. The first time someone uses Family TV on mobile, it should feel instinctive.

### 4.5 Picture-in-Picture

Family TV can continue playing in a corner of the screen while the viewer navigates other parts of the app — the calendar, the photo gallery, the family roster.

The PiP window is:
- Persistent across navigation
- Draggable to any corner
- Expandable back to full screen with one tap
- Muted by default when active (to prevent audio chaos if multiple family members have PiP open)

PiP is the TV-in-the-corner experience. You never have to stop watching the channel to do something else in the app.

### 4.6 Channel Up / Down (Multi-Household Channels)

Some families have multiple households — the main family channel, and sub-channels for specific branches. Family TV supports up to **5 channels per family**, navigable with channel-up / channel-down gestures:

- **Channel 1 (Main):** The full family channel, everyone subscribed
- **Channel 2-5:** Sub-channels (e.g., "The Smith Cousins," "Grandma's Favorites," "Kid Channel")

Swiping left/right (or pressing channel up/down on a TV interface) navigates between channels. Each channel has its own schedule, its own broadcaster, and its own Up Next queue.

---

## 5. Technical Architecture (Conceptual)

### 5.1 Real-Time Synchronization

**Protocol: WebSocket with WebRTC fallback**

The primary sync mechanism is a **persistent WebSocket connection** maintained between each client and the Family TV sync server. This connection carries two types of messages:

1. **Playback state events:** `{ type: "playback", action: "play|pause|seek|skip", timestamp: ISO8601, broadcaster: userId, videoId: string, playbackPosition: seconds }`
2. **Presence heartbeats:** `{ type: "presence", userId: string, channelId: string, online: boolean, soloMode: boolean }`

The sync server is the authoritative clock. When a playback event arrives, the server stamps it with server time and fans it out to all connected clients in that family channel.

**Latency target:** <500ms from broadcaster action to all viewers displaying the new state.

**Seek synchronization:** When a broadcaster seeks, the server calculates the client's current playback position and issues a `seek` command with an absolute timestamp, not a relative offset. This prevents drift accumulation.

**WebRTC for media delivery:** Actual video streaming uses WebRTC (direct peer-to-peer between family members) with TURN relay fallback. This avoids the cost and latency of routing all video traffic through a central server. The sync server only coordinates playback state — it is not a media proxy.

### 5.2 Time Zone Handling

Time zones are handled through **a single canonical timeline anchored to UTC**.

Every playback event carries a UTC timestamp. Each client renders the local time representation based on the viewer's device time zone setting.

Example: A broadcaster in London hits play at 8:00 PM GMT (UTC+0). A viewer in Los Angeles sees their player activate at 12:00 PM local time (PST, UTC-8). They are watching the same moment; only the label differs.

The TV Guide always shows times in the **viewer's local time zone**. A notification that says "Up next at 7:00 PM" means 7:00 PM wherever the viewer is.

Exception: When scheduling future videos, the guide can optionally show times in the **uploader's time zone** with a label: "Added by Mike (PT)" — so viewers know when someone on the other coast uploaded something.

### 5.3 Offline and Reconnection Behavior

**Going offline:**

When a viewer loses connection, they see:
- A persistent banner: "Reconnecting to the channel..." (yellow)
- Their video freezes at the last known position
- The presence list removes their avatar after 30 seconds

**Reconnecting:**

When connection is restored:
- The client fetches the current playback state from the sync server
- If the difference from the frozen position is <10 seconds, the video resumes silently
- If the difference is >10 seconds, the client shows: "The channel has moved ahead by X minutes. [Join Live] or [Watch from here]"
- If the broadcaster changed the video while they were offline, a toast appears: "Grandma June started playing: Thanksgiving Outtakes"

**Offline duration >5 minutes:**

If a viewer was offline for more than 5 minutes, they are treated as a new viewer on the current video — they start from the beginning but can see the "catch-up" state. They are NOT auto-joined to live playback; they must explicitly choose to rejoin.

### 5.4 Privacy Architecture

Family TV is built on a foundational principle: **this content never leaves the family**.

- **No public access.** Every video, every thumbnail, every comment is scoped to the family group. There is no way to make a Family TV video public.
- **Row-level security in the database.** All queries for video content are gated by `family_id` matching the authenticated user's family membership. There is no API endpoint that returns family video data to an unauthenticated or non-family request.
- **Invite-only membership.** A user cannot access a family channel without a valid, accepted invitation from an existing member.
- **No analytics outside the family.** Usage metrics (who watched what, when) are visible only to family members. No anonymized or aggregated data leaves the family group.
- **Video storage.** Videos are stored in family-scoped buckets (e.g., Vercel Blob with family-id path prefix). Signed URLs with 1-hour expiry are generated per-session; videos cannot be accessed without a valid auth token tied to a family member.
- **Sync server scope.** The sync server maintains WebSocket connections scoped to family channels. There is no cross-family data leakage.

---

## 6. What Makes This NOT Creepy

Family TV walks a careful line — it creates a sense of shared presence without creating a surveillance system. Here's how we design for trust:

### 6.1 It's Playback, Not Live Video

Family TV never shows a live camera feed of someone's home. It only plays videos that have been **intentionally uploaded and shared**. This is the same as sending a video via email — except now the whole family watches it together. There is no voyeurism, no real-time monitoring, no ability to check if someone's home.

The emotional frame is: *"We're watching our memories together,"* not *"We're watching each other."*

### 6.2 Invite-Only, Always

You cannot stumble into a Family TV channel. You cannot be added to one without your consent. Every member must receive an invitation, accept it, and can leave at any time.

### 6.3 Visible Authorship

Every video that plays shows who chose it. The "Chosen by: Grandma June" label is always visible. The family knows who initiated the current programming. No anonymous or system-initiated playback without transparency.

### 6.4 Solo Mode — The Escape Valve

Solo Mode is the most important trust feature. At any moment, for any reason, a viewer can tap "Watch Alone" and become independent of the sync. Their video continues, but nobody else's playback affects theirs, and their actions don't affect others.

Solo Mode is surfaced prominently with a yellow badge. When you're in Solo Mode, you're not "on the channel" for sync purposes — though you can rejoin at any time.

Solo Mode should feel like leaving the room to get snacks. It's normal, it's expected, and there's no judgment.

### 6.5 No Viewing Reports

Family TV does NOT show "who watched what and for how long" as a management dashboard. We don't want the channel to feel like a performance metric. Family members can see who's **currently watching** (presence), but after the session ends, there's no viewing history report.

The only exception: if you posted a video, you can see **view counts** (e.g., "Played 12 times, last viewed 2 days ago"). This respects the creator's curiosity about engagement without creating a surveillance tool.

---

## 7. Phased Rollout

### Phase 1: Single Family, Synchronized Playback (MVP)
**Goal:** Prove the core emotional promise — "watching together feels different."

Deliverables:
- One family channel, no sub-channels
- Synchronized play/pause/seek across all connected clients
- Basic "Now Playing" view with video title and chooser attribution
- Solo mode toggle
- Presence indicators (who's watching)
- WebSocket-based sync server
- Mobile-optimized player with tap-to-play/pause
- Web + iOS + Android

Success metric: Family beta users report "feels like we're together" in post-session survey.

### Phase 2: TV Guide / Schedule
**Goal:** Give the channel a sense of programming, not just on-demand playback.

Deliverables:
- Up Next queue (up to 10 items)
- "TV Guide" slide-up panel showing Now Playing + Up Next
- Automatic schedule generation from family video library
- "Goes on the air" toggle for new video posts (family admin setting)
- Notification when a new video hits the channel
- Channel-up/down gesture for sub-channel navigation (UI only, sub-channels come in Phase 3)
- Daily lineup refresh

Success metric: Average session duration >15 minutes, >3 videos watched per session.

### Phase 3: Multiple Channels / Channel Surf
**Goal:** Let families organize content into distinct programming blocks.

Deliverables:
- Up to 5 sub-channels per family (admin-created)
- Each channel has its own schedule, broadcaster, and queue
- Channel naming and callsign customization
- Channel subscriptions (opt in/out of specific sub-channels)
- "Channel surf" swipe navigation between subscribed channels
- Per-channel notification settings (e.g., "Notify me when anything goes on the Henderson Cousins channel")

Success metric: >40% of multi-household families create at least one sub-channel within 30 days.

### Phase 4: Picture-in-Picture
**Goal:** Make the channel ambient — always on, always accessible, never in the way.

Deliverables:
- PiP window (draggable, corner-positioned, expandable)
- PiP persists during navigation through all FamilyTV sections
- PiP audio muted by default, tap to unmute
- "Continue watching in PiP" prompt when navigating away from the TV screen
- Background playback (continue audio when phone is locked)
- Casting to TV (Chromecast, AirPlay) — video plays on the big screen, controls on the phone

Success metric: >25% of sessions include PiP usage; >15% include casting.

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Channel** | A continuous video stream scoped to a family or sub-group |
| **Callsign** | The name of the channel (e.g., "The Henderson Family Channel") |
| **Broadcaster** | The family member who chose the current video; their controls are authoritative |
| **Sync event** | A playback action (play/pause/seek/skip) that propagates to all viewers |
| **Live mode** | All viewers are at the same playback position simultaneously |
| **Catch-up mode** | A late viewer is watching from an earlier position than live |
| **Solo mode** | A viewer has disengaged from sync; their playback is local |
| **Up Next queue** | The list of videos scheduled to play after the current one |
| **Program Director** | The algorithmic (or manual) system that assembles the schedule |
| **PiP** | Picture-in-Picture — small persistent video window |

---

*Document version: 1.0 | Last updated: 2026-03-30 | Owner: Strategy / Product*
