# FamilyTV Security Review — STRIDE Threat Model

**Review Date:** 2026-03-30  
**Reviewer:** Security Architect  
**Document Version:** 1.0  
**Status:** ACTIVE — Critical and High findings require immediate remediation before launch  

---

## Executive Summary

FamilyTV has a solid privacy architecture foundation — family-scoped data queries, Clerk auth, invite-only membership. However, there are **critical security gaps** that must be fixed before launch, particularly in the comments/reactions API (no family membership check), PII leakage via console logs, and the plaintext invite token returned by the legacy `/api/invite` route. The WebSocket sync layer described in the PRD has not been implemented yet, but the protocol design contains a critical authentication flaw that must be addressed before implementation.

**Risk Triage:**
- 🔴 Critical: 4 findings
- 🟠 High: 5 findings
- 🟡 Medium: 4 findings
- 🟢 Low: 3 findings

---

## 1. WebSocket Sync Attack Surface

> **STATUS: NOT YET IMPLEMENTED.** The PRD (Section 5.1) describes a WebSocket sync protocol, but no WebSocket server or client implementation exists in the codebase. This section documents forward-looking threat modeling for when the sync layer is built.

### Protocol Design (from PRD Section 5.1)

The sync server receives two message types:

```typescript
// Playback state events
{ type: "playback", action: "play|pause|seek|skip", timestamp: ISO8601, broadcaster: userId, videoId: string, playbackPosition: seconds }

// Presence heartbeats
{ type: "presence", userId: string, channelId: string, online: boolean, soloMode: boolean }
```

### 🔴 CRITICAL: Broadcaster Impersonation via Client-Provided `broadcaster` Field

The playback event schema includes `broadcaster: userId` as a field the **client provides**. The server fans out events to all connected clients without verifying that the `broadcaster` field matches the authenticated WebSocket connection's user identity.

**Attack:** A malicious family member A connects to the sync WebSocket, then sends:
```json
{ "type": "playback", "action": "pause", "broadcaster": "userId-of-B", "videoId": "...", "playbackPosition": 0, "timestamp": "..." }
```

All other family members receive this and their players pause, believing user B (Grandma June) initiated it. This is a **complete break** of the "visible authorship" trust property (PRD Section 6.3).

**Fix Required:** The server MUST stamp the authenticated `userId` from the WebSocket connection's auth session — not accept it from the client payload. Every broadcast event must carry the server-verified user identity, not a client-provided one.

### 🟠 HIGH: No WebSocket Authentication Handshake

There is no documented WebSocket auth flow. If the sync server uses cookie-based Clerk auth, the WebSocket upgrade request must validate the session. If tokens are passed as query params, they are vulnerable to log leakage (URL logs).

**Fix Required:** Use Clerk's WebSocket auth middleware. Pass the session token in the `Sec-WebSocket-Protocol` header or a proper WS handshake with a signed token. Never pass auth tokens in URL query strings.

### 🟠 HIGH: No Sync Event Rate Limiting

A malicious family member could flood the sync server with thousands of fake playback events per second. Each event would be fan-out to all connected family members (< 500ms latency target), creating amplification: 1 attacker × N family members = N× traffic amplification.

**Fix Required:** Per-user rate limiting on sync events (e.g., max 10 playback events per second per user). Server-side throttle.

### 🟠 HIGH: WebRTC Media Delivery Privacy

The PRD states "WebRTC (direct peer-to-peer) with TURN relay fallback" for video streaming. WebRTC ICE candidates can leak a user's internal IP address to the peer. For families behind CG-NAT or corporate firewalls, the TURN relay (if hosted on AWS/Vercel) sees all media traffic.

**Fix Required:** Document the WebRTC topology clearly. If TURN is hosted by FamilyTV, the TURN server will see all media — this must be disclosed and a privacy policy note added. Consider SFU (Selective Forwarding Unit) instead of full mesh WebRTC for multi-viewer sessions.

