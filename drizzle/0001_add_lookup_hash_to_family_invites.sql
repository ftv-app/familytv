-- Migration: Add lookup_hash column to family_invites for O(1) invite validation
-- This enables indexed lookups instead of iterating through all active invites

-- Add the lookup_hash column with a unique index for fast lookups
ALTER TABLE family_invites
ADD COLUMN IF NOT EXISTS lookup_hash TEXT NOT NULL DEFAULT '';

-- Create unique index for O(1) lookup queries
-- This index will be used by the invite validation query
CREATE UNIQUE INDEX IF NOT EXISTS family_invites_lookup_hash_idx
ON family_invites(lookup_hash)
WHERE lookup_hash != '';

-- Backfill existing invites with SHA-256 of their code (they don't exist, so this is a no-op for prod)
-- In production, existing invites were created with bcrypt and can't be reversed to get the original code
-- The lookup_hash column will be populated on next invite creation

COMMENT ON COLUMN family_invites.lookup_hash IS 'SHA-256 hash of invite code for O(1) database lookups. Stored separately from bcrypt hash.';
