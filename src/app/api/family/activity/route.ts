export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts, comments, reactions, calendarEvents, families, familyMemberships } from "@/db";
import { eq, and, desc, lt, inArray } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limiter";

// Rate limit: 60 requests per minute per user (family activity feed)
const FAMILY_ACTIVITY_RATE_LIMIT = 60;
const FAMILY_ACTIVITY_RATE_WINDOW_MS = 60 * 1000;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Types
interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'reaction' | 'event';
  actor: {
    name: string;
    avatar: string | null;
  };
  content: Record<string, unknown>;
  createdAt: string;
}

interface ActivityFeedResponse {
  items: ActivityItem[];
  nextCursor: string | null;
  familyName: string;
}

/**
 * Get the user's family membership.
 * If familyId is provided in query params, validate membership.
 * Otherwise, return the user's first/primary family membership.
 */
async function getUserFamilyMembership(userId: string, familyIdParam?: string | null) {
  if (familyIdParam) {
    // Validate membership for the specified family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyIdParam)
      ),
      with: { family: true },
    });
    return membership;
  }

  // No familyId provided - get the user's first family membership
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    orderBy: [desc(familyMemberships.joinedAt)],
    limit: 1,
  });

  return memberships[0] || null;
}

// GET /api/family/activity
// Returns: { items: Activity[], nextCursor: string | null, familyName: string }
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const familyIdParam = searchParams.get("familyId");
    const cursor = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      return NextResponse.json(
        { error: `limit must be between 1 and ${MAX_LIMIT}` },
        { status: 400 }
      );
    }

    // Parse cursor - expected to be an ISO timestamp
    let cursorDate: Date | undefined;
    if (cursor) {
      const parsed = new Date(cursor);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid cursor format" }, { status: 400 });
      }
      cursorDate = parsed;
    }

    // Rate limiting per user
    const rateLimitKey = `family-activity:${userId}`;
    const { allowed, remaining, resetAt } = checkRateLimit(
      rateLimitKey,
      FAMILY_ACTIVITY_RATE_LIMIT,
      FAMILY_ACTIVITY_RATE_WINDOW_MS
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfterMs: resetAt - Date.now(),
        },
        { status: 429 }
      );
    }

    // Get user's family membership
    const membership = await getUserFamilyMembership(userId, familyIdParam);
    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this family" },
        { status: 403 }
      );
    }

    const familyId = membership.familyId;
    const familyName = membership.family.name;

    // Build cursor-aware where clause for posts/events
    const postsWhere = cursorDate
      ? and(eq(posts.familyId, familyId), lt(posts.createdAt, cursorDate))
      : eq(posts.familyId, familyId);

    const eventsWhere = cursorDate
      ? and(eq(calendarEvents.familyId, familyId), lt(calendarEvents.createdAt, cursorDate))
      : eq(calendarEvents.familyId, familyId);

    // Fetch posts and events
    const [familyPosts, familyEvents] = await Promise.all([
      db.query.posts.findMany({
        where: postsWhere,
        orderBy: [desc(posts.createdAt)],
        limit,
      }),
      db.query.calendarEvents.findMany({
        where: eventsWhere,
        orderBy: [desc(calendarEvents.createdAt)],
        limit,
      }),
    ]);

    // Get post IDs for fetching comments/reactions
    const postIds = familyPosts.map(p => p.id);

    // Fetch comments and reactions for these posts
    let familyComments: typeof comments.$inferSelect[] = [];
    let familyReactions: typeof reactions.$inferSelect[] = [];

    if (postIds.length > 0) {
      const commentsWhere = cursorDate
        ? and(inArray(comments.postId, postIds), lt(comments.createdAt, cursorDate))
        : inArray(comments.postId, postIds);

      const reactionsWhere = cursorDate
        ? and(inArray(reactions.postId, postIds), lt(reactions.createdAt, cursorDate))
        : inArray(reactions.postId, postIds);

      const [commentsResult, reactionsResult] = await Promise.all([
        db.query.comments.findMany({
          where: commentsWhere,
          orderBy: [desc(comments.createdAt)],
          limit,
        }),
        db.query.reactions.findMany({
          where: reactionsWhere,
          orderBy: [desc(reactions.createdAt)],
          limit,
        }),
      ]);

      familyComments = commentsResult;
      familyReactions = reactionsResult;
    }

    // Transform into activity items
    const activities: ActivityItem[] = [
      ...familyPosts.map((p) => ({
        id: p.id,
        type: 'post' as const,
        actor: {
          name: p.authorName,
          avatar: null,
        },
        content: {
          contentType: p.contentType,
          mediaUrl: p.mediaUrl,
          caption: p.caption,
        },
        createdAt: p.createdAt.toISOString(),
      })),
      ...familyComments.map((c) => ({
        id: c.id,
        type: 'comment' as const,
        actor: {
          name: c.authorName,
          avatar: null,
        },
        content: {
          postId: c.postId,
          content: c.content,
        },
        createdAt: c.createdAt.toISOString(),
      })),
      ...familyReactions.map((r) => ({
        id: r.id,
        type: 'reaction' as const,
        actor: {
          name: r.userId, // We don't store user name for reactions, use userId
          avatar: null,
        },
        content: {
          postId: r.postId,
          emoji: r.emoji,
        },
        createdAt: r.createdAt.toISOString(),
      })),
      ...familyEvents.map((e) => ({
        id: e.id,
        type: 'event' as const,
        actor: {
          name: e.createdBy,
          avatar: null,
        },
        content: {
          title: e.title,
          description: e.description,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() || null,
          allDay: e.allDay,
        },
        createdAt: e.createdAt.toISOString(),
      })),
    ];

    // Sort all activities by createdAt descending
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit and determine next cursor
    const paginatedActivities = activities.slice(0, limit);
    const hasMore = activities.length > limit;
    const nextCursor = hasMore && paginatedActivities.length > 0
      ? paginatedActivities[paginatedActivities.length - 1].createdAt
      : null;

    const response: ActivityFeedResponse = {
      items: paginatedActivities,
      nextCursor,
      familyName,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/family/activity] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