### 🟡 MEDIUM: No Replay Attack Prevention

A valid sync event captured from the network could be replayed by an attacker to force the entire family back to an earlier playback position. The event carries `timestamp: ISO8601` but there is no sequence number or event ID to detect duplicates.

**Fix Required:** Add monotonically increasing event sequence numbers. Server rejects events with sequence numbers ≤ the last processed sequence for that channel.

### 🟢 LOW: Presence Spoofing

A user could set `soloMode: true` in a presence heartbeat while actually being in live mode, causing the UI to show a misleading state to other family members.

**Fix Required:** Server derives `soloMode` from whether the user is actively consuming sync events — not from client declaration.

---

## 2. Invite Flow Security

### 🔴 CRITICAL: Legacy `/api/invite` Route Returns Plaintext Invite Token

**File:** `src/app/api/invite/route.ts`

The POST handler returns the raw invite token in the response body:
```typescript
return NextResponse.json({
  inviteLink: `/invite/${token}`,  // ← PLAINTEXT TOKEN EXPOSED
  expiresAt: expiresAt.toISOString(),
}, { status: 201 });
```

This token is the proof of invitation. Returning it in the API response means:
1. The token appears in Vercel function logs (which are stored and could be accessed by anyone with Vercel access)
2. The token appears in browser DevTools network tab for anyone inspecting the response
3. Any man-in-the-middle at the network layer can capture the invite link

**Severity:** CRITICAL — This completely undermines the invite token security model.

**Fix Required:** Never return the plaintext token. The invite token should only exist as a hash in the database. The invite link should be constructed client-side from a non-sensitive invite identifier (e.g., the `invites.id` UUID, which is not secret), with the actual token delivered via email only.

### 🟡 MEDIUM: Legacy Invite Route Missing Rate Limiting

**File:** `src/app/api/invite/route.ts`

The legacy invite route has no rate limiting whatsoever. An attacker with a valid family membership could spam invite creation. (The newer route at `/api/families/[familyId]/invites` has rate limiting — the legacy route should be deprecated or brought to feature parity.)

### 🟡 MEDIUM: bcrypt Cost Factor 10 Is Below OWASP Recommended Minimum

**File:** `src/app/api/families/invites/route.ts`

```typescript
const BCRYPT_ROUNDS = 10;
```

OWASP recommends a cost factor of **at least 12** as of 2025. Cost factor 10 is vulnerable to GPU-accelerated brute forcing (~65k guesses/second per GPU).

**Fix Required:** Increase to cost factor 12 or 14.

### 🟡 MEDIUM: Invite Validation Loads ALL Active Invites Into Memory

**File:** `src/app/api/families/invites/[code]/route.ts`

```typescript
const activeInvites = await db.query.familyInvites.findMany({
  where: and(isNull(familyInvites.revokedAt), ...),
  with: { family: true },
});
// Then iterates over ALL invites comparing bcrypt hashes
for (const invite of activeInvites) {
  const isValid = await bcrypt.compare(code, invite.inviteCodeHash);
```

This fetches **every active (non-revoked) invite in the entire system** into application memory, then runs bcrypt comparison against each one. At 10,000 active invites, this is O(n) bcrypt operations per validation attempt.

**Fix Required:** Store a SHA-256 lookup hash (not bcrypt) alongside the bcrypt hash. Use the lookup hash for indexed database query, then verify with bcrypt. Or use a proper constant-time comparison with a HMAC-based approach.

### 🟢 LOW: No Email Verification on Invite Acceptance

An invite is addressed to `email@example.com`, but acceptance only requires a valid Clerk session — not proof that the accepter controls the target email address. Someone who intercepts the invite link and has a Clerk account could accept it before the intended recipient.

**Fix Required:** Verify the accepting user's email matches the invite's email address before creating membership.

### 🟢 LOW: No Invite Expiry Enforcement at Database Level

