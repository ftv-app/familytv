// POST /api/tv/sync — Broadcast a sync event (play/pause/seek/skip)
// Body: { familyId, sessionId, action, videoId, position, seekTarget? }
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql as _sql, getFamilyMembers } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql = _sql as any;

const VALID_ACTIONS = ["play", "pause", "seek", "skip_forward", "skip_back", "video_change"] as const;
type SyncAction = typeof VALID_ACTIONS[number];

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
  const sessions = await sql`
    SELECT broadcaster_id FROM tv_sessions
    WHERE id = ${sessionId} AND active = TRUE
  ` as { broadcaster_id: string }[];

  if (sessions.length === 0) return false;
  return sessions[0].broadcaster_id === userId;
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
    const { familyId, sessionId, action, videoId, position, seekTarget } = body as {
      familyId: string;
      sessionId: string;
      action: string;
      videoId: string;
      position: number;
      seekTarget?: number;
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

    // Verify membership
    const isMember = await verifyFamilyMembership(familyId, clerkId);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Get user's db id
    const userRows = await sql`
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
    const sessionCheck = await sql`
      SELECT id FROM tv_sessions WHERE id = ${sessionId} AND family_id = ${familyId} AND active = TRUE
    ` as { id: string }[];
    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: "Active session not found" }, { status: 404 });
    }

    // Update session state
    const clientTimestamp = new Date().toISOString();
    const eventId = uuidv4();

    // Update playback position in session
    if (action === "seek" && typeof seekTarget === "number") {
      await sql`
        UPDATE tv_sessions
        SET playback_position_seconds = ${seekTarget},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;
    } else if (action !== "video_change") {
      await sql`
        UPDATE tv_sessions
        SET playback_position_seconds = ${position},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;
    }

    // If video_change, update the session's video
    if (action === "video_change") {
      await sql`
        UPDATE tv_sessions
        SET video_id = ${videoId},
            playback_position_seconds = 0,
            broadcaster_id = ${dbUserId},
            server_clock = NOW()
        WHERE id = ${sessionId}
      `;

      // Deactivate queue items for the old video (they've been "played")
      // The advance_tv_queue function handles the actual queue progression
    }

    // Record the sync event
    const events = await sql`
      INSERT INTO tv_sync_events
        (session_id, family_id, actor_id, action, playback_position_seconds, video_id, seek_target_seconds, client_timestamp)
      VALUES (
        ${sessionId},
        ${familyId},
        ${dbUserId},
        ${action as string},
        ${position},
        ${videoId},
        ${seekTarget ?? null},
        ${clientTimestamp}
      )
      RETURNING id, server_timestamp
    ` as { id: string; server_timestamp: Date }[];

    const event = events[0];

    // Return the event to the caller — the client will broadcast this via Socket.IO
    // The API route handles DB persistence; Socket.IO handles real-time fanout
    return NextResponse.json({
      eventId: event.id,
      serverTimestamp: event.server_timestamp,
      action,
      videoId,
      position: action === "seek" && seekTarget !== undefined ? seekTarget : position,
      broadcasterId: dbUserId,
    });
  } catch (err) {
    console.error("[POST /api/tv/sync] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
