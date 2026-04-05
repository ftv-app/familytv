-- Migration: 0004_add_users.sql
-- Cache user names from Clerk to avoid 'Member 1' issue in dashboard
-- Stores minimal user data synced from Clerk on first auth or membership creation

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "clerk_id" text UNIQUE NOT NULL,  -- Clerk user ID
  "first_name" text,
  "last_name" text,
  "email" text,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL
);

-- Index for fast lookup by clerk_id
CREATE INDEX IF NOT EXISTS "users_clerk_id_idx" ON "users" ("clerk_id");
