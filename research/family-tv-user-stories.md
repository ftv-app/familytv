# Family TV — User Stories for Sync Playback Feature

*Last updated: 2026-03-30 | Researcher: sub-agent*
*Based on: family-tv-prd.md (v1.0)*

---

## Overview

These user stories cover the Family TV synchronized playback feature. They follow the format: **"As a [family member], I want [action], so that [benefit]."** Each story maps to a specific workflow in the Family TV PRD.

---

## User Story 1: Joining a Session

> **As a** grandmother in Ohio with a tablet,
> **I want to** open Family TV and have it automatically join the family channel,
> **so that** I can watch whatever my grandkids uploaded without needing to navigate, select, or figure anything out — just like turning on the TV and it's already on.

### Acceptance Criteria
- [ ] Opening Family TV app or navigating to the TV tab immediately shows the "channel" in its current state (video playing or paused)
- [ ] No onboarding, login, or "choose what to watch" step required — the channel is the home screen
- [ ] A visible banner shows who else is currently watching: "Sarah and Mike are watching now"
- [ ] If the channel is playing, video starts immediately on join
- [ ] If the channel is paused, video shows the paused frame with a prominent "Play" button
- [ ] Late joiners (>5 minutes into a video) see: "The Hendersons started watching X minutes ago — [Join Live] or [Watch from here]"
- [ ] First-time visitors from outside the family are blocked with a "Request Invitation" screen

### Design Notes
- This is the "TV on" experience — it should feel like ambient, passive engagement is always available
- Presence indicators (who's watching) reinforce the "together" emotional core
- The "Join Live" vs "Watch from here" choice respects both the synced experience and individual pace

---

## User Story 2: Leaving a Session (Solo Mode)

> **As a** dad cooking dinner while the family watches,
> **I want to** temporarily pause my sync without leaving the channel,
> **so that** I can catch up on the video during a commercial break while still being part of the family TV experience, and rejoin when I'm back.

### Acceptance Criteria
- [ ] A single prominent button labeled "Watch Alone" (or "Solo Mode") is visible during playback
- [ ] Activating Solo Mode immediately disengages the viewer from sync — their playback becomes local
- [ ] A yellow "Solo Mode" badge appears and persists in the corner of the player
- [ ] In Solo Mode, the viewer's actions (play/pause/seek) do NOT propagate to other family members
- [ ] Other family members' playback does NOT affect the Solo Mode viewer's video
- [ ] Solo Mode viewers still appear in the channel's presence list (with the yellow badge) so others know they're still "there" but watching independently
- [ ] Tapping "Rejoin" resynchronizes the viewer to the live playback moment with one tap
- [ ] Leaving the TV tab or closing the app from Solo Mode leaves the channel (presence removed after 30s timeout)

### Design Notes
- Solo Mode is the "escape valve" — it must be always accessible, never hidden in a menu
- The yellow badge ensures transparency: no one wonders "is Grandma still watching?"
- Rejoin should be frictionless — one tap, no confirmation dialog
- Solo Mode respects the emotional contract: you're still part of the family channel, just at your own pace

---

## User Story 3: Skipping a Video

> **As a** uncle who thinks the kids have watched the same soccer highlight fifteen times,
> **I want to** vote to skip the current video or advance to the next one in the queue,
> **so that** the family channel doesn't get stuck playing the same content while everyone politely endures it.

### Acceptance Criteria
- [ ] A "Skip" or "Next" button is visible to all family members watching
- [ ] Tapping Skip registers the current viewer's vote
- [ ] The UI shows vote progress: "2 of 4 votes — need 1 more to skip"
- [ ] Majority rules: if more than 50% of active viewers vote, the channel advances to the next item in the Up Next queue
- [ ] The broadcaster (person who chose the current video) cannot be skip-voted — their choice is respected for the full video duration (they can voluntarily hand over the remote)
- [ ] If the video ends naturally (plays to completion), the channel auto-advances to the next queue item
- [ ] After a skip, a toast confirms: "Skipped to: [Next Video Title]"
- [ ] Skip votes reset when a new video starts

### Design Notes
- Majority voting (not unanimous) prevents one stubborn viewer from blocking the group
- Broadcaster immunity on their own video choice respects authorship — Grandma chose this video, she shouldn't be skip-voted mid-clip
- Vote progress should be subtle (not intrusive) — the current video remains the focus
- Consider a "Skip in 10 seconds" auto-skip option for testing: after 3 consecutive skip votes, auto-skip in 10 seconds unless someone objects

---

## User Story 4: Solo Mode (Independent Viewing)

> **As a** teenager who wants to watch something on their own while the family channel plays something else for the parents,
> **I want to** claim my own independent playback without disrupting the family channel,
> **so that** I can use Family TV for my own viewing without losing access to the family content library or leaving the family altogether.

### Acceptance Criteria
- [ ] A "Watch Solo" or "My Library" toggle exists alongside the channel view
- [ ] Activating Solo Library mode shows the family's full video library (not just what's on the channel)
- [ ] The family channel continues playing for other members; the solo viewer's presence badge changes from "watching" to "browsing library"
- [ ] Videos watched in Solo Library mode do NOT get added to the family channel queue unless explicitly "Add to Queue" is tapped
- [ ] The viewer can switch back to the live family channel at any time with a single tap ("Return to Channel")
- [ ] Solo Library playback is not synced with anyone — full local control (play, pause, seek, full library browse)
- [ ] View counts on videos only update when a video plays in the family channel (not in solo mode)

