# FamilyTV Architecture — Family Invite Flow (CTM-205)

## Overview

The invite-only family join flow is FamilyTV's core privacy mechanism. It allows family admins to generate invite links that expire after 7 days and can be revoked at any time.

## Design Principles

1. **Security First**: Invite codes are never stored in plain text — only bcrypt hashes
2. **Admin-Controlled**: Only family admins (owner/admin roles) can create and revoke invites
3. **Self-Service Accept**: Any authenticated user with a valid invite code can join
4. **Rate-Limited**: Max 10 invite creations per family per day to prevent abuse
5. **Single-Use**: Each invite can only be accepted once (auto-revoked on accept)

## Database Schema

### `family_invites` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `family_id` | UUID | FK to families |
| `invite_code_hash` | TEXT | bcrypt hash of 32-char hex code |
| `created_by_user_id` | TEXT | Clerk userId of inviter |
| `expires_at` | TIMESTAMPTZ | When invite expires (7 days default) |
| `revoked_at` | TIMESTAMPTZ | NULL if active, timestamp if revoked |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `family_invite_rate_limits` Table

| Column | Type | Description |
|--------|------|-------------|
| `family_id` | UUID | FK to families (part of PK) |
| `created_date` | DATE | Day of invite creation (part of PK) |
| `invite_count` | INTEGER | Number of invites created that day |

## API Endpoints

### 1. Create Invite
```
POST /api/families/[familyId]/invites
Authorization: Bearer <clerk_token>
Role Required: admin or owner

Response 201:
{
  "inviteId": "uuid",
  "inviteLink": "https://familytv.vercel.app/invite/<32-char-hex>",
  "expiresAt": "2026-04-06T06:03:00.000Z",
  "familyName": "The Smiths"
}

Errors:
- 401: Unauthorized
- 403: Not an admin
- 429: Rate limit exceeded (10/day)
```

### 2. Validate Invite Code
```
GET /api/families/invites/[code]
Authorization: Optional (authenticated users get more info)

Response 200:
{
  "valid": true,
  "familyId": "uuid",
  "familyName": "The Smiths",
  "familyAvatarUrl": "https://...",
  "expiresAt": "2026-04-06T06:03:00.000Z"
}

Errors:
- 400: Invalid code format
- 404: Code not found
- 410: Expired or revoked
```

### 3. Accept Invite
```
POST /api/families/invites/[code]/accept
Authorization: Bearer <clerk_token>

Response 200:
{
  "success": true,
  "familyId": "uuid",
  "familyName": "The Smiths",
  "familyAvatarUrl": "https://...",
  "membershipId": "uuid"
}

Errors:
- 401: Unauthorized
- 404: Code not found
- 410: Expired or revoked
- 400: Already a member
```

### 4. Revoke Invite
```
DELETE /api/families/[familyId]/invites/[inviteId]
Authorization: Bearer <clerk_token>
Role Required: admin or owner

Response 200:
{
  "success": true,
  "message": "Invite revoked successfully"
}

Errors:
- 401: Unauthorized
- 403: Not an admin
- 404: Invite not found
- 400: Already revoked
```

## Security Considerations

### Invite Code Generation
- 32 characters of cryptographically random hex (256 bits of entropy)
- Hashed with bcrypt (cost factor 10) before storage
- Plain text code only exists in:
  - The invite link URL
  - The invite email sent to the invitee
  - The server console log (for development)

### Why bcrypt instead of SHA-256?
- bcrypt is a slow hash designed for password hashing
- Makes brute-force attacks computationally expensive
- Even if the database is compromised, plain text codes cannot be recovered

### Rate Limiting
- Tracked per family per day (midnight UTC)
- Stored in `family_invite_rate_limits` table
- Returns 429 status when exceeded

### Input Validation
- All UUIDs validated
- Invite codes must be exactly 32 hex characters
- No SQL injection (parameterized queries via Drizzle ORM)

## Email Integration

Currently logs invite link to console:
```
📧 Family Invite Created:
  Family: The Smiths (uuid)
  Invite Link: https://familytv.vercel.app/invite/abc123...
  Expires: 2026-04-06T06:03:00.000Z
  Created by: user_123
```

Future: Clerk's `sendEmail` or Resend API integration.

## Frontend Flow

1. **Admin creates invite**: POST to `/api/families/[familyId]/invites`
2. **Admin copies link**: Displayed in UI, can copy to clipboard
3. **Admin shares link**: Via email, text, etc.
4. **Invitee clicks link**: Navigates to `/invite/[code]`
5. **Invite validated**: GET `/api/families/invites/[code]`
6. **Invitee signs up/logs in**: Clerk authentication
7. **Invitee accepts**: POST `/api/families/invites/[code]/accept`
8. **Added to family**: Redirected to family feed

## Future Enhancements

- [ ] Email integration with Resend API
- [ ] Invite email templates
- [ ] Multiple invite management UI
- [ ] Invite expiration notifications
- [ ] Invite link QR codes

---

# FamilyTV Architecture — Server-Authoritative Sync Clock (CTM-223)

## Overview

The server-authoritative sync clock is FamilyTV's core moat feature. It ensures all family members see content in the same chronological order, regardless of their device clocks or network latency. This is critical for shared family experiences like watching videos together or viewing the family feed.

## Design Principles

