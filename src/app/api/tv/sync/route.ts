// POST /api/tv/sync — Broadcast a sync event (play/pause/seek/skip)
// Body: { familyId, sessionId, action, videoId, position, seekTarget?, clientTimestamp? }
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql as _sql, getFamilyMembers } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawSql = _sql as any;

const VALID_ACTIONS = ["play", "pause", "seek", "skip_forward", "skip_back", "video_change"] as const;
type SyncAction = typeof VALID_ACTIONS[number];

// Rate limit: 10 sync events per second per user
const SYNC_RATE_LIMIT = 10;
const SYNC_RATE_WINDOW_MS = 1000;

// Catch-up threshold: if viewer is >10s behind, trigger catch-up mode
const CATCH_UP_THRESHOLD_SECONDS = 10;

/**
 * Verify the requesting user is a member of the given family.
 */
async function verifyFamilyMembership(familyId: string, userId: string): Promise<boolean> {
  const members = await getFamilyMembers(familyId);
  return members.some((m: { user_id: string }) => m.user_id === userId);
}

/**
 * Check if a user is the current broadcaster for a session.
 */
async function isBroadcaster(sessionId: string, userId: string): Promise<boolean> {
  const sessions = await rawSql`
    SELECT broadcaster_id FROM tv_sessions
    WHERE id = ${sessionId} AND active = TRUE
  ` as { broadcaster_id: string }[];

  if (sessions.length === 0) return false;
  return sessions[0].broadcaster_id === userId;
}

/**
 * Get server-authoritative playback position
 * serverPosition = lastKnownPosition + (now - lastEventTime)
 * 
 * This ensures all clients sync to the same position regardless of
 * network latency or client clock drift.
 */
async function getServerPosition(sessionId: string): Promise<{
  serverPosition: number;
  serverTimestamp: Date;
  lastEventTime: Date | null;
} | null> {
  try {
    // Get the session's last known position and server clock
    const sessions = await rawSql`
      SELECT 
        playback_position_seconds,
        server_clock,
        started_at
      FROM tv_sessions
      WHERE id = ${sessionId} AND active = TRUE
    ` as {
      playback_position_seconds: number;
      server_clock: Date;
      started_at: Date;
    }[];

    if (sessions.length === 0) return null;

    const session = sessions[0];
    const lastKnownPosition = session.playback_position_seconds;
    const serverClock = new Date(session.server_clock);
    const now = new Date();

    // Calculate elapsed time since last server clock update
    const elapsedMs = now.getTime() - serverClock.getTime();
    const elapsedSeconds = elapsedMs / 1000;

    // Server position = last known position + elapsed time
    const serverPosition = Math.max(0, lastKnownPosition + elapsedSeconds);

    return {
      serverPosition,
      serverTimestamp: now,
      lastEventTime: serverClock,
    };
  } catch (error) {
    console.error("[getServerPosition] Error:", error);
    return null;
  }
}

/**
 * Determine if catch-up mode is needed based on client's reported position
 * vs server-authoritative position.
 * 
 * Returns catchUpRequired: true if client is >10s behind server position.
 */
function checkCatchUpNeeded(
  clientPosition: number,
  serverPosition: number,
  thresholdSeconds: number = CATCH_UP_THRESHOLD_SECONDS
): { catchUpRequired: boolean; targetPosition: number; driftSeconds: number } {
  const drift = serverPosition - clientPosition;
  
  return {
    catchUpRequired: drift > thresholdSeconds,
    targetPosition: serverPosition,
    driftSeconds: drift,
  };
}

/**
 * Validate client timestamp is within acceptable bounds.
 * Reject events with timestamps that are:
 * - In the future (client clock ahead by >5 seconds)
 * - Too old (>60 seconds ago, potential replay attack)
 */
function validateClientTimestamp(clientTimestamp: string | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!clientTimestamp) {
    // No client timestamp provided - this is okay, we'll use server time
    return { valid: true };
  }

  const clientTime = new Date(clientTimestamp).getTime();
  const now = Date.now();
  const fiveSeconds = 5 * 1000;
  const sixtySeconds = 60 * 1000;

  if (clientTime > now + fiveSeconds) {
    return {
      valid: false,
      error: "Client timestamp is in the future",
    };
  }

  if (now - clientTime > sixtySeconds) {
    return {
      valid: false,
      error: "Client timestamp is too old",
    };
  }

  return { valid: true };
}

