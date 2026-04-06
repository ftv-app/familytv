-- Migration: 0005_add_tags_and_media_tags.sql
-- CTM-240: Tagging System
-- Creates tags and media_tags tables with case-insensitive unique constraint on (family_id, name)

-- ============================================
-- Tags table
-- Family-scoped labels for media categorization
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text DEFAULT '#6366f1' NOT NULL,
  created_by  text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for listing tags by family
CREATE INDEX IF NOT EXISTS tags_family_idx ON tags(family_id);

-- Case-insensitive unique constraint on family_id + name
-- Using a unique index on (family_id, lower(name)) for case-insensitive enforcement
CREATE UNIQUE INDEX IF NOT EXISTS tags_family_name_unique
ON tags(family_id, lower(name));

COMMENT ON TABLE tags IS 'Family-scoped labels for media categorization (CTM-240)';

-- ============================================
-- Media Tags join table
-- Many-to-many relationship between posts and tags
-- ============================================
CREATE TABLE IF NOT EXISTS media_tags (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for looking up tags by post
CREATE INDEX IF NOT EXISTS media_tags_post_idx ON media_tags(post_id);

-- Index for looking up posts by tag
CREATE INDEX IF NOT EXISTS media_tags_tag_idx ON media_tags(tag_id);

-- Unique constraint: a tag can only be applied once to a post
CREATE UNIQUE INDEX IF NOT EXISTS media_tags_post_tag_unique
ON media_tags(post_id, tag_id);

COMMENT ON TABLE media_tags IS 'Join table for posts and tags (CTM-240). Deleting a post or tag removes associations.';
