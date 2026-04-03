# What's Happening Now — Backend & Ranking Spec
**Issue:** CTM-38  
**Status:** Draft  
**Spec Type:** Architecture / Backend API  
**Unblocks:** `frontend-dev` (UI → API integration), `backend-dev` (API + ranking implementation)  
**Prerequisite:** UI spec at `design/whats-happening-now.md` (CTM-255)  
**Author:** Architect subagent  
**Last updated:** 2026-04-03  

---

## 1. Overview

"What's Happening Now" replaces passive feed-checking with proactive, ranked surfacing of the most relevant family activity. The backend serves four data categories — recent posts, upcoming birthdays, recent comments on your posts, and new member joins — through a unified `GET /api/family/activity` endpoint that merges, ranks, and privacy-filters all content in a single response.

The ranking engine uses a **tiered hybrid score** combining recency, engagement, social proximity, and (optionally) semantic embedding similarity. The goal: surface what matters most to each user without overwhelming them.

---

## 2. Design Principles

1. **Privacy first** — Every item is access-checked against the requesting user's family membership before surfacing. Posts from private albums, restricted content, or content from families the user doesn't belong to are never included.
2. **Single endpoint** — One `GET /api/family/activity` returns all ranked items. The frontend widget makes one network call; the backend does the cross-table merge and ranking.
3. **Server-authoritative timestamps** — All ordering uses `serverTimestamp` (from CTM-223) or `createdAt`; client clocks are never trusted.
4. **No cross-family leakage** — Every query is scoped to a single `familyId`. The embedding service `family_id` filter enforces this at the vector level.
5. **Spam-resistant** — Rate-limit surfacing frequency per content type; suppress duplicate content; cap max items surfaced per user per day.

---

## 3. Data Model Changes

### 3.1 New Column: `family_memberships.birthday_month_day`

Birthday surfacing requires knowing the month and day only. Full birth year is **not** stored (privacy).

```sql
ALTER TABLE family_memberships
  ADD COLUMN birthday_month_day SMALLINT,  -- MMDD as integer, e.g. 1203 for Dec 3; NULL if not set
  ADD COLUMN birthday_display_name TEXT;   -- "Dad's birthday" or "Grandma June"; NULL if not set
```

**Rationale:** Storing month+day as integer enables efficient range queries (`BETWEEN`) without timezone edge cases. The display name allows personalized surfaced copy ("Emma's birthday tomorrow") without exposing the actual birthday.

**Privacy:** Only `birthday_month_day` (MMDD) is stored — no year, no full date. The display name is user-supplied free text, not derived from any date field.

**Schema type:**
```ts
// src/db/schema.ts additions
birthdayMonthDay: smallint("birthday_month_day"),      // MMDD integer, e.g. 1203
birthdayDisplayName: text("birthday_display_name"),    // e.g. "Dad's birthday"
```

### 3.2 No new tables required

All surfaced data is derived from existing tables:
- Recent posts → `posts` (filtered by `familyId`, `createdAt > now() - 24h`)
- New member joins → `family_memberships` (filtered by `familyId`, `joinedAt > now() - 24h`)
- Recent comments on your posts → `comments` joined with `posts` where `posts.authorId = requestingUserId`
- Upcoming birthdays → `family_memberships` where `birthdayMonthDay` is within the next 30 days

### 3.3 Optional: Surfacing suppression log

To prevent spam (same content shown repeatedly), a lightweight suppression record is stored:

```ts
// src/db/schema.ts — optional, for spam resistance
export const activitySurfacedLogs = pgTable(
  "activity_surface_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),          // Clerk userId who received the surface
    itemId: uuid("item_id").notNull(),          // ID of surfaced item (post_id, membership_id, etc.)
    itemType: text("item_type").notNull(),      // "post" | "comment" | "member_join" | "birthday"
    surfacedAt: timestamp("surfaced_at").defaultNow().notNull(),
    suppressedAt: timestamp("suppressed_at").defaultNow().notNull(), // When to stop surfacing
  }
);
```

**Decision:** This is optional for v1. If complexity is too high, suppress duplicates client-side via `lastSeenItemId` tracking.

---

## 4. API Endpoints

### 4.1 Primary Endpoint: `GET /api/family/activity`

Single unified endpoint for all widget data.

