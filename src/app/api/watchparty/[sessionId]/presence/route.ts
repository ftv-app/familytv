export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  getPresenceManager,
  buildRoomId,
  parseRoomId,
  type PresenceState,
  type MergedPresenceUser,
} from "@/lib/watch-party/presence";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// ============================================
// GET /api/watchparty/[sessionId]/presence
// Returns presence state for a specific watch party session
// ============================================
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Look up the TV session to get family_id
    const sessionResult = await db.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).sql`SELECT family_id, video_id, active FROM tv_sessions WHERE id = ${sessionId}`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessions = sessionResult as any[];
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    const { family_id: familyId, video_id: videoId } = session;

    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Build the room ID and get presence
    const roomId = buildRoomId(familyId, videoId, sessionId);
    const presenceManager = getPresenceManager();
    const presence: PresenceState = presenceManager.getRoomPresence(roomId);

    return NextResponse.json({
      sessionId,
      familyId,
      videoId,
      ...presence,
    });
  } catch (err) {
    console.error("[GET /api/watchparty/[sessionId]/presence] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// POST /api/watchparty/[sessionId]/presence
// Join, leave, or send heartbeat for a watch party session
//
// Body: { action: "join" | "leave" | "heartbeat", deviceId: string, name?: string }
// ============================================
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const body = await req.json();
    const { action, deviceId, name } = body as {
      action: string;
      deviceId: string;
      name?: string;
    };

    if (!action || !["join", "leave", "heartbeat"].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: join, leave, heartbeat" },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // Look up the TV session to get family_id and video_id
    const sessionResult = await db.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).sql`SELECT family_id, video_id, active FROM tv_sessions WHERE id = ${sessionId}`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessions = sessionResult as any[];
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    const { family_id: familyId, video_id: videoId, active } = session;

    if (!active) {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 });
    }

    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    const roomId = buildRoomId(familyId, videoId, sessionId);
    const presenceManager = getPresenceManager();

    // Use provided name or fetch from DB
    const displayName = name || `Family Member`;

    if (action === "join") {
      presenceManager.joinRoom(roomId, userId, displayName, null, deviceId);
      const presence = presenceManager.getRoomPresence(roomId);
      return NextResponse.json({ success: true, presence });
    }

    if (action === "leave") {
      presenceManager.leaveRoom(roomId, deviceId);
      const presence = presenceManager.getRoomPresence(roomId);
      return NextResponse.json({ success: true, presence });
    }

    if (action === "heartbeat") {
      const ok = presenceManager.heartbeat(roomId, deviceId);
      if (!ok) {
        return NextResponse.json(
          { error: "Device not in session — must join first" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/watchparty/[sessionId]/presence] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