The `invites` and `familyInvites` tables have no `CHECK` constraint enforcing `expires_at > created_at`. Expiry is only enforced in application code. A database backup restore could reset expiry logic.

---

## 3. Family-Scoped Data Enforcement

### 🔴 CRITICAL: Comments API Has No Family Membership Check

**File:** `src/app/api/comments/route.ts`

The GET, POST, and DELETE handlers for comments check Clerk auth but **never verify the comment's post belongs to a family the user is a member of:**

```typescript
// GET /api/comments?postId=xxx — NO family membership check
const result = await db.query.comments.findMany({
  where: eq(comments.postId, postId),  // Anyone who knows a postId can read its comments
});
```

```typescript
// DELETE /api/comments?id=xxx — only checks authorId, not family membership
await db.delete(comments).where(
  and(eq(comments.id, id), eq(comments.authorId, userId))
);  // A user could delete any comment if they guess the ID
```

**Impact:** Any authenticated FamilyTV user can read, create, or delete comments on any post in the entire system by guessing a postId or commentId. This is a **total bypass of family data isolation**.

**Fix Required:** Every comments query must join through the `posts` table to verify `posts.familyId` matches a family the user is a member of. Add `familyMemberships` check to every handler.

### 🔴 CRITICAL: Reactions API Has No Family Membership Check

**File:** `src/app/api/reactions/route.ts`

Same vulnerability as comments — the reaction queries only check `postId` without verifying the user's family membership:

```typescript
// GET /api/reactions?postId=xxx — NO family check
const result = await db
  .select({ emoji: reactions.emoji, count: sql`count(*)` })
  .from(reactions)
  .where(eq(reactions.postId, postId))  // Exposes reactions across ALL families
  .groupBy(reactions.emoji);
```

**Impact:** Any authenticated user can enumerate reactions on any post in the system.

**Fix Required:** Add family membership join through `posts` table.

### 🟠 HIGH: Notifications API Returns User Emails

**File:** `src/app/api/notifications/route.ts`

```typescript
const [dbUser] = await upsertUser(
  user.id,
  user.emailAddresses[0]?.emailAddress ?? '',  // ← Email stored and used as identifier
  user.fullName ?? user.firstName ?? null
);
const notifications = await getNotificationsByUserId(dbUser.id);
```

The `dbUser` is identified by internal DB ID (not Clerk ID). This is good. However, the notifications query does not have a family membership check — it only checks the user's Clerk session. Notifications may contain message content that includes family-specific context (e.g., "Sarah added a video to your family channel").

If the `notifications` table or query ever returns `user_email` from a join, this would expose emails across families.

**Fix Required:** Audit the notifications query to ensure no cross-family email leakage. Add family membership scoping to notification queries.

### 🟢 LOW: Posts API Returns `authorName` But Strips `authorId`

**File:** `src/app/api/posts/route.ts`

The GET handler strips `authorId` from responses (good), but returns `authorName` which is a display name (e.g., "Grandma June"). This is acceptable — it's a family-visible name, not a system identifier.

However, the Drizzle ORM query for posts does NOT strip `authorId` from the response at the DB query level — the map happens in application code:
```typescript
const postsWithoutSensitiveId = allPosts.map(({ authorId: _authorId, ...rest }) => rest);
```

If the map is accidentally removed or the query changes, `authorId` (the Clerk user ID) would be returned. No DB-level column exclusion is in place.

**Fix Required:** Use explicit column selection in the Drizzle query rather than relying on a runtime map to strip fields.

### ✅ Good: Events, Posts, Upload APIs Correctly Check Family Membership

The following routes correctly enforce `familyMemberships` checks:
- `GET/POST /api/events` ✅
- `GET/POST /api/posts` ✅
- `POST /api/upload` ✅
- `POST/DELETE /api/families/[familyId]/invites/[inviteId]` ✅
- `GET /api/families/invites/[code]` ✅
- `POST /api/families/[familyId]/invites` ✅