```
GET /api/family/activity?familyId=<uuid>
Authorization: Bearer <clerk_token>
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `familyId` | UUID | Yes | — | Target family |
| `limit` | integer | No | `20` | Max total items returned (capped at `50`) |
| `since` | ISO8601 | No | `null` | Return only items with `serverTimestamp > since` (for delta/polling) |
| `types` | comma-list | No | `all` | Filter: `posts,comments,members,birthdays` or `all` |

**Response `200`:**

```ts
interface ActivityResponse {
  familyId: string;
  generatedAt: string;          // ISO8601 — server time when list was generated
  items: SurfacedItem[];        // Ranked, deduped, privacy-filtered
  meta: {
    totalItems: number;
    hasMore: boolean;            // true if more items exist beyond `limit`
    pollingHint: string;         // ISO8601 — recommended next poll time
    sections: {
      posts: { count: number; newestAt: string | null };
      comments: { count: number; newestAt: string | null };
      members: { count: number; newestAt: string | null };
      birthdays: { count: number; nextBirthdayAt: string | null };
    };
  };
}

type SurfacedItem = PostItem | CommentItem | MemberJoinItem | BirthdayItem;

interface PostItem {
  type: "post";
  id: string;                   // post.id
  postId: string;               // alias for id (for convenience)
  author: Actor;
  contentType: "photo" | "video" | "text";
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  caption?: string;
  createdAt: string;            // ISO8601
  serverTimestamp: string;       // ISO8601 — used for ranking, CTM-223
  reactionCount: number;
  commentCount: number;
  score: number;                // 0–100 ranking score (debug/audit field)
  scoreBreakdown: {
    recency: number;
    engagement: number;
    socialProximity: number;
    semantic?: number;          // present only if embedding search used
  };
}

interface CommentItem {
  type: "comment";
  id: string;                   // comment.id
  postId: string;               // parent post ID
  postCaption?: string;         // caption of parent post (for context)
  author: Actor;               // person who wrote the comment
  content: string;              // comment text (first 120 chars)
  createdAt: string;
  serverTimestamp: string;
  postAuthor: Actor;           // author of the parent post (may equal requesting user)
  isOnOwnPost: boolean;        // true if the parent post belongs to the requesting user
  score: number;
  scoreBreakdown: { recency: number; engagement: number; socialProximity: number };
}

interface MemberJoinItem {
  type: "member_join";
  id: string;                   // membership.id
  actor: Actor;                // the new member
  joinedAt: string;
  serverTimestamp: string;     // same as joinedAt
  invitedBy?: Actor;           // who invited them (if known)
  score: number;
  scoreBreakdown: { recency: number; socialProximity: number };
}

interface BirthdayItem {
  type: "birthday";
  id: string;                   // membership.id
  person: Actor;               // birthday person
  displayName: string;        // "Dad's birthday" or person.name
  daysUntil: number;           // 0 = today, 1 = tomorrow, etc.
  isToday: boolean;
  isTomorrow: boolean;
  dateLabel: string;            // "Today!", "Tomorrow", "In 12 days"
  ageTurning?: number;          // age they're turning (only if family chose to disclose)
  serverTimestamp: string;     // set to midnight of birthday date for ranking
  score: number;
  scoreBreakdown: { recency: number; proximity: number };
}

