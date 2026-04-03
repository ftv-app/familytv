-- Family TV Synchronized Playback Schema
-- Phase 1 MVP: Single family channel, synchronized playback
-- Extends the existing FamilyTV schema (families, users, family_members)

-- ============================================
-- TV Sessions: Active synchronized playback sessions
-- ============================================
CREATE TABLE IF NOT EXISTS tv_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Which family this session belongs to
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

    -- Which video is currently playing
    video_id UUID NOT NULL, -- References posts(id) for video posts

    -- Who initiated this session / current broadcaster
    broadcaster_id UUID NOT NULL REFERENCES users(id),

    -- Playback state at session start
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    playback_position_seconds INTEGER NOT NULL DEFAULT 0,

    -- Is this session still active? (Sessions can be ended explicitly)
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Which channel number (1-5, for multi-channel families)
    channel_number INTEGER NOT NULL DEFAULT 1 CHECK (channel_number BETWEEN 1 AND 5),

    -- Server-side session clock for conflict resolution
    server_clock TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_sessions_family_id ON tv_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_tv_sessions_family_active ON tv_sessions(family_id, active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tv_sessions_broadcaster_id ON tv_sessions(broadcaster_id);

-- ============================================
-- TV Queue: Per-family video queue (Up Next)
-- ============================================
CREATE TABLE IF NOT EXISTS tv_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

    -- Which video is queued
    video_id UUID NOT NULL, -- References posts(id) for video posts

    -- Who added this video to the queue
    added_by_user_id UUID NOT NULL REFERENCES users(id),

    -- Position in the queue (1 = up next)
    position INTEGER NOT NULL CHECK (position >= 1),

    -- Channel number (which family channel this belongs to)
    channel_number INTEGER NOT NULL DEFAULT 1 CHECK (channel_number BETWEEN 1 AND 5),

    -- Source of the queue item: 'manual' (user-added) or 'algorithm' (auto-scheduled)
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'algorithm')),

    -- Soft-delete for "played" items (keep for history)
    played BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_queue_family_channel ON tv_queue(family_id, channel_number, played);
CREATE INDEX IF NOT EXISTS idx_tv_queue_position ON tv_queue(family_id, channel_number, position) WHERE played = FALSE;

-- ============================================
-- TV Sync Events: Play/pause/seek events for replay & audit
-- ============================================
CREATE TABLE IF NOT EXISTS tv_sync_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    session_id UUID NOT NULL REFERENCES tv_sessions(id) ON DELETE CASCADE,

    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

    -- Who triggered this event
    actor_id UUID NOT NULL REFERENCES users(id),

    -- Event type
    action VARCHAR(20) NOT NULL CHECK (action IN ('play', 'pause', 'seek', 'skip_forward', 'skip_back', 'video_change')),

    -- Playback position at the moment of the event (seconds from video start)
    playback_position_seconds INTEGER NOT NULL,

    -- Server timestamp for ordering and conflict resolution
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Video ID this event applies to (useful on video_change)
    video_id UUID NOT NULL,

    -- Optional: seek target (for seek events, the destination)
    seek_target_seconds INTEGER,

    -- Client timestamp (for latency measurement)
    client_timestamp TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tv_sync_events_session_id ON tv_sync_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tv_sync_events_family_id ON tv_sync_events(family_id);
CREATE INDEX IF NOT EXISTS idx_tv_sync_events_server_timestamp ON tv_sync_events(server_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tv_sync_events_video_id ON tv_sync_events(video_id);

-- ============================================
-- TV Presence: Active viewers in a session
-- (Companion to WebSocket connections for persistence across reconnects)
-- ============================================
CREATE TABLE IF NOT EXISTS tv_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    session_id UUID NOT NULL REFERENCES tv_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL REFERENCES users(id),

    -- Solo mode: viewer has disengaged from sync
    solo_mode BOOLEAN NOT NULL DEFAULT FALSE,

    -- Last heartbeat received
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- When the viewer joined this session
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Device info (optional, for multi-device awareness)
    device_info VARCHAR(255),

    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tv_presence_session_id ON tv_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_tv_presence_user_id ON tv_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_presence_heartbeat ON tv_presence(last_heartbeat_at);

-- ============================================
-- Helper function: get active session for a family
-- ============================================
CREATE OR REPLACE FUNCTION get_active_tv_session(p_family_id UUID)
RETURNS SETOF tv_sessions AS $$
    SELECT * FROM tv_sessions
    WHERE family_id = p_family_id AND active = TRUE
    ORDER BY started_at DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Helper function: get current queue for a family channel
-- ============================================
CREATE OR REPLACE FUNCTION get_tv_queue(p_family_id UUID, p_channel_number INTEGER DEFAULT 1)
RETURNS SETOF tv_queue AS $$
    SELECT * FROM tv_queue
    WHERE family_id = p_family_id
      AND channel_number = p_channel_number
      AND played = FALSE
    ORDER BY position ASC;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Helper function: advance queue (mark top item played, reorder)
-- ============================================
CREATE OR REPLACE FUNCTION advance_tv_queue(p_family_id UUID, p_channel_number INTEGER DEFAULT 1)
RETURNS SETOF tv_queue AS $$
DECLARE
    top_item_id UUID;
BEGIN
    -- Mark the current top item as played
    UPDATE tv_queue
    SET played = TRUE
    WHERE id = (
        SELECT id FROM tv_queue
        WHERE family_id = p_family_id AND channel_number = p_channel_number AND played = FALSE
        ORDER BY position ASC
        LIMIT 1
    );

    -- Compact positions: shift everything up
    WITH reordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_position
        FROM tv_queue
        WHERE family_id = p_family_id AND channel_number = p_channel_number AND played = FALSE
    )
    UPDATE tv_queue q
    SET position = r.new_position
    FROM reordered r
    WHERE q.id = r.id;

    -- Return updated queue
    RETURN QUERY
    SELECT * FROM tv_queue
    WHERE family_id = p_family_id AND channel_number = p_channel_number AND played = FALSE
    ORDER BY position ASC;
END;
$$ LANGUAGE plpgsql;
