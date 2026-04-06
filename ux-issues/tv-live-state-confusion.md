**Severity:** P2 — UX / Confusion

**Description:**
The TV page player UI shows logically conflicting temporal indicators simultaneously:
- "LIVE" badge (top right)
- Progress bar at 0:00 / 9:56 (fully at start)
- Skip +10s button enabled (forward into a live stream?)

This creates cognitive dissonance: if it's LIVE, you can't skip forward. If the progress bar is at 0:00, it looks like the video hasn't started.

**Root cause:**
The player controls UI doesn't correctly reflect the playback state for a LIVE stream. For live content:
- "LIVE" badge is correct
- Progress bar should show current position (not 0:00)
- Skip forward may be disabled or show "Live" tooltip
- Or: if it's a scheduled replay, the "LIVE" badge should be removed

**Fix:**
1. For LIVE streams: show a "Live" progress indicator (pulsing dot, not a scrubber at 0:00)
2. Disable or explain the skip buttons during live playback
3. If it's a replay/VOD: remove the "LIVE" badge
4. Verify the temporal state matches the UI (LIVE = real-time, no seeking)

**Screenshot:** see workspace: tv_page.png

**Labels:** bug, P2, UX
