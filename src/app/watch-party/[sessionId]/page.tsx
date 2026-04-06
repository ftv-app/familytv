import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { buildRoomId } from "@/lib/watch-party/presence";
import { WatchPartyContainer } from "@/components/watch-party/WatchPartyContainer";

/* ============================================================
   Types
   ============================================================ */

interface WatchPartyPageProps {
  params: Promise<{ sessionId: string }>;
}

interface SessionInfo {
  familyId: string;
  videoId: string;
  active: boolean;
}

/* ============================================================
   Helpers
   ============================================================ */

async function getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.execute((db as any).sql`
      SELECT family_id, video_id, active
      FROM tv_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `) as { length: number; rows?: { family_id: string; video_id: string; active: boolean }[] };

    if (!result || result.length === 0 || !result.rows) {
      return null;
    }

    const row = result.rows[0];
    return {
      familyId: row.family_id,
      videoId: row.video_id,
      active: row.active,
    };
  } catch {
    return null;
  }
}

async function getVideoInfo(videoId: string): Promise<{ title: string; mediaUrl: string | null; posterUrl: string | null } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.execute((db as any).sql`
      SELECT title, media_url, poster_url
      FROM videos
      WHERE id = ${videoId}
      LIMIT 1
    `) as { length: number; rows?: { title: string; media_url: string | null; poster_url: string | null }[] };

    if (!result || result.length === 0 || !result.rows) {
      return null;
    }

    const row = result.rows[0];
    return {
      title: row.title,
      mediaUrl: row.media_url,
      posterUrl: row.poster_url,
    };
  } catch {
    return null;
  }
}

/* ============================================================
   Page Component (Server Component)
   ============================================================ */

export default async function WatchPartyPage({ params }: WatchPartyPageProps) {
  // ---- Auth ----
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();
  const userName =
    clerkUser?.firstName ??
    clerkUser?.username ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    "Family Member";

  // avatarUrl from Clerk's publicMetadata or imageUrl
  const avatarUrl =
    (clerkUser?.imageUrl && clerkUser.imageUrl !== "") ? clerkUser.imageUrl : undefined;

  // ---- Resolve sessionId from params ----
  const { sessionId } = await params;

  if (!sessionId) {
    redirect("/tv");
  }

  // ---- Fetch session info ----
  const session = await getSessionInfo(sessionId);
  if (!session) {
    redirect("/tv");
  }

  if (!session.active) {
    redirect("/tv");
  }

  // ---- Verify family membership ----
  try {
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, clerkUserId),
        eq(familyMemberships.familyId, session.familyId)
      ),
    });

    if (!membership) {
      // User is not a member of this family — redirect
      redirect("/tv");
    }
  } catch {
    redirect("/tv");
  }

  // ---- Fetch video info ----
  const videoInfo = await getVideoInfo(session.videoId);

  // ---- Build room ID ----
  // Format: family:{familyId}:video:{videoId}:session:{sessionId}
  const roomId = buildRoomId(session.familyId, session.videoId, sessionId);

  // ---- Demo video fallback (when DB video lookup fails) ----
  const DEMO_VIDEO = {
    videoUrl: videoInfo?.mediaUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    posterUrl: videoInfo?.posterUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    videoTitle: videoInfo?.title ?? "Family Watch Party",
    videoChosenBy: "Family Member",
  };

  // ---- Socket.IO URL ----
  // In production this comes from env var; default to same-host WebSocket upgrade
  const socketUrl = process.env.NEXT_PUBLIC_WATCHPARTY_SOCKET_URL ?? "";

  return (
    <div className="w-full h-screen overflow-hidden" style={{ backgroundColor: "#0D0D0F" }}>
      <WatchPartyContainer
        roomId={roomId}
        userId={clerkUserId}
        userName={userName}
        avatarUrl={avatarUrl}
        videoUrl={DEMO_VIDEO.videoUrl}
        videoTitle={DEMO_VIDEO.videoTitle}
        videoChosenBy={DEMO_VIDEO.videoChosenBy}
        posterUrl={DEMO_VIDEO.posterUrl}
        socketUrl={socketUrl}
      />
    </div>
  );
}
