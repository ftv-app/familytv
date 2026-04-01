-- Migration: Add watch party chat messages table
-- This table stores chat messages for watch party sessions
-- Messages are persisted to Neon Postgres and kept to the last 100 per session

CREATE TABLE IF NOT EXISTS watch_party_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for efficient message retrieval by session
CREATE INDEX IF NOT EXISTS idx_watch_party_session 
  ON watch_party_messages(family_id, session_id, created_at DESC);

-- Index for lookups when deleting old messages
CREATE INDEX IF NOT EXISTS idx_watch_party_cleanup 
  ON watch_party_messages(family_id, session_id, id);