interface Actor {
  id: string;                   // user id (Clerk ID)
  name: string;
  avatarUrl?: string;
  initials?: string;            // fallback if no avatar
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid Clerk token |
| `403` | User is not a member of the target family |
| `400` | Invalid `familyId` format or `limit` out of range |

---

### 4.2 Supporting Endpoints

These exist to give the frontend fine-grained control if the widget is implemented section-by-section (rather than the unified endpoint). They are **optional** — the unified endpoint is the primary contract.

#### `GET /api/family/activity/posts`

```
GET /api/family/activity/posts?familyId=<uuid>&hours=24&limit=2
```

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `hours` | `24` | `168` (7 days) | How far back to look |
| `limit` | `2` | `10` | Max posts |

**Response:** `{ items: PostItem[], lastUpdated: string }`

#### `GET /api/family/activity/birthdays`

```
GET /api/family/activity/birthdays?familyId=<uuid>&days=30&limit=3
```

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `days` | `30` | `90` | How many days ahead |
| `limit` | `3` | `10` | Max birthdays |

**Response:** `{ items: BirthdayItem[], lastUpdated: string }`

#### `GET /api/family/activity/comments`

```
GET /api/family/activity/comments?familyId=<uuid>&hours=72&limit=5
```

Returns comments made by others on posts authored by the requesting user.

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `hours` | `72` | `168` | How far back to look |
| `limit` | `5` | `20` | Max comments |

**Response:** `{ items: CommentItem[], lastUpdated: string }`

#### `GET /api/family/activity/members`

```
GET /api/family/activity/members?familyId=<uuid>&days=7&limit=3
```

Returns family members who joined in the specified window.

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `days` | `7` | `30` | How far back to look |
| `limit` | `3` | `10` | Max members |

**Response:** `{ items: MemberJoinItem[], lastUpdated: string }`

#### `PATCH /api/family/activity/birthday` (optional — for setting one's own birthday)

```
PATCH /api/family/activity/birthday
Authorization: Bearer <clerk_token>
Content-Type: application/json

{
  "familyId": "uuid",
  "birthdayMonthDay": 1203,      // MMDD integer, required
  "birthdayDisplayName": "Dad's birthday",  // optional
  "ageTurning": 62              // optional, omit for surprise mode
}
```

Allows a user to set their own birthday info for the birthday surfacing feature.

---

## 5. Ranking Algorithm

### 5.1 Overview

Items are ranked using a **tiered weighted scoring** system. Each item type has its own scoring sub-components that are normalized to a `0–100` scale before being merged into a global ranked list.

### 5.2 Per-Type Scoring

#### Posts

```
postScore = (
  recencyScore     × 0.40  +   // How recent vs. 24h window
  engagementScore  × 0.35  +   // (reactionCount + commentCount) / max_in_window
  socialProximity  × 0.15  +   // Same household indicator or frequent interactor
  semanticScore    × 0.10       // Embedding similarity to user's recent interests
)
```

- **recencyScore:** `1 - (age_in_hours / 24)`, capped at 1.0, floored at 0.
- **engagementScore:** `(reactionCount + commentCount*2) / maxEngagementInFamilyWindow`, where the max is the highest engagement any post from this family has received in the window. Multiplier of 2 on comments because they indicate active conversation.
- **socialProximity:** Score of 1.0 if the post author is in the requesting user's `topInteractors` list (derived from comment/reaction frequency), else 0.5.
- **semanticScore:** (optional v1) If the embedding service returns a similarity score for the post text vs. the user's interest vector, it's incorporated here. See Section 5.4.

#### Comments

```
commentScore = (
  recencyScore      × 0.50  +
  engagementScore   × 0.30  +   // Number of reactions on the parent post
  socialProximity   × 0.20      // Author is someone the user frequently interacts with
)
```

**Note:** Comments are only surfaced if `isOnOwnPost = true` (i.e., someone commented on the requesting user's post). This is the primary "recent comments on your posts" signal.

#### Member Joins

```
memberJoinScore = (
  recencyScore   × 0.60  +
  socialProximity × 0.40   // Invited by someone close to the user
)
```

New members are always ranked below posts and comments. A new join is notable but shouldn't displace recent content.

#### Birthdays

```
birthdayScore = (
  proximityScore  × 0.70  +   // 1.0 if today, 0.5 if tomorrow, descending
  relationshipScore × 0.30   // Immediate family = 1.0, extended = 0.6, non-family = 0.3
)
```

Birthdays are surfaced as informational; they don't compete aggressively with content.

### 5.3 Cross-Type Merge

After computing per-item scores, all items are merged into a single timeline sorted by `score` descending, then `serverTimestamp` descending.

**Hard filters applied before scoring:**
- Posts older than 24 hours are excluded
- Birthdays more than 30 days away are excluded
- Member joins more than 7 days ago are excluded
- Comments older than 72 hours are excluded

**Spam suppression rules:**
1. If the same `authorId` has posted more than 3 times in the 24h window, only the top 3 by score are surfaced
2. If a user has already been notified of a given birthday item in the last 7 days (tracked in `activity_surface_logs`), suppress it
3. Max 3 birthday items surfaced per family per user per day

**Diversity boost:**
After scoring, apply a **content type diversity bonus**: if the top N items are all the same `type`, boost the highest-scoring item of a different type by 10% to prevent one type from dominating.

### 5.4 Semantic Ranking (Embedding Integration)

The embedding service (`POST /search`) can be used to personalize post surfacing based on the user's recent interests.

**User interest vector construction:**
When a user posts, comments, or reacts, the text content is embedded and stored in LanceDB. A user's "interest vector" is the rolling average of the last 20 embeddings from posts they've authored or interacted with.

**Post scoring via embeddings:**
```
semanticScore = cosineSimilarity(userInterestVector, postEmbeddingVector)
```

- Only posts from the last 7 days are candidates for semantic scoring
- This is an optional layer; if the embedding service is unavailable, `semanticScore = 0` and the rest of the formula degrades gracefully to recency + engagement alone
- The `semantic` field in `scoreBreakdown` is only populated when embedding search is active

**Example semantic surfacing:** User posted "Can't wait for Jack's birthday party!" last week. When Jack's birthday approaches, a birthday item and a related post about Jack from a few days ago both surface with elevated semantic scores.

### 5.5 Score Debug Field

`scoreBreakdown` is included in the response for debugging and QA. In production logs, log the top 3 score contributors per surfaced item for analytics.

---

## 6. Privacy Rules

All privacy checks are enforced **server-side** — the frontend never receives data it shouldn't see.

### 6.1 Core Privacy Invariants

1. **Family membership is the only access grant.** The `GET /api/family/activity?familyId=xxx` endpoint verifies `familyMemberships.userId = requestingUser AND familyMemberships.familyId = familyId` before returning anything.

2. **Birthday data is month+day only.** No full birth date, no year, no age at registration (unless explicitly set by the user via `PATCH /api/family/activity/birthday`). The `ageTurning` field is only populated if the user voluntarily disclosed it.

3. **Post captions are visible only to family members.** The post query uses `familyId` scoping via the existing `posts_family_idx` index. No cross-family post visibility.

4. **Comments are filtered by post ownership.** The comments query joins `posts` and filters to `posts.authorId = requestingUserId` — users can only see comments on their own posts from other family members.

5. **Actor data is scrubbed.** The `Actor` type in responses uses the `authorName` cached field from `posts`/`comments`, not raw Clerk data. No `userId` (Clerk ID) is ever exposed in response bodies.

6. **New member join surfaces only public membership data.** The `invitedBy` field is only populated if the inviter's relationship is known via `family_memberships`. No invite token data is exposed.

### 6.2 Privacy Checklist

| Check | Mechanism |
|-------|-----------|
| User can only fetch activity for families they belong to | `familyMemberships` membership verification on every request |
| No post from another family is accessible | `familyId` filter on all `posts` queries |
| Birthday year is never stored or returned | Only `birthdayMonthDay` (MMDD integer) stored |
| No Clerk userId in response bodies | `Actor` type uses only `name`, `avatarUrl`, `initials` |
| Comments only from own posts are surfaced | SQL join `comments → posts` filtered by `posts.authorId = requestingUserId` |
| Invite tokens never exposed | `MemberJoinItem` uses `familyMemberships`, not `invites` table |
| Embedding queries always scoped by `family_id` | Embedding service enforces `family_id` required field; LanceDB WHERE clause |

---

## 7. Database Indexes

Existing indexes cover most query patterns. No new indexes are required for v1.

**Verify these indexes exist (from CTM-223 schema):**
- `posts_family_idx` on `posts(family_id)` — ✅ already exists
- `posts_created_idx` on `posts(family_id, created_at)` — ✅ already exists
- `posts_server_timestamp_idx` on `posts(family_id, server_timestamp)` — ✅ already exists
- `comments_post_idx` on `comments(post_id)` — needed; verify or add:
  ```sql
  CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id);
  ```
- `family_memberships_family_idx` on `family_memberships(family_id)` — ✅ already exists
- `family_memberships_joined_idx` on `family_memberships(family_id, joined_at)` — needed; verify or add:
  ```sql
  CREATE INDEX IF NOT EXISTS family_memberships_joined_idx
    ON family_memberships(family_id, joined_at);
  ```
- `calendar_events_family_idx` on `calendar_events(family_id)` — ✅ already exists

---

## 8. Embedding Service Integration

### 8.1 Indexing Strategy

When a post is created, the embedding service should be called to index the post text:

```
POST /index
{
  "items": [
    {
      "id": "<post.id>",
      "text": "<caption or auto-generated text>",  // e.g., "photo post" if no caption
      "family_id": "<post.familyId>",
      "type": "post"
    }
  ]
}
```

- **What to embed:** The post `caption` is the primary text. If absent, use a type-derived placeholder (`"photo post"`, `"video post"`, `"text post"`).
- **Deduplication:** Use `id` as the unique key; re-indexing the same post updates its vector in LanceDB.
- **Async indexing:** Indexing is fire-and-forget from the posts API; do not block the POST response on embedding completion. Use a background job or queue if available.

### 8.2 Semantic Search for User Interest

The embedding service's `/search` endpoint is used during ranking:

```
POST /search
{
  "query": "<user interest query derived from recent activity>",
  "family_id": "<familyId>",
  "limit": 20,
  "type": "post"
}
```

The `query` is constructed by concatenating the text of the last 5 items the user interacted with (their own posts + comments on others' posts), truncated to 512 tokens. This is an approximation of the user's current interest context.

### 8.3 Graceful Degradation

If the embedding service is unavailable:
1. The ranking endpoint catches the error and sets `semanticScore = 0` for all posts
2. The `scoreBreakdown.semantic` field is omitted from the response
3. A `warning: "embedding_service_unavailable"` flag is added to `meta` in the response
4. The endpoint still returns ranked results using recency + engagement alone

---

## 9. Polling Strategy & Caching

### 9.1 CDN / Server-Side Caching

| Endpoint | Cache TTL | Rationale |
|----------|-----------|-----------|
| `GET /api/family/activity` | `60s` | Activity is highly personalized per user; short TTL |
| `GET /api/family/activity/posts` | `30s` | Posts change frequently |
| `GET /api/family/activity/birthdays` | `3600s` | Birthdays change once/day |
| `GET /api/family/activity/comments` | `60s` | Comments can happen anytime |
| `GET /api/family/activity/members` | `300s` | Joins are infrequent |

Cache key: `familyId + userId` (personalized cache).

### 9.2 Client-Side Polling Intervals

The frontend widget (per CTM-255 spec) should poll at these intervals:

| Section | Polling Interval | Bounded By |
|---------|-----------------|-----------|
| Posts | 60s | 24h window |
| Comments | 60s | 72h window |
| Member Joins | 5 min | 7d window |
| Birthdays | 30 min | 30d window |

### 9.3 `since` Parameter for Delta Polling

If the client sends `since=ISO8601`, the server returns only items where `serverTimestamp > since`. This allows the frontend to do efficient delta updates without re-fetching the full list.

---

## 10. File Structure

### Backend (API Routes)

```
src/app/api/family/
├── activity/
│   ├── route.ts                    # GET /api/family/activity — unified ranked endpoint
│   ├── posts/
│   │   └── route.ts               # GET /api/family/activity/posts
│   ├── birthdays/
│   │   └── route.ts               # GET /api/family/activity/birthdays
│   ├── comments/
│   │   └── route.ts               # GET /api/family/activity/comments
│   └── members/
│       └── route.ts               # GET /api/family/activity/members
```

### Ranking Logic

```
src/lib/
├── activity/
│   ├── ranker.ts                   # Core ranking algorithm
│   ├── scores/
│   │   ├── postScore.ts            # Post-specific scoring
│   │   ├── commentScore.ts         # Comment-specific scoring
│   │   ├── memberJoinScore.ts      # Member join scoring
│   │   └── birthdayScore.ts        # Birthday proximity scoring
│   ├── spamSuppressor.ts           # Duplicate / over-surfacing suppression
│   └── embeddingIntegration.ts     # Embedding service client wrapper
```

### DB Schema

```
src/db/schema.ts additions:
- family_memberships.birthdayMonthDay: smallint (MMDD integer)
- family_memberships.birthdayDisplayName: text
```

---

## 11. Implementation Order

1. **Schema migration** — Add `birthdayMonthDay` and `birthdayDisplayName` to `family_memberships`
2. **Supporting endpoints** — Implement the four granular endpoints (`/posts`, `/birthdays`, `/comments`, `/members`) first; each is a simple scoped query
3. **Ranking engine** — Implement `ranker.ts` and per-type scoring modules
4. **Unified endpoint** — `GET /api/family/activity` merges results from all four queries, applies scoring and suppression, returns ranked list
5. **Embedding integration** — Index posts on creation; integrate `/search` into `postScore.ts` as an optional layer
6. **Spam suppression log** — Add `activity_surface_logs` table and integrate into suppression logic
7. **Birthday set endpoint** — `PATCH /api/family/activity/birthday`

---

## 12. Open Questions

1. **Birthday disclosure:** Should `ageTurning` ever be surfaced automatically, or is it always opt-in via the `PATCH` endpoint? Currently: opt-in only.
2. **Max items per session:** Should a user see the same birthday item across multiple days as it approaches (e.g., "Emma's birthday in 3 days", then "in 2 days")? Currently: yes, with score increasing as day approaches.
3. **Private posts:** Does the current schema support post-level privacy (e.g., "only admins can see")? No — if needed, a `visibility` column on `posts` would be required.
4. **Multiple families:** If a user belongs to multiple families, should the widget show activity from all families or require `familyId` selection? Currently: requires `familyId` param; frontend handles family switching.

---

*Spec version 1.0 — CTM-38 — architect subagent — 2026-04-03*
