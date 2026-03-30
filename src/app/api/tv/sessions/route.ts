// TV Sessions API
// POST /api/tv/sessions         — Create a new TV session
// GET  /api/tv/sessions?familyId=xxx — Get active session for a family
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql as _sql, getFamilyMembers } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql = _sql as any;

/**
 * Verify the requesting user is a member of the given family.
 */
async function verifyFamilyMembership(familyId: string, userId: string): Promise<boolean> {
  const members = await getFamilyMembers(familyId);
  return members.some((m: { user_id: string }) => m.user_id === userId);
}

// ============================================
// GET /api/tv/sessions?familyId=xxx — Get active session
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = req.nextUrl.searchParams.get("familyId");
    if (!familyId) {
      return NextResponse.json({ error: "familyId query param required" }, { status: 400 });
    }

    // Verify membership
    const isMember = await verifyFamilyMembership(familyId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Get active session
    const sessions = await sql`
      SELECT
        ts.id,
        ts.family_id,
        ts.video_id,
        ts.broadcaster_id,
        ts.playback_position_seconds,
        ts.active,
        ts.channel_number,
        ts.started_at,
        ts.server_clock,
        ts.created_at,
        u.name AS broadcaster_name,
        u.email AS broadcaster_email,
        p.content AS video_caption,
        p.media_url AS video_url
      FROM tv_sessions ts
      LEFT JOIN users u ON u.id = ts.broadcaster_id
      LEFT JOIN posts p ON p.id = ts.video_id
      WHERE ts.family_id = ${familyId} AND ts.active = TRUE
      ORDER BY ts.started_at DESC
      LIMIT 1
    ` as unknown as {
      id: string;
      family_id: string;
      video_id: string;
      broadcaster_id: string;
      playback_position_seconds: number;
      active: boolean;
      channel_number: number;
      started_at: Date;
      server_clock: Date;
      created_at: Date;
      broadcaster_name: string | null;
      broadcaster_email: string | null;
      video_caption: string | null;
      video_url: string | null;
    }[];

    if (sessions.length === 0) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const session = sessions[0];

    // Get current queue for this family/channel
    const queue = await sql`
      SELECT
        q.id,
        q.video_id,
        q.position,
        q.source,
        q.created_at,
        u.name AS added_by_name,
        p.media_url AS video_thumbnail
      FROM tv_queue q
      LEFT JOIN users u ON u.id = q.added_by_user_id
      LEFT JOIN posts p ON p.id = q.video_id
      WHERE q.family_id = ${familyId}
        AND q.channel_number = ${session.channel_number}
        AND q.played = FALSE
      ORDER BY q.position ASC
      LIMIT 10
    ` as unknown as {
      id: string;
      video_id: string;
      position: number;
      source: string;
      created_at: Date;
      added_by_name: string | null;
      video_thumbnail: string | null;
    }[];

    // Get active presence (who's watching)
    const presence = await sql`
      SELECT
        tp.user_id,
        tp.solo_mode,
        tp.joined_at,
        u.name AS user_name
      FROM tv_presence tp
      LEFT JOIN users u ON u.id = tp.user_id
      WHERE tp.session_id = ${session.id}
        AND tp.last_heartbeat_at > NOW() - INTERVAL '60 seconds'
      ORDER BY tp.joined_at ASC
    ` as unknown as {
      user_id: string;
      solo_mode: boolean;
      joined_at: Date;
      user_name: string | null;
    }[];

    return NextResponse.json({ session, queue, presence });
  } catch (err) {
    console.error("[GET /api/tv/sessions] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// POST /api/tv/sessions — Create a new TV session
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { familyId, videoId, channelNumber } = body as {
      familyId: string;
      videoId: string;
      channelNumber?: number;
    };

    if (!familyId || typeof familyId !== "string") {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const channel = channelNumber && channelNumber >= 1 && channelNumber <= 5 ? channelNumber : 1;

    // Verify membership
    const isMember = await verifyFamilyMembership(familyId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Look up the user's db id via clerk_id
    const userRows = await sql`
      SELECT id FROM users WHERE clerk_id = ${userId}
    ` as unknown as { id: string }[];

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }
    const dbUserId = userRows[0].id;

    // Deactivate any existing active session for this family
    await sql`
      UPDATE tv_sessions
      SET active = FALSE
      WHERE family_id = ${familyId} AND active = TRUE
    `;

    // Create the new session
    const sessions = await sql`
      INSERT INTO tv_sessions
        (family_id, video_id, broadcaster_id, playback_position_seconds, active, channel_number)
      VALUES (${familyId}, ${videoId}, ${dbUserId}, 0, TRUE, ${channel})
      RETURNING *
    ` as unknown as {
      id: string;
      family_id: string;
      video_id: string;
      broadcaster_id: string;
      playback_position_seconds: number;
      active: boolean;
      channel_number: number;
      started_at: Date;
      created_at: Date;
    }[];

    const session = sessions[0];

    // Add broadcaster to presence
    await sql`
      INSERT INTO tv_presence (session_id, user_id, solo_mode)
      VALUES (${session.id}, ${dbUserId}, FALSE)
      ON CONFLICT (session_id, user_id) DO UPDATE SET
        solo_mode = FALSE,
        last_heartbeat_at = NOW()
    `;

    // Record the video_change sync event
    await sql`
      INSERT INTO tv_sync_events
        (session_id, family_id, actor_id, action, playback_position_seconds, video_id)
      VALUES (${session.id}, ${familyId}, ${dbUserId}, 'video_change', 0, ${videoId})
    `;

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tv/sessions] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