// ============================================
// POST /api/tv/sync — Broadcast sync event
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { familyId, sessionId, action, videoId, position, seekTarget, clientTimestamp } = body as {
      familyId: string;
      sessionId: string;
      action: string;
      videoId: string;
      position: number;
      seekTarget?: number;
      clientTimestamp?: string;
    };

    // Validate required fields
    if (!familyId || typeof familyId !== "string") {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action as SyncAction)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (typeof position !== "number" || position < 0) {
      return NextResponse.json({ error: "position must be a non-negative number" }, { status: 400 });
    }

    // Validate client timestamp server-side
    const timestampValidation = validateClientTimestamp(clientTimestamp);
    if (!timestampValidation.valid) {
      return NextResponse.json(
        { error: timestampValidation.error },
        { status: 400 }
      );
    }

    // Per-user rate limiting: max 10 sync events per second
    const rateLimitKey = `sync:${clerkId}`;
    const { allowed, remaining, resetAt } = checkRateLimit(
      rateLimitKey,
      SYNC_RATE_LIMIT,
      SYNC_RATE_WINDOW_MS
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded: max 10 sync events per second",
          retryAfterMs: resetAt - Date.now(),
        },
        { status: 429 }
      );
    }

    // Verify membership
    const isMember = await verifyFamilyMembership(familyId, clerkId);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Get user's db id
    const userRows = await rawSql`
      SELECT id FROM users WHERE clerk_id = ${clerkId}
    ` as { id: string }[];

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const dbUserId = userRows[0].id;

    // Verify this user is the broadcaster (only broadcasters emit authoritative events)
    const broadcaster = await isBroadcaster(sessionId, dbUserId);
    if (!broadcaster) {
      return NextResponse.json(
        { error: "Only the broadcaster can emit sync events. Claim the remote first." },
        { status: 403 }
      );
    }

    // Validate session belongs to this family
    const sessionCheck = await rawSql`
      SELECT id FROM tv_sessions WHERE id = ${sessionId} AND family_id = ${familyId} AND active = TRUE
    ` as { id: string }[];
    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Active session not found" }, { status: 404 });
    }

    // Get current server position before updating
    const serverPosBefore = await getServerPosition(sessionId);

    // Update session state with new server clock
    if (action === "seek" && typeof seekTarget === "number") {
      await rawSql`
        UPDATE tv_sessions
        SET playback_position_seconds = ${seekTarget},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;
    } else if (action !== "video_change") {
      await rawSql`
        UPDATE tv_sessions
        SET playback_position_seconds = ${position},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;
    }

    // If video_change, update the session's video
    if (action === "video_change") {
      await rawSql`
        UPDATE tv_sessions
        SET video_id = ${videoId},
            playback_position_seconds = 0,
            broadcaster_id = ${dbUserId},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;
    }

    // Record the sync event with server timestamp
    const serverTimestamp = new Date();
    const events = await rawSql`
      INSERT INTO tv_sync_events
        (session_id, family_id, actor_id, action, playback_position_seconds, video_id, seek_target_seconds, client_timestamp, server_timestamp)
      VALUES (
        ${sessionId},
        ${familyId},
        ${dbUserId},
        ${action as string},
        ${position},
        ${videoId},
        ${seekTarget ?? null},
        ${clientTimestamp ?? null},
        ${serverTimestamp}
      )
      RETURNING id, server_timestamp
    ` as { id: string; server_timestamp: Date }[];

    const event = events[0];

    // Calculate catch-up info for clients that might be lagging
    const catchUpInfo = serverPosBefore
      ? checkCatchUpNeeded(position, serverPosBefore.serverPosition)
      : { catchUpRequired: false, targetPosition: position, driftSeconds: 0 };

    // Return the event with server timestamp and rate limit info
    return NextResponse.json({
      eventId: event.id,
      serverTimestamp: event.server_timestamp,
      serverPosition: serverPosBefore?.serverPosition ?? position,
      action,
      videoId,
      position: action === "seek" && seekTarget !== undefined ? seekTarget : position,
      broadcasterId: dbUserId,
      catchUpRequired: catchUpInfo.catchUpRequired,
      targetPosition: catchUpInfo.targetPosition,
      driftSeconds: catchUpInfo.driftSeconds,
      rateLimit: {
        remaining,
        resetAt,
      },
    });
  } catch (err) {
    console.error("[POST /api/tv/sync] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
