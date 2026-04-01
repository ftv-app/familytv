// GET /api/sync/clock - Get server time info
// POST /api/sync/clock/sync - Sync family content delta
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, familySyncStates, posts, calendarEvents, familyMemberships } from '@/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import {
  getSyncClockResponse,
  getFamilySyncStateResponse,
  validateClientTimestamp,
  generateServerTimestamp,
  serverNow,
} from '@/lib/sync-clock';

// Rate limit for sync operations: 30 syncs per minute per user
const SYNC_RATE_LIMIT = 30;
const SYNC_RATE_WINDOW_MS = 60_000;

// In-memory rate limiting (simple implementation)
// In production, use Redis or similar
const syncRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkSyncRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = syncRateLimitMap.get(userId);
  
  if (!entry || now > entry.resetAt) {
    const resetAt = now + SYNC_RATE_WINDOW_MS;
    syncRateLimitMap.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: SYNC_RATE_LIMIT - 1, resetAt };
  }
  
  if (entry.count >= SYNC_RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: SYNC_RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

// ============================================
// GET /api/sync/clock
// Returns server-authoritative time information
// Supports family-specific sync state when?familyId=xxx is provided
// ============================================
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get('familyId');
  const lastSyncedAt = searchParams.get('lastSyncedAt');
  
  // If familyId provided, return family-specific sync state
  if (familyId) {
    // Validate familyId format (basic UUID check)
    if (!isValidUUID(familyId)) {
      return NextResponse.json({ error: 'Invalid familyId format' }, { status: 400 });
    }
    
    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });
    
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this family' }, { status: 403 });
    }
    
    // Parse lastSyncedAt if provided
    let parsedLastSyncedAt: Date | undefined;
    if (lastSyncedAt) {
      parsedLastSyncedAt = new Date(lastSyncedAt);
      if (isNaN(parsedLastSyncedAt.getTime())) {
        return NextResponse.json({ error: 'Invalid lastSyncedAt format' }, { status: 400 });
      }
    }
    
    const syncState = getFamilySyncStateResponse(familyId, parsedLastSyncedAt);
    
    // Also get or create family sync state from DB
    const dbSyncState = await db.query.familySyncStates.findFirst({
      where: eq(familySyncStates.familyId, familyId),
    });
    
    if (dbSyncState) {
      // Merge DB state with computed state
      syncState.driftMs = dbSyncState.driftMs;
      syncState.lastServerTime = dbSyncState.lastServerTime;
      syncState.lastSyncedAt = dbSyncState.lastSyncedAt;
    }
    
    return NextResponse.json(syncState, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  
  // No familyId - return global server time
  return NextResponse.json(getSyncClockResponse(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

// ============================================
// POST /api/sync/clock/sync
// Sync family content since a given timestamp
// Returns new posts and events for the family
// ============================================
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check rate limit
  const rateLimit = checkSyncRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfterMs: rateLimit.resetAt - Date.now(),
      },
      { status: 429 }
    );
  }
  
  try {
    const body = await req.json();
    const { familyId, lastSyncedAt, clientTimestamp, limit = 50 } = body;
    
    // Validate required fields
    if (!familyId || typeof familyId !== 'string') {
      return NextResponse.json({ error: 'familyId is required' }, { status: 400 });
    }
    
    if (!isValidUUID(familyId)) {
      return NextResponse.json({ error: 'Invalid familyId format' }, { status: 400 });
    }
    
    // Validate client timestamp if provided
    if (clientTimestamp) {
      const validation = validateClientTimestamp(clientTimestamp);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }
    
    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });
    
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this family' }, { status: 403 });
    }
    
    // Parse lastSyncedAt - default to epoch if not provided
    let since: Date;
    if (lastSyncedAt) {
      since = new Date(lastSyncedAt);
      if (isNaN(since.getTime())) {
        return NextResponse.json({ error: 'Invalid lastSyncedAt format' }, { status: 400 });
      }
    } else {
      // No lastSyncedAt provided - this is a full sync
      // Use a date far in the past to get all content
      since = new Date(0);
    }
    
    // Get new posts since the last sync timestamp
    // Order by serverTimestamp for consistent ordering across clients
    const newPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.familyId, familyId),
        gt(posts.serverTimestamp, since)
      ),
      orderBy: [desc(posts.serverTimestamp)],
      limit: Math.min(Number(limit), 100), // Cap at 100
    });
    
    // Get new calendar events since the last sync timestamp
    const newEvents = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.familyId, familyId),
        gt(calendarEvents.serverTimestamp, since)
      ),
      orderBy: [desc(calendarEvents.serverTimestamp)],
      limit: Math.min(Number(limit), 100),
    });
    
    // Update family sync state
    const serverTimestamp = generateServerTimestamp();
    const existingSyncState = await db.query.familySyncStates.findFirst({
      where: eq(familySyncStates.familyId, familyId),
    });
    
    if (existingSyncState) {
      // Update existing sync state
      await db
        .update(familySyncStates)
        .set({
          lastServerTime: serverTimestamp,
          lastSyncedAt: serverTimestamp,
          updatedAt: serverTimestamp,
        })
        .where(eq(familySyncStates.familyId, familyId));
    } else {
      // Create new sync state
      await db
        .insert(familySyncStates)
        .values({
          familyId,
          lastServerTime: serverTimestamp,
          lastSyncedAt: serverTimestamp,
          driftMs: 0,
        });
    }
    
    // Remove sensitive authorId from posts in response
    const sanitizedPosts = newPosts.map(({ authorId: _authorId, ...rest }) => rest);
    
    return NextResponse.json({
      posts: sanitizedPosts,
      events: newEvents,
      serverTimestamp,
      syncedAt: serverTimestamp,
      hasMore: newPosts.length === Number(limit) || newEvents.length === Number(limit),
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[POST /api/sync/clock/sync] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Basic UUID validation
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
