-- Migration: Add server-authoritative sync clock tables
-- CTM-223: Server-authoritative sync clock for FamilyTV
-- This enables all family members to see content in the same chronological order

-- ============================================
-- Family Sync States table
-- Tracks the authoritative sync state per family
-- ============================================
CREATE TABLE IF NOT EXISTS family_sync_states (
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    last_server_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    drift_ms INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (family_id)
);

CREATE INDEX IF NOT EXISTS family_sync_states_family_idx ON family_sync_states(family_id);

-- ============================================
-- Posts: Add server_timestamp column
-- This is the authoritative timestamp set by the server
-- Used for chronological ordering across all clients
-- ============================================
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index for efficient sync queries by server_timestamp
CREATE INDEX IF NOT EXISTS posts_server_timestamp_idx ON posts(family_id, server_timestamp);

-- ============================================
-- Backfill: Set server_timestamp = created_at for existing posts
-- This ensures existing posts have consistent ordering
-- ============================================
UPDATE posts
SET server_timestamp = created_at
WHERE server_timestamp IS NULL;

-- ============================================
-- Calendar Events: Add server_timestamp column
-- For consistent chronological ordering of events
-- ============================================
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS calendar_events_server_timestamp_idx ON calendar_events(family_id, server_timestamp);

-- Backfill existing calendar events
UPDATE calendar_events
SET server_timestamp = created_at
WHERE server_timestamp IS NULL;

COMMENT ON TABLE family_sync_states IS 'Tracks server-authoritative sync state per family for CTM-223 sync clock';
COMMENT ON COLUMN posts.server_timestamp IS 'Server-authoritative timestamp for chronological ordering. Set by server, not client.';
COMMENT ON COLUMN calendar_events.server_timestamp IS 'Server-authoritative timestamp for chronological ordering of events.';