---

## 4. Privacy Analysis

### 🟠 HIGH: `console.log` Leaks Invite Links, Family Names, and User IDs

**Files:** 
- `src/app/api/families/[familyId]/invites/route.ts`
- Error boundary in `src/components/error-boundary.tsx`

In the invite creation route:
```typescript
console.log(`📧 Family Invite Created:
  Family: ${family?.name} (${familyId})
  Invite Link: ${inviteLink}          // ← Full invite link with token!
  Expires: ${expiresAt.toISOString()}
  Created by: ${userId}               // ← Clerk userId
`);
```

Vercel function logs capture `console.log` output and store it in Vercel's log infrastructure. Any person with Vercel dashboard access can see:
1. The full invite link (including the plaintext invite token — see Section 2)
2. The family name and ID
3. The inviter's Clerk userId

**Fix Required:** Remove all `console.log` statements that include invite links, userIds, family names, or any PII. Replace with structured anonymous metrics (e.g., `{ event: "invite_created", familyId: hash(familyId) }`).

### 🟠 HIGH: Error Boundary Logs Stack Traces with Potential PII

**File:** `src/components/error-boundary.tsx`

```typescript
console.error(
  JSON.stringify({
    type: "UNCAUGHT_ERROR",
    message: error.message,      // Could contain PII from error contexts
    stack: error.stack,           // File paths, variable names
    componentStack: errorInfo.componentStack,
    timestamp: new Date.toISOString(),
  })
);
```

Client-side errors with `error.message` could contain user-generated content (e.g., "Failed to load video: {userEnteredUrl}"). Stack traces reveal internal code structure.

**Fix Required:** Do not log raw `error.message` or `error.stack` to console. Sanitize or hash any user-provided values before logging. Consider using Sentry with PII scrubbing enabled rather than raw console.error.

### 🟡 MEDIUM: No Sentry/Axiom Configuration Found

No Sentry SDK initialization, no Axiom logging client, and no structured logging utility was found in the codebase. This means:
1. There is **no centralized error tracking** — errors are only visible in Vercel function logs
2. There is **no log sampling or PII filtering** infrastructure
3. There is **no crash reporting** for client-side errors beyond the basic error boundary

**Recommendation:** Configure Sentry with:
- `setTag("family", "scrubbed")` (never log actual family IDs in plain text)
- `beforeSend` hook to filter PII from error messages
- Dedupe similar errors
- Sample high-volume routes (e.g., media uploads)

### 🟡 MEDIUM: Author Name Returned in Multiple API Responses

`authorName` (display name, e.g., "Grandma June") is returned in:
- `GET /api/posts` — in the post object
- `POST /api/comments` — returns the created comment with `authorName`
- `GET /api/comments` — returns all comments with `authorName`

