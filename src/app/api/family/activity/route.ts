import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts, calendarEvents, familyMemberships } from "@/db";
import { eq, and, lt, desc, or } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface ActivityItem {
  id: string;
  type: "post" | "event";
  familyId: string;
  authorId: string | null;
  authorName: string | null;
  timestamp: Date;
  thumbnail: string | null;
  title: string | null;
  createdAt: Date;
}

// GET /api/family/activity - Get family activity feed
// Query params:
//   - familyId: optional (if not provided, uses user's first family)
//   - lastSeenId: cursor for pagination (item id)
//   - limit: number of items per page (default 20, max 50)
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyIdParam = searchParams.get("familyId");
  const lastSeenId = searchParams.get("lastSeenId");
  const limitParam = searchParams.get("limit");
  const limit = Math.min(
    parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  // If familyId provided, verify membership
  // Otherwise get user's first family
  let targetFamilyId: string | null = familyIdParam;

  if (targetFamilyId) {
    // Verify membership for specified family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, targetFamilyId)
      ),
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this family" },
        { status: 403 }
      );
    }
  } else {
    // Get user's first family membership
    const memberships = await db.query.familyMemberships.findMany({
      where: eq(familyMemberships.userId, userId),
      limit: 1,
    });

    if (memberships.length === 0) {
      return NextResponse.json(
        { error: "User is not a member of any family" },
        { status: 403 }
      );
    }

    targetFamilyId = memberships[0].familyId;
  }

  // Fetch posts and events in parallel
  const [postsData, eventsData] = await Promise.all([
    db.query.posts.findMany({
      where: eq(posts.familyId, targetFamilyId!),
      orderBy: [desc(posts.createdAt)],
      limit: limit + 1, // Fetch one extra to determine if there are more
    }),
    db.query.calendarEvents.findMany({
      where: eq(calendarEvents.familyId, targetFamilyId!),
      orderBy: [desc(calendarEvents.startDate)],
      limit: limit + 1,
    }),
  ]);

  // Transform posts to activity items
  const postActivities: ActivityItem[] = postsData.map((post) => ({
    id: post.id,
    type: "post" as const,
    familyId: post.familyId,
    authorId: post.authorId,
    authorName: post.authorName,
    timestamp: post.createdAt,
    thumbnail: post.mediaUrl,
    title: post.caption,
    createdAt: post.createdAt,
  }));

  // Transform events to activity items
  const eventActivities: ActivityItem[] = eventsData.map((event) => ({
    id: event.id,
    type: "event" as const,
    familyId: event.familyId,
    authorId: event.createdBy,
    authorName: null, // Events don't have authorName in schema
    timestamp: event.startDate,
    thumbnail: null, // Events don't have thumbnails
    title: event.title,
    createdAt: event.createdAt,
  }));

  // Merge and sort all activities by timestamp (newest first)
  const allActivities = [...postActivities, ...eventActivities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Apply cursor-based pagination if lastSeenId provided
  let paginatedActivities = allActivities;
  if (lastSeenId) {
    const lastSeenIndex = allActivities.findIndex(
      (item) => item.id === lastSeenId
    );
    if (lastSeenIndex !== -1) {
      paginatedActivities = allActivities.slice(
        0,
        lastSeenIndex === -1 ? limit : limit
      );
    }
  } else {
    paginatedActivities = allActivities.slice(0, limit);
  }

  // Determine if there are more items
  const hasMore = allActivities.length > limit;

  return NextResponse.json(
    {
      activities: paginatedActivities,
      hasMore,
      nextCursor: hasMore && paginatedActivities.length > 0
        ? paginatedActivities[paginatedActivities.length - 1].id
        : null,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
