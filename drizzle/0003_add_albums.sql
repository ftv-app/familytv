-- Migration: Add albums table for CTM-237
-- Albums are family-scoped photo/video collections

CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for listing albums by family
CREATE INDEX IF NOT EXISTS albums_family_idx ON albums(family_id);
-- Index for ordering albums by creation date within a family
CREATE INDEX IF NOT EXISTS albums_created_idx ON albums(family_id, created_at);

COMMENT ON TABLE albums IS 'Family-scoped photo/video albums (CTM-237). All family members can access albums via family_memberships.';