1. **Server is the Source of Truth**: Client clocks are never trusted for content ordering
2. **ServerTimestamp on All Content**: Every post and event has a server-set timestamp
3. **Family-Scoped Sync State**: Each family has its own sync state to track what's been synced
4. **Delta Sync**: Clients request only new content since their last sync
5. **Drift Detection**: Client timestamps are validated and flagged if too far off

## Database Schema

### `family_sync_states` Table

Tracks per-family sync state for delta synchronization.

| Column | Type | Description |
|--------|------|-------------|
| `family_id` | UUID | Primary key, FK to families |
| `last_server_time` | TIMESTAMPTZ | Server's authoritative clock at last sync |
| `last_synced_at` | TIMESTAMPTZ | When family last synced |
| `drift_ms` | INTEGER | Known clock drift in milliseconds |
| `updated_at` | TIMESTAMPTZ | Auto-updated on row change |

### `posts.server_timestamp` Column

| Column | Type | Description |
|--------|------|-------------|
| `server_timestamp` | TIMESTAMPTZ | Server-authoritative timestamp for chronological ordering |

### `calendar_events.server_timestamp` Column

| Column | Type | Description |
|--------|------|-------------|
| `server_timestamp` | TIMESTAMPTZ | Server-authoritative timestamp for chronological ordering |

## API Endpoints

### 1. Get Sync Clock Info
```
GET /api/sync/clock?familyId=<uuid>
Authorization: Bearer <clerk_token>

Query Params:
- familyId (optional): If provided, returns family-specific sync state
- lastSyncedAt (optional): ISO timestamp of last sync for computing drift

Response 200 (global):
{
  "serverTime": 1743484500000,
  "iso": "2026-04-01T06:35:00.000Z",
  "offset": 0,
  "uptime": 1234567,
  "health": "OK"
}

Response 200 (family-specific):
{
  "familyId": "uuid",
  "lastServerTime": "2026-04-01T06:35:00.000Z",
  "lastSyncedAt": "2026-04-01T06:30:00.000Z",
  "driftMs": 0,
  "needsFullSync": false
}

Errors:
- 400: Invalid familyId format
- 401: Unauthorized
- 403: Not a member of this family
```

### 2. Sync Family Content Delta
```
POST /api/sync/clock/sync
Authorization: Bearer <clerk_token>
Rate Limit: 30 requests/minute per user

Body:
{
  "familyId": "uuid",
  "lastSyncedAt": "2026-04-01T06:30:00.000Z",
  "clientTimestamp": "2026-04-01T06:34:59.500Z", // Optional, for drift detection
  "limit": 50 // Optional, default 50, max 100
}

Response 200:
{
  "posts": [
    {
      "id": "uuid",
      "familyId": "uuid",
      "authorName": "Dad",
      "contentType": "image",
      "mediaUrl": "https://...",
      "caption": "Beach day!",
      "serverTimestamp": "2026-04-01T06:32:00.000Z",
      "createdAt": "2026-04-01T06:32:00.123Z"
    }
  ],
  "events": [
    {
      "id": "uuid",
      "familyId": "uuid",
      "title": "Family BBQ",
      "startDate": "2026-07-04T12:00:00.000Z",
      "serverTimestamp": "2026-04-01T06:31:00.000Z"
    }
  ],
  "serverTimestamp": "2026-04-01T06:35:00.000Z",
  "syncedAt": "2026-04-01T06:35:00.000Z",
  "hasMore": false,
  "rateLimit": {
    "remaining": 29,
    "resetAt": 1743484560000
  }
}

Errors:
- 400: Invalid request body
- 401: Unauthorized
- 403: Not a member of this family
- 429: Rate limit exceeded
```

## Client Synchronization Flow

1. **Initial Sync**: Client calls `GET /api/sync/clock?familyId=xxx` with no `lastSyncedAt`
   - Server returns `needsFullSync: true`
   - Client fetches all content via `POST /api/sync/clock/sync` with `lastSyncedAt: null`

2. **Incremental Sync**: Client calls `POST /api/sync/clock/sync` with `lastSyncedAt: <previous sync time>`
   - Server returns only posts and events where `serverTimestamp > lastSyncedAt`
   - Client merges delta into local state

3. **Drift Detection**: Client optionally sends `clientTimestamp` in sync request
   - Server calculates drift = clientTimestamp - serverTime
   - If drift > 5 seconds, client should show warning or adjust

## Key Implementation Details

### ServerTimestamp Generation
```typescript
// In POST /api/posts, serverTimestamp is set server-side
const [post] = await db
  .insert(posts)
  .values({
    familyId,
    authorId: userId,
    authorName,
    contentType,
    mediaUrl: mediaUrl || null,
    caption: caption || null,
    // serverTimestamp is auto-set by DEFAULT NOW() in schema
  })
  .returning();
```

### Consistent Ordering
Posts and events are always ordered by `serverTimestamp` (descending) to ensure all family members see the same order.

### Rate Limiting
Sync endpoint is rate-limited to 30 requests/minute per user to prevent abuse while allowing reasonable sync frequency on multiple devices.

## Security Considerations

- Family-scoped access control (can only sync families you're a member of)
- Input validation on all timestamps (reject timestamps too far in future/past)
- Rate limiting prevents sync abuse
- No PII exposed in sync responses

## Future Enhancements

- [ ] Redis-backed sync state for horizontal scaling
- [ ] Real-time sync via WebSocket for live TV watching
- [ ] Offline-first sync with conflict resolution
- [ ] Sync compression for slow connections
