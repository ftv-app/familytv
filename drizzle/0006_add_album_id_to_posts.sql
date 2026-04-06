-- Migration: Add album_id to posts for CTM-239
-- Associates media posts with albums

ALTER TABLE posts
  ADD COLUMN album_id UUID REFERENCES albums(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_album_idx ON posts(album_id);

COMMENT ON COLUMN posts.album_id IS 'Optional album association for media posts (CTM-239).';