This is acceptable within a family (family members should see each other's names). However, if the Comments/Reactions bug (Section 3) allows cross-family access, this would leak family member names to outsiders.

**Fix:** Fixing the family membership check in comments/reactions (Section 3) also resolves this exposure.

### 🟢 LOW: Email Address Used as Membership Identifier in Legacy Code

**File:** `src/app/api/invite/route.ts`

```typescript
// TODO: Clerk userId, not email
eq(familyMemberships.userId, email)  // ← Comparing Clerk userId to an email string
```

This TODO acknowledges a bug — the code compares the Clerk user ID (a UUID) against an email address. This comparison would always fail, meaning the "already a member" check is dead code. This should be fixed, though in practice it means users could receive multiple invites to the same family (they'd create duplicate memberships on acceptance).

---

## 5. STRIDE Threat Model

### S — Spoofing

**Question:** How could someone impersonate a family member in a TV session?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Impersonate broadcaster identity in WebSocket sync events (client provides `broadcaster: userId`) | HIGH (when WS implemented) | CRITICAL | 🔴 Not yet fixed — design flaw in PRD |
| Intercept invite link and accept it before the real recipient (no email verification) | MEDIUM | HIGH | 🟡 Not fixed |
| A user creates multiple Clerk accounts to join the same family multiple times | LOW | MEDIUM | 🟢 N/A (Clerk handles account uniqueness; rate limiting on invites helps) |

### T — Tampering

**Question:** Could fake sync events be injected?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Inject fake play/pause/seek events via WebSocket (client-controlled broadcaster field) | HIGH (when WS implemented) | CRITICAL | 🔴 Not yet fixed |
| Modify their own playback position to de-sync from the family (solo mode spoofing) | MEDIUM | LOW | 🟡 MEDIUM — Server should derive soloMode from event consumption |
| Tamper with comments/reactions by modifying postId in requests | **CRITICAL** | **HIGH** | 🔴 CRITICAL — No family check in comments/reactions |
| Race condition in invite acceptance creating duplicate memberships | LOW | LOW | 🟢 Acceptable |

### R — Repudiation

**Question:** Are sync events logged with user attribution?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| No audit log for who triggered sync events | N/A (WS not built) | HIGH | 🟠 Design gap — must be addressed in WS spec |
| No activity log for family membership changes | N/A | MEDIUM | 🟡 `logActivity()` function exists but is not called on membership changes |
| Invite creation/acceptance not logged with sufficient attribution | MEDIUM | MEDIUM | 🟡 Invite creation logs userId but invite acceptance does not call logActivity |

### I — Information Disclosure

**Question:** Does sync expose session data to other families?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| **Comments and reactions API returns data from ALL families** (no family check) | **CRITICAL** | **CRITICAL** | 🔴 CRITICAL — Must fix before launch |
| Invite links appear in Vercel function logs (plaintext token) | HIGH | CRITICAL | 🔴 CRITICAL — Must fix before launch |
| Author name (authorName) exposed via comments/reactions cross-family access | **CRITICAL** | **HIGH** | 🔴 Same root cause as above |
| User emails potentially exposed via notifications or family members API | MEDIUM | HIGH | 🟠 Verify no cross-family joins |
| `console.log` in invite route leaks family name, invite link, userId | HIGH | HIGH | 🔴 Must remove before launch |
| Error boundary logs full stack traces with potential PII | MEDIUM | MEDIUM | 🟠 Must add PII scrubbing |

### D — Denial of Service

**Question:** Could one user crash everyone's sync?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Flood sync server with playback events (amplification attack) | HIGH (when WS implemented) | HIGH | 🟠 No rate limiting designed yet |
| Disconnect all WebSocket clients by sending malformed messages | MEDIUM | HIGH | 🟠 WS implementation must handle malformed input gracefully |
| Exhaust server memory by joining from many simultaneous connections | LOW | HIGH | 🟡 Connection limits per family needed |
| Exhaust Vercel Blob storage with oversized uploads (mitigated: client-side limit exists) | LOW | MEDIUM | 🟢 50MB per image, 5GB per family/month limit in place |

### E — Elevation of Privilege

**Question:** Could a guest become a session leader?

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Non-member accepts an invite addressed to a different email | MEDIUM | HIGH | 🟡 No email verification on accept |
| Member escalates to admin role without authorization | LOW | HIGH | 🟢 DB constraints + API checks in place for admin operations |
| User who is removed from family continues to have WebSocket sync access (no connection teardown) | MEDIUM (when WS implemented) | HIGH | 🟠 WS must check family membership on every authenticated message |

---

## 6. Findings Summary by Severity

### 🔴 CRITICAL (Fix Before Launch)

| # | Finding | File(s) |
|---|---------|---------|
| C1 | **Comments API: no family membership check** — any user can read/create/delete comments on any post | `src/app/api/comments/route.ts` |
| C2 | **Reactions API: no family membership check** — any user can read/modify reactions on any post | `src/app/api/reactions/route.ts` |
| C3 | **Legacy `/api/invite` returns plaintext invite token** in API response and logs | `src/app/api/invite/route.ts` |
| C4 | **`console.log` leaks invite link + family name + userId** in production code path | `src/app/api/families/[familyId]/invites/route.ts` |

### 🟠 HIGH (Fix Before Launch)

| # | Finding | File(s) |
|---|---------|---------|
| H1 | **WebSocket broadcaster impersonation** — client provides `broadcaster` field, not server-verified | PRD Section 5.1 (not yet built) |
| H2 | **WebSocket: no auth handshake design** — auth token could leak via URL query string | PRD Section 5.1 (not yet built) |
| H3 | **WebSocket: no per-user rate limiting** — amplification DoS risk | PRD Section 5.1 (not yet built) |
| H4 | **`console.error` in error boundary logs full stack traces with PII** | `src/components/error-boundary.tsx` |
| H5 | **bcrypt cost factor 10** — below OWASP 2025 minimum of 12 | `src/app/api/families/[familyId]/invites/route.ts` |

### 🟡 MEDIUM (Fix in Sprint 1 After Launch)

| # | Finding | File(s) |
|---|---------|---------|
| M1 | **Invite validation: loads all active invites** into memory for bcrypt comparison | `src/app/api/families/invites/[code]/route.ts` |
| M2 | **Legacy invite route has no rate limiting** | `src/app/api/invite/route.ts` |
| M3 | **No Sentry/Axiom configured** — no centralized error tracking or PII-safe logging | Not found in codebase |
| M4 | **`authorId` stripped at runtime, not DB level** — fragile, could regress | `src/app/api/posts/route.ts` |

### 🟢 LOW (Backlog)

| # | Finding | File(s) |
|---|---------|---------|
| L1 | No email verification on invite acceptance | `src/app/api/families/invites/[code]/accept/route.ts` |
| L2 | `invites` table has no DB-level CHECK constraint for expiry | `src/db/schema.ts` |
| L3 | `logActivity()` exists but is not called on membership changes or invite events | Multiple routes |

---

## 7. Immediate Action Items (Before First Production Deploy)

1. **[C1, C2] Fix comments and reactions APIs** — add family membership join through `posts.familyId` matching `familyMemberships.familyId`. Add integration tests that verify cross-family access is rejected.
2. **[C3] Remove plaintext token from legacy invite route** — return only the invite ID, not the token. Move email delivery to a properly secured path.
3. **[C4] Remove all `console.log`/`console.error` statements** that include invite links, user IDs, family names, or any user-provided content. Replace with anonymous structured metrics.
4. **[H5] Increase bcrypt cost factor** from 10 to 12 (minimum) or 14 (preferred).
5. **[H4] Add PII scrubbing** to error boundary before sending to any logging system.
6. **[H1] Fix WebSocket broadcaster authentication design** — server must stamp verified user identity, not accept `broadcaster` from client payload. Document in the WS spec before implementation begins.
7. **Add Sentry** with `beforeSend` hook for PII scrubbing and family ID hashing in tags.

---

## 8. Security Positives (What's Working Well)

- ✅ Clerk auth properly gates all protected API routes with 401 responses
- ✅ Family membership check in posts, events, upload, and family invite routes — correctly scoped
- ✅ Invite tokens stored as SHA-256 or bcrypt hashes (not plaintext)
- ✅ 7-day invite expiry enforced in application code
- ✅ Rate limiting on invite creation (10/day per family) in newer route
- ✅ Invite revocation mechanism exists and is used correctly on acceptance
- ✅ Vercel Blob storage uses signed URLs with path prefix scoped to `${familyId}/${userId}/`
- ✅ No direct database IDs exposed in API responses for posts (authorId stripped)
- ✅ SQL injection protection via Drizzle ORM parameterized queries
- ✅ Input validation (type checks, length limits, regex for email) on all reviewed routes

---

*Document version: 1.0 | Last updated: 2026-03-30 | Owner: Security Architect*
