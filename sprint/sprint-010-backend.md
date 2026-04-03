# Sprint 010 Backend Report - What's Happening Now Surfacing

**Date:** 2026-04-01
**Backend Developer:** subagent:bdedfcf9-6385-45d0-a7b8-94926011aad9
**Task:** CTM-237 - What's Happening Now proactive family surfacing

## Overview

Implemented backend APIs to power the "What's Happening Now" proactive surfacing feature. This feature surfaces relevant family activity to help family members stay connected without actively checking the app.

## What Was Built

### 1. Extended GET /api/family/activity with Filtering

**File:** `src/app/api/family/activity/route.ts`

Added support for:
- **Time filtering** (`timeRange` param): `24h`, `7d`, or `all` (default)
- **Activity type filtering** (`types` param): Comma-separated list of `post`, `comment`, `reaction`, `event`
- **Member filtering** (`members` param): Comma-separated list of member IDs to filter activities by actor
- **Pagination** with cursor-based pagination (existing)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `timeRange` | string | `24h`, `7d`, or `all` (default) |
| `types` | string | Comma-separated: `post,comment,reaction,event` |
| `members` | string | Comma-separated member IDs |
| `limit` | number | 1-50, default 20 |
| `cursor` | string | ISO timestamp for pagination |

**Example:**
```
GET /api/family/activity?familyId=xxx&timeRange=24h&types=post,comment&members=user1,user2
```

### 2. New GET /api/family/presence Endpoint

**File:** `src/app/api/family/presence/route.ts`

Returns family-wide presence data showing which family members are currently online and what they're viewing.

**Response:**
```json
{
  "onlineMembers": [
    {
      "oderId": "uuid",
      "userId": "user_123",
      "name": "Mom",
      "avatar": null,
      "status": "active",
      "lastSeen": 1743532800000,
      "currentView": {
        "roomId": "family:fam123:video:vid456:session:sess789",
        "videoId": "vid456",
        "sessionId": "sess789"
      }
    }
  ],
  "timestamp": 1743532800000
}
```

**Security:** Family-scoped - users can only see presence for families they belong to.

### 3. New GET /api/events/upcoming Endpoint

**File:** `src/app/api/events/upcoming/route.ts`

Returns calendar events starting within the next 24 hours.

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Family Dinner",
      "description": "Sunday dinner at grandma's",
      "startDate": "2026-04-01T18:00:00.000Z",
      "endDate": "2026-04-01T20:00:00.000Z",
      "allDay": false,
      "createdBy": "user_123",
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ],
  "familyName": "The Smiths"
}
```

### 4. Supporting Code

**File:** `src/lib/activity-filter.ts`

Extracted activity filtering logic into a reusable module with:
- Type-safe validation functions
- Time range calculation helpers
- Activity transformation functions
- Member filtering logic
- Pagination helpers

**File:** `src/lib/watch-party/presence.ts`

Added `getFamilyPresence(familyId)` method to `PresenceManager` class that aggregates presence data across all watch party rooms for a family.

## Tests Added

### Unit Tests

| File | Tests | Description |
|------|-------|-------------|
| `src/lib/activity-filter.test.ts` | 69 | Validation, parsing, filtering logic |
| `src/lib/watch-party/__tests__/family-presence.test.ts` | 12 | Family presence aggregation |

### Integration Tests

| File | Tests | Description |
|------|-------|-------------|
| `src/test/api/family-presence.test.ts` | 6 | Presence endpoint auth & responses |
| `src/test/api/events-upcoming.test.ts` | 11 | Upcoming events endpoint |
| `src/test/api/family-activity-filter.test.ts` | 20 | Activity filtering params |

**Total:** 118 new tests, all passing

## Files Modified/Created

### Created
- `src/lib/activity-filter.ts` - Filtering logic
- `src/lib/activity-filter.test.ts` - Unit tests
- `src/lib/watch-party/__tests__/family-presence.test.ts` - Presence tests
- `src/app/api/family/presence/route.ts` - Presence endpoint
- `src/app/api/events/upcoming/route.ts` - Upcoming events endpoint
- `src/test/api/family-presence.test.ts` - Presence API tests
- `src/test/api/events-upcoming.test.ts` - Events API tests
- `src/test/api/family-activity-filter.test.ts` - Activity filter tests

### Modified
- `src/app/api/family/activity/route.ts` - Added filtering support
- `src/lib/watch-party/presence.ts` - Added getFamilyPresence method

## Definition of Done ✓

- [x] GET /api/family/activity supports filtering (time, type, member)
- [x] GET /api/family/presence REST endpoint exists and works
- [x] GET /api/events/upcoming returns 24h window events
- [x] All new endpoints have tests (118 tests passing)
- [x] Types are strict TypeScript (no `any` in new code)
- [x] All endpoints are family-scoped (family A cannot access family B data)

## Technical Notes

### Family Scoping
All endpoints validate family membership before returning data:
- Presence endpoint checks family membership
- Upcoming events checks family membership  
- Activity endpoint (already did) checks family membership

### Presence Architecture
The presence system is room-based (watch party sessions). The new `getFamilyPresence()` method aggregates presence across all rooms for a family, returning merged user data with their current viewing session.

### Time Range Implementation
Time filtering uses database-level `gte` (greater than or equal) for efficiency. The 24h and 7d ranges are calculated relative to the current server time.

## Known Limitations

1. **Presence is in-memory:** The presence data is stored in the PresenceManager singleton, which means it's not persisted across server restarts. For production, this would need Redis or similar.

2. **No WebSocket integration:** The presence endpoint reads from the PresenceManager which is updated by socket handlers. If WebSocket handlers aren't updating presence correctly, the REST endpoint won't show accurate data.

3. **No real-time updates:** The presence endpoint requires polling. Real-time updates would require WebSocket connection.