### Design Notes
- This story extends Solo Mode to a full library-browse experience — distinct from temporary disengagement
- Family TV's differentiation is the "TV first, library second" hierarchy — you always see the channel, but you can also browse independently
- No viewing history is tracked for solo mode — respects privacy and avoids the "performance metric" feel the PRD explicitly warns against
- The "Add to Queue" option lets solo viewers participate in curation without having to watch in sync

---

## User Story 5: Scheduling a Session (Appointment TV)

> **As a** mom who wants to make sure the whole family catches the birthday video on Grandma's actual birthday,
> **I want to** schedule a Family TV session for a specific time,
> **so that** family members receive a reminder and the channel automatically plays the scheduled video at that moment — creating an "appointment TV" moment even across time zones.

### Acceptance Criteria
- [ ] Any family member can "Schedule a Viewing" from the video's detail page or from the TV Guide
- [ ] Scheduling requires: selecting a video (or set of videos), a date, a time, and an optional message (e.g., "Birthday celebration at 7pm!")
- [ ] The scheduled session appears in the Up Next queue with a clock icon and scheduled time
- [ ] All family members receive a notification: "[Your Name] scheduled '[Video Title]' for [Date] at [Time] — [Message]"
- [ ] At the scheduled time, the Family TV channel automatically switches to the scheduled video (if the channel is idle or playing something else)
- [ ] If the channel is already live with an active broadcaster, the scheduled video goes to the front of the Up Next queue and plays when the current video ends
- [ ] Scheduled sessions can be edited or cancelled by the scheduler or any family admin
- [ ] Time zone is handled automatically: "7pm" means 7pm in each viewer's local time zone
- [ ] Family admins can enable/disable auto-play for scheduled sessions in family settings

### Design Notes
- Scheduling creates "appointment value" — the core emotional differentiator over passive cloud storage
- Notifications should be sent 24 hours before and 1 hour before the scheduled session
- Time zone handling is critical — the PRD specifies UTC canonical time with local rendering
- "Auto-switch" vs "queue" behavior is configurable by family admin — some families may prefer the channel not to interrupt active viewing
- Scheduling should feel like "programming the DVR" not "scheduling a meeting" — casual, not calendar-intensive

---

## Cross-Cutting Concerns (All Stories)

### Notifications
- All story triggers that involve other family members (someone joins, someone schedules a session, someone posts a new video) generate a notification
- Notification preferences are per-family-member (email, push, in-app, or off)
- Notifications never reveal video content to non-family members

### Presence & Privacy
- A family member's presence (watching, browsing, solo) is visible only to other family members
- No presence data is stored persistently — only current-state snapshot while connected
- A viewer can be in Solo Mode and still appear as "watching" (with badge) — presence ≠ synced

### Error States
- Connection loss: persistent yellow "Reconnecting..." banner; auto-retry every 5 seconds
- Reconnect >10s drift: "The channel has moved — [Join Live] or [Watch from here]"
- Reconnect >5min offline: treated as new viewer; start from beginning with catch-up offer
- Broadcaster disconnects: next eligible family member can claim the remote automatically

### Accessibility
- All buttons: minimum 48px tap targets (mobile-first)
- VoiceOver/TalkBack labels for all interactive elements
- Closed captions/subtitles supported for all family videos (leveraging existing video metadata or manual upload)
- Color contrast: Velvet Red (#C41E3A) on Deep Cinema Black (#0D0D0F) passes WCAG AA for large text and icon buttons

---

*Stories derived from: family-tv-prd.md Section 3 (Core Mechanics) and Section 4 (Interface Design)*
