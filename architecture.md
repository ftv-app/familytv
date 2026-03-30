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
