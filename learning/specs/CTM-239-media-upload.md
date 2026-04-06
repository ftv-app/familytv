# CTM-239: Media Upload

## Overview

FamilyTV uses Vercel Blob for storing media assets (photos and videos). Upload is handled server-side via `@vercel/blob` to ensure credentials are never exposed to the client. Uploads can optionally be associated with an album at creation time.

## Upload Flow

1. Client sends file + metadata via `multipart/form-data` to `POST /api/upload`
2. Server verifies user is a member of the target family
3. Server uploads the file to Vercel Blob under the path `{familyId}/{userId}/{timestamp}-{random}.{ext}`
4. Server optionally creates a `post` record linked to an album
5. Server returns the Blob URL to the client

## Storage Layout

```
{familyId}/
  {userId}/
    {timestamp}-{random}.{ext}
```

- `familyId` — namespace isolation per family
- `userId` — audit trail of who uploaded
- `timestamp-random` — collision-free unique filename
- Vercel Blob `access: "private"` — served only through `/api/media` proxy

## API

### `POST /api/upload`

Upload a media file to Vercel Blob and optionally create a post.

**Auth:** Requires family membership.

**Request:** `multipart/form-data`

| Field       | Required | Description                                     |
|-------------|----------|-------------------------------------------------|
| file        | Yes      | The binary file                                 |
| filename    | Yes      | Original filename (used only for extension)     |
| contentType | Yes      | MIME type (e.g. `image/jpeg`, `video/mp4`)      |
| familyId    | Yes      | Target family UUID                              |
| caption     | No       | Post caption                                    |
| albumId     | No       | Associate this upload with an existing album    |
| createAlbum | No       | Create a new album with this name if `albumId` not set |

**Behavior:**
- If `albumId` is provided, the album must belong to the target family
- If `createAlbum` is provided (string: album name) and `albumId` is absent, a new album is created first
- A `post` record is always created (type = `media`)
- If an `albumId` is set, the post is linked to that album

**Response (200 OK):**
```json
{
  "url": "https://...vercel-storage.com/...",
  "post": {
    "id": "uuid",
    "familyId": "uuid",
    "mediaUrl": "https://...vercel-storage.com/...",
    "caption": "Beach day!",
    "albumId": "uuid-or-null",
    "serverTimestamp": "2026-04-06T00:00:00Z"
  }
}
```

**Error responses:**
- `400` — missing required fields or invalid content type
- `401` — not authenticated
- `403` — not a member of the family
- `404` — `albumId` does not exist or belongs to another family
- `500` — Vercel Blob upload failed

**Allowed MIME types:**
```
image/jpeg, image/png, image/gif, image/webp, image/heic, image/heif
video/mp4, video/quicktime, video/webm, video/x-msvideo
```

Maximum file size: enforced by Vercel Blob (50 MB free tier, 4.5 TB pro).

---

### `GET /api/media?url=xxx`

Proxy a private Blob URL through authenticated request.

**Auth:** Requires valid session.

**Query params:**
| Param | Required | Description                    |
|-------|----------|--------------------------------|
| url   | Yes      | The private Blob URL           |

**Behavior:**
- Validates the URL is a Vercel Blob domain (`.vercel-storage.com`)
- Fetches the blob using `BLOB_READ_WRITE_TOKEN`
- Forwards the response with `Cache-Control: public, max-age=31536000, immutable`

**Error responses:**
- `400` — missing or invalid `url` param, wrong domain
- `401` — not authenticated
- `502` — upstream Blob fetch failed

---

### `GET /api/albums/:id/media`

List all posts (media items) in a specific album, most recent first.

**Auth:** Requires family membership matching the album's family.

**Response (200 OK):**
```json
{
  "media": [
    {
      "id": "uuid",
      "mediaUrl": "https://...",
      "caption": "Beach day!",
      "serverTimestamp": "2026-04-01T14:00:00Z",
      "authorName": "Dad"
    }
  ]
}
```

**Error responses:**
- `401` — not authenticated
- `403` — album belongs to a different family
- `404` — album not found

## Database Changes

### New `albumId` column on `posts`

```sql
ALTER TABLE posts
  ADD COLUMN album_id uuid REFERENCES albums(id) ON DELETE SET NULL;
CREATE INDEX posts_album_idx ON posts(album_id);
```

### `posts` relation update

`posts` relation already defined in schema; add `albumId` as a field and index.

## Implementation Notes

- The `BLOB_READ_WRITE_TOKEN` environment variable must be set in Vercel project settings
- Blob URLs are never returned as public links; always proxied through `/api/media`
- Upload key construction uses `crypto.randomUUID()` or equivalent for the random suffix
- No server-side image transformation (resize, compress) in this spec; deferred to future CTM
- Album membership is implicit: all family members can view/ upload to any family album
