-- Migration: Add invite_code_lookup_hash column and index for O(1) invite validation
-- Issue: CTM-220

-- Add the lookup hash column (nullable initially)
ALTER TABLE "family_invites" ADD COLUMN "invite_code_lookup_hash" text;

-- Add the index for O(1) lookup
CREATE INDEX "family_invites_lookup_hash_idx" ON "family_invites" ("invite_code_lookup_hash") WHERE "invite_code_lookup_hash" IS NOT NULL;

-- Note: Existing invites cannot be backfilled because we don't have the original invite codes.
-- They will remain with NULL lookup_hash and will need to be re-created after this migration.
-- New invites will have proper lookup hashes set on insert.
