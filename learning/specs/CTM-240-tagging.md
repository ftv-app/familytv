# CTM-240: Tagging System

## Overview

FamilyTV supports family-scoped tagging of media items. Tags are lightweight labels created by family members to categorize, search, and organize their shared media. Tags live within a family boundary — no cross-family tag sharing.

## Data Model

### `tags` table

```sql
CREATE TABLE tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text DEFAULT '#6366f1',     -- hex color for UI display
  created_by  text NOT NULL,              -- Clerk userId
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT tags_family_name_unique UNIQUE (family_id, name)
);
CREATE INDEX tags_family_idx ON tags(family_id);
```

**Constraints:**
- `family_id + name` is unique per family (case-insensitive, trimmed)
- `name` max 64 chars, min 1 char after trim
- `color` must be a valid hex color string

### `media_tags` join table

```sql
CREATE TABLE media_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_by text NOT NULL,              -- Clerk userId
  created_at timestamptz DEFAULT now(),
  CONSTRAINT media_tags_post_tag_unique UNIQUE (post_id, tag_id)
);
CREATE INDEX media_tags_post_idx ON media_tags(post_id);
CREATE INDEX media_tags_tag_idx  ON media_tags(tag_id);
```

**Notes:**
- A post can have many tags; a tag can apply to many posts (many-to-many via join)
- Deleting a tag removes all its media associations
- Deleting a post removes its tag associations via `ON DELETE CASCADE`

## Relationships

```
families (1) ────< tags (family-scoped)
tags     (1) ────< media_tags
posts    (1) ────< media_tags
```

## API

### `GET /api/tags?familyId=xxx`

List all tags for a family (ordered by name).

**Auth:** Requires family membership.

**Query params:**
| Param    | Required | Description           |
|----------|----------|-----------------------|
| familyId | Yes      | Target family UUID    |

**Response (200 OK):**
```json
{
  "tags": [
    {
      "id": "uuid",
      "familyId": "uuid",
      "name": "Holidays",
      "color": "#6366f1",
      "createdBy": "user_xxx",
      "createdAt": "2026-04-01T12:00:00Z",
      "postCount": 5
    }
  ]
}
```

**Error responses:**
- `400` — missing `familyId`
- `401` — not authenticated
- `403` — not a member of the family

---

### `POST /api/tags`

Create a new tag for a family.

**Auth:** Requires family membership.

**Request body:**
```json
{
  "familyId": "uuid",
  "name": "Holidays",
  "color": "#22c55e"
}
```

**Validation:**
- `name`: required, 1–64 chars, trimmed, unique per family (case-insensitive)
- `color`: optional, defaults to `#6366f1`, must match `/^#[0-9a-fA-F]{6}$/`

**Response (201 Created):**
```json
{
  "tag": {
    "id": "uuid",
    "familyId": "uuid",
    "name": "Holidays",
    "color": "#22c55e",
    "createdBy": "user_xxx",
    "createdAt": "2026-04-06T00:00:00Z"
  }
}
```

**Error responses:**
- `400` — validation failure (missing fields, too long, invalid color, duplicate name)
- `401` — not authenticated
- `403` — not a member of the family

---

### `DELETE /api/tags/:id`

Delete a tag (removes all media associations).

**Auth:** Requires family membership matching the tag's `familyId`.

**Response (200 OK):**
```json
{ "deleted": true }
```

**Error responses:**
- `401` — not authenticated
- `403` — not a member of the tag's family
- `404` — tag not found

---

### `POST /api/media/:postId/tags`

Apply one or more tags to a post. Creates tags inline if they don't exist.

**Auth:** Requires family membership matching the post's `familyId`.

**Request body:**
```json
{
  "tags": [
    { "name": "Holidays" },
    { "name": "Beach", "color": "#f59e0b" }
  ]
}
```

**Behavior:**
- If a tag with the given `name` (case-insensitive) already exists in the family, it is reused
- If no tag with that name exists, it is created (with optional `color`, defaulting to `#6366f1`)
- Tags already applied to the post are silently ignored (idempotent)
- Returns the full list of tags now on the post

**Response (200 OK):**
```json
{
  "tags": [
    { "id": "uuid-1", "name": "Holidays", "color": "#6366f1" },
    { "id": "uuid-2", "name": "Beach", "color": "#f59e0b" }
  ]
}
```

**Error responses:**
- `400` — malformed request body
- `401` — not authenticated
- `403` — not a member of the post's family
- `404` — post not found

---

### `DELETE /api/media/:postId/tags/:tagId`

Remove a tag from a post.

**Auth:** Requires family membership matching the post's `familyId`.

**Response (200 OK):**
```json
{ "removed": true }
```

**Error responses:**
- `401` — not authenticated
- `403` — not a member of the post's family
- `404` — post or tag association not found

---

### `GET /api/tags/autocomplete?familyId=xxx&q=holi`

Autocomplete tag names for a family (for inline creation UX).

**Auth:** Requires family membership.

**Query params:**
| Param    | Required | Description              |
|----------|----------|--------------------------|
| familyId | Yes      | Target family UUID       |
| q        | Yes      | Search prefix (min 1 char) |

**Response (200 OK):**
```json
{
  "tags": [
    { "id": "uuid", "name": "Holidays", "color": "#6366f1" },
    { "id": "uuid", "name": "Halloween", "color": "#f97316" }
  ]
}
```

**Notes:**
- Results filtered by `name ILIKE 'holi%'` (case-insensitive prefix match)
- Max 10 results returned, ordered by name
- Matches scoped to the calling user's family

---

### `GET /api/posts?familyId=xxx&tagId=yyy`

Filter posts by tag (tag browse page support).

**Query params:**
| Param    | Required | Description              |
|----------|----------|--------------------------|
| familyId | Yes      | Target family UUID       |
| tagId    | No       | Filter to posts with this tag |
| cursor   | No       | Cursor-based pagination  |
| limit    | No       | Default 20, max 100      |

**Response (200 OK):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "familyId": "uuid",
      "authorName": "Dad",
      "mediaUrl": "https://...",
      "caption": "Beach day!",
      "serverTimestamp": "2026-04-01T14:00:00Z",
      "tags": [
        { "id": "uuid", "name": "Holidays", "color": "#6366f1" }
      ]
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

## UI Components

### Tag input (inline on media view)
- Text input with autocomplete dropdown
- Typing triggers `GET /api/tags/autocomplete?familyId=xxx&q=<input>`
- On Enter or comma: creates tag if not in autocomplete list, applies it
- On click of existing tag chip: removes it
- Enter submits the full tag list to `POST /api/media/:postId/tags`

### Tag chips
- Rounded pill with background `color` and white/dark text (auto contrast)
- "×" button to remove from current media item
- Clickable on browse page to filter

### Tag browse page (`/family/[familyId]/tags`)
- Grid of all family tags (name + color + post count)
- Click tag → filtered post feed
- "Create tag" button opens inline form
- Tag settings (rename / recolor / delete) via kebab menu

## Implementation Notes

- All tag operations are family-scoped; middleware must verify family membership before any DB query
- Tag name uniqueness is enforced at the DB level with a partial index or unique constraint on `(family_id, lower(name))`
- For autocomplete, use `drizzle-orm`'s `like()` / `ilike()` with a prepared statement for safety
- Tag colors are stored as hex strings; UI must handle contrast (white text for dark backgrounds, dark text for light)
- No server-side tag merging (users must manually reassign and delete duplicates)
- Pagination uses cursor-based pattern matching `posts.serverTimestamp` + `posts.id`
