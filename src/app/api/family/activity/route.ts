/**
 * CTM-38: What's Happening Now — Unified Ranked Activity Feed
 *
 * Replaces the basic chronological activity feed with a ranked feed
 * using the CTM-38 tiered weighted scoring algorithm.
 *
 * Ranking: recency×0.40 + engagement×0.35 + socialProximity×0.15 + semantic×0.10
 * Content types: posts (24h), comments-on-own-posts (72h), member-joins (7d)
 *
 * Privacy: Only surfaces content from the requesting user's family.
 * Actor names resolved from family_memberships or Clerk.
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db, posts, comments, reactions, calendarEvents, families, familyMemberships } from "@/db";
import { eq, and, desc, lt, inArray, sql, gte } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  rankActivities,
  computePostScore,
  computeCommentScore,
  computeMemberJoinScore,
  formatBirthdayDateLabel,
  daysUntilBirthday,
  type RankedPost,
  type RankedComment,
  type RankedMemberJoin,
  type RankedBirthday,
  type RankedActivityItem,
  type ScoreBreakdown,
} from "@/lib/activity/ranker";

// Rate limit: 60 requests per minute per user
const FAMILY_ACTIVITY_RATE_LIMIT = 60;
const FAMILY_ACTIVITY_RATE_WINDOW_MS = 60 * 1000;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Activity time windows (in hours)
const POST_WINDOW_HOURS = 24;
const COMMENT_WINDOW_HOURS = 72;
const MEMBER_JOIN_WINDOW_HOURS = 168; // 7 days
const BIRTHDAY_WINDOW_DAYS = 30;

// ============================================
// API Response Types (aligned with CTM-38 spec)
// ============================================

interface Actor {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
}

interface ActivityMeta {
  totalItems: number;
  hasMore: boolean;
  pollingHint: string;
  sections: {
    posts: { count: number; newestAt: string | null };
    comments: { count: number; newestAt: string | null };
    members: { count: number; newestAt: string | null };
    birthdays: { count: number; nextBirthdayAt: string | null };
  };
  generatedAt: string;
}

interface RankedActivityResponse {
  familyId: string;
  familyName: string;
  items: RankedActivityItem[];
  nextCursor: string | null;
  meta: ActivityMeta;
}

// ============================================
// Helper: Get user family membership
// ============================================

async function getUserFamilyMembership(userId: string, familyIdParam?: string | null) {
  if (familyIdParam) {
    return db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyIdParam)
      ),
      with: { family: true },
    });
  }
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    orderBy: [desc(familyMemberships.joinedAt)],
    limit: 1,
  });
  return memberships[0] || null;
}

// ============================================
// Helper: Resolve actor names from family memberships
// ============================================

async function resolveActorsFromMemberships(
  userIds: string[],
  familyId: string
): Promise<Map<string, Actor>> {
  if (userIds.length === 0) return new Map();

  const memberships = await db.query.familyMemberships.findMany({
    where: and(
      eq(familyMemberships.familyId, familyId),
      inArray(familyMemberships.userId, userIds)
    ),
  });

  const actorMap = new Map<string, Actor>();
  const unresolvedIds = new Set<string>();

  for (const m of memberships) {
    actorMap.set(m.userId, {
      id: m.userId,
      name: m.displayName || m.userId.slice(0, 8),
      avatarUrl: undefined,
      initials: (m.displayName || m.userId.slice(0, 2)).toUpperCase(),
    });
    unresolvedIds.delete(m.userId);
  }

  // Resolve unresolved user IDs via Clerk (bulk fetch)
  if (unresolvedIds.size > 0) {
    try {
      const client = await clerkClient();
      // Clerk allows fetching multiple users at once via getUserList
      // We'll do individual fetches for now to avoid complexity
      for (const uid of unresolvedIds) {
        try {
          const user = await client.users.getUser(uid);
          actorMap.set(uid, {
            id: uid,
            name: user.fullName || user.primaryEmailAddress?.emailAddress || uid.slice(0, 8),
            avatarUrl: user.imageUrl || undefined,
            initials: (user.fullName || uid.slice(0, 2)).toUpperCase().slice(0, 2),
          });
        } catch {
          actorMap.set(uid, { id: uid, name: uid.slice(0, 8), initials: uid.slice(0, 2).toUpperCase() });
        }
      }
    } catch {
      // Clerk resolution failed, use userId prefixes
      for (const uid of unresolvedIds) {
        actorMap.set(uid, { id: uid, name: uid.slice(0, 8), initials: uid.slice(0, 2).toUpperCase() });
      }
    }
  }

  return actorMap;
}

// ============================================
// Helper: Compute post scores with engagement
// ============================================

interface PostWithCounts extends RankedPost {
  reactionCount: number;
  commentCount: number;
}

async function computePostScores(
  familyPosts: typeof posts.$inferSelect[],
  familyId: string
): Promise<PostWithCounts[]> {
  if (familyPosts.length === 0) return [];

  const postIds = familyPosts.map((p) => p.id);
  const now = new Date();
  const windowStart = new Date(now.getTime() - POST_WINDOW_HOURS * 60 * 60 * 1000);

  // Count reactions per post
  const reactionCounts = await db.query.reactions.findMany({
    where: and(
      inArray(reactions.postId, postIds),
      gte(reactions.createdAt, windowStart)
    ),
    columns: {
      postId: true,
    },
  });

  // Count comments per post
  const commentCounts = await db.query.comments.findMany({
    where: and(
      inArray(comments.postId, postIds),
      gte(comments.createdAt, windowStart)
    ),
    columns: {
      postId: true,
    },
  });

  // Aggregate
  const reactionMap = new Map<string, number>();
  const commentMap = new Map<string, number>();
  for (const r of reactionCounts) reactionMap.set(r.postId, (reactionMap.get(r.postId) ?? 0) + 1);
  for (const c of commentCounts) commentMap.set(c.postId, (commentMap.get(c.postId) ?? 0) + 1);

  // Find max engagement for normalization
  let maxEngagement = 0;
  for (const post of familyPosts) {
    const eng = (reactionMap.get(post.id) ?? 0) + (commentMap.get(post.id) ?? 0) * 2;
    if (eng > maxEngagement) maxEngagement = eng;
  }

  // Resolve all author IDs
  const authorIds = [...new Set(familyPosts.map((p) => p.authorId))];
  const actors = await resolveActorsFromMemberships(authorIds, familyId);

  // Compute scores
  return familyPosts.map((p): PostWithCounts => {
    const ageInHours = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60);
    const reactionCount = reactionMap.get(p.id) ?? 0;
    const commentCount = commentMap.get(p.id) ?? 0;
    const totalEngagement = reactionCount + commentCount * 2;

    const score = computePostScore({
      ageInHours,
      reactionCount,
      commentCount,
      isTopInteractor: false, // v1: no interaction tracking yet
      maxEngagementInWindow: maxEngagement || 1,
    });

    const recencyScore = Math.max(0, 1 - ageInHours / POST_WINDOW_HOURS);
    const engagementScore = maxEngagement > 0
      ? Math.min(1.0, totalEngagement / maxEngagement)
      : 0;

    const scoreBreakdown: ScoreBreakdown = {
      recency: recencyScore,
      engagement: engagementScore,
      socialProximity: 0.5, // v1: no interaction tracking
    };

    const author = actors.get(p.authorId) ?? {
      id: p.authorId,
      name: p.authorName,
      initials: p.authorName.slice(0, 2).toUpperCase(),
    };

    return {
      id: p.id,
      type: "post",
      score,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: author.id,
        name: author.name,
        avatar: author.avatarUrl ?? null,
      },
      content: {
        contentType: p.contentType,
        mediaUrl: p.mediaUrl,
        caption: p.caption,
      },
      reactionCount,
      commentCount,
    };
  });
}

// ============================================
// Helper: Compute comment scores (own-post comments only)
// ============================================

async function computeCommentScores(
  userId: string,
  familyPosts: typeof posts.$inferSelect[],
  familyId: string
): Promise<RankedComment[]> {
  // Get only comments on posts authored by the requesting user
  const ownPostIds = familyPosts.filter((p) => p.authorId === userId).map((p) => p.id);
  if (ownPostIds.length === 0) return [];

  const now = new Date();
  const windowStart = new Date(now.getTime() - COMMENT_WINDOW_HOURS * 60 * 60 * 1000);

  const ownComments = await db.query.comments.findMany({
    where: and(
      inArray(comments.postId, ownPostIds),
      gte(comments.createdAt, windowStart),
      // Don't include the user's own comments on their own posts
      // (we want comments FROM others ON the user's posts)
      sql`${comments.authorId} != ${userId}`
    ),
    orderBy: [desc(comments.createdAt)],
    limit: 50,
  });

  if (ownComments.length === 0) return [];

  // Get reaction counts for parent posts
  const parentPostIds = [...new Set(ownComments.map((c) => c.postId))] as string[];
  const allReactionsForComments = await db.query.reactions.findMany({
    where: and(inArray(reactions.postId, parentPostIds)),
    columns: { postId: true },
  });
  const reactionMap = new Map<string, number>();
  for (const r of allReactionsForComments) {
    const pid = (r as { postId: string }).postId;
    reactionMap.set(pid, (reactionMap.get(pid) ?? 0) + 1);
  }

  // Get the parent posts for context
  const parentPostsMap = new Map<string, typeof posts.$inferSelect>();
  for (const p of familyPosts) parentPostsMap.set(p.id, p);

  // Get unique author IDs from comments
  const commentAuthorIds = [...new Set(ownComments.map((c) => c.authorId))] as string[];
  const actors = await resolveActorsFromMemberships(commentAuthorIds, familyId);

  let maxReactions = 0;
  for (const [, count] of reactionMap) if (count > maxReactions) maxReactions = count;

  return ownComments.map((c): RankedComment => {
    const ageInHours = (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
    const parentPost = parentPostsMap.get(c.postId);
    const parentReactionCount = reactionMap.get(c.postId) ?? 0;

    const score = computeCommentScore({
      ageInHours,
      isOnOwnPost: true, // All these comments are on the requesting user's posts
      parentPostReactionCount: parentReactionCount,
      isTopInteractor: false,
      maxReactionsInWindow: maxReactions || 1,
    });

    const recencyScore = Math.max(0, 1 - ageInHours / COMMENT_WINDOW_HOURS);
    const engagementScore = maxReactions > 0
      ? Math.min(1.0, parentReactionCount / maxReactions)
      : 0;

    const author = actors.get(c.authorId) ?? {
      id: c.authorId,
      name: c.authorName,
      avatarUrl: undefined as string | undefined,
      initials: c.authorName.slice(0, 2).toUpperCase(),
    };

    return {
      id: c.id,
      type: "comment",
      score,
      createdAt: c.createdAt.toISOString(),
      postId: c.postId,
      author: {
        id: author.id,
        name: author.name,
        avatar: author.avatarUrl ?? null,
      },
      content: c.content,
      isOnOwnPost: true,
    };
  });
}

// ============================================
// Helper: Compute member join scores
// ============================================

async function computeMemberJoinScores(
  familyId: string,
  userId: string
): Promise<RankedMemberJoin[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - MEMBER_JOIN_WINDOW_HOURS * 60 * 60 * 1000);

  const recentMemberships = await db.query.familyMemberships.findMany({
    where: and(
      eq(familyMemberships.familyId, familyId),
      gte(familyMemberships.joinedAt, windowStart)
    ),
    orderBy: [desc(familyMemberships.joinedAt)],
    limit: 20,
  });

  // Filter out the requesting user (you didn't "join" your own family)
  const otherMembers = recentMemberships.filter((m) => m.userId !== userId);
  if (otherMembers.length === 0) return [];

  // Get actors for the new members
  const newMemberIds = otherMembers.map((m) => m.userId);
  const actors = await resolveActorsFromMemberships(newMemberIds, familyId);

  return otherMembers.map((m): RankedMemberJoin => {
    const ageInHours = (now.getTime() - m.joinedAt.getTime()) / (1000 * 60 * 60);
    const score = computeMemberJoinScore({
      ageInHours,
      invitedByTopInteractor: false, // v1: no invitation tracking
    });

    const actor = actors.get(m.userId) ?? {
      id: m.userId,
      name: m.displayName || m.userId.slice(0, 8),
      avatarUrl: undefined as string | undefined,
      initials: (m.displayName || m.userId.slice(0, 2)).toUpperCase(),
    };

    return {
      id: m.id,
      type: "member_join",
      score,
      createdAt: m.joinedAt.toISOString(),
      actor: {
        id: actor.id,
        name: actor.name,
        avatar: actor.avatarUrl ?? null,
      },
    };
  });
}

// ============================================
// GET /api/family/activity
// ============================================

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const familyIdParam = searchParams.get("familyId");
    const limitParam = searchParams.get("limit");
    const typesParam = searchParams.get("types");
    const sinceParam = searchParams.get("since");

    // Validate limit before any normalization
    if (limitParam !== null) {
      const parsed = parseInt(limitParam, 10);
      if (isNaN(parsed)) {
        return NextResponse.json({ error: "limit must be between 1 and 50" }, { status: 400 });
      }
      if (parsed < 1 || parsed > MAX_LIMIT) {
        return NextResponse.json({ error: "limit must be between 1 and 50" }, { status: 400 });
      }
    }

    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

    // Validate cursor (ISO8601 timestamp)
    const cursorParam = searchParams.get("cursor");
    if (cursorParam) {
      const parsed = new Date(cursorParam);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid cursor format" }, { status: 400 });
      }
    }

    // Parse since (ISO8601 for delta polling)
    let sinceDate: Date | undefined;
    if (sinceParam) {
      const parsed = new Date(sinceParam);
      if (!isNaN(parsed.getTime())) sinceDate = parsed;
    }

    // Rate limiting
    const rateLimitKey = `family-activity:${userId}`;
    const { allowed, resetAt } = checkRateLimit(
      rateLimitKey,
      FAMILY_ACTIVITY_RATE_LIMIT,
      FAMILY_ACTIVITY_RATE_WINDOW_MS
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: resetAt - Date.now() },
        { status: 429 }
      );
    }

    // Get family membership
    const membership = await getUserFamilyMembership(userId, familyIdParam);
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
    }

    const familyId = membership.familyId;
    const familyName = membership.family.name;

    const now = new Date();
    const postWindowStart = new Date(now.getTime() - POST_WINDOW_HOURS * 60 * 60 * 1000);

    // ---- Fetch posts (24h window) ----
    const postsWhere = sinceDate
      ? and(eq(posts.familyId, familyId), gte(posts.createdAt, sinceDate))
      : eq(posts.familyId, familyId);

    const familyPosts = await db.query.posts.findMany({
      where: postsWhere,
      orderBy: [desc(posts.createdAt)],
      limit: 100, // Fetch extra for ranking; apply limit at end
    });

    // ---- Compute ranked posts ----
    const rankedPosts = await computePostScores(familyPosts, familyId);

    // ---- Compute ranked comments (own-post comments only) ----
    const rankedComments = await computeCommentScores(userId, familyPosts, familyId);

    // ---- Compute member join scores ----
    const rankedMemberJoins = await computeMemberJoinScores(familyId, userId);

    // ---- Birthday items (CTM-38 v1: family memberships birthday columns) ----
    // Note: birthday surfacing requires birthdayMonthDay column in family_memberships.
    // When that migration lands, uncomment the birthday query below.
    const rankedBirthdays: RankedBirthday[] = [];
    // const rankedBirthdays = await computeBirthdayScores(familyId);

    // ---- Rank all items ----
    const allItems = rankActivities({
      posts: rankedPosts,
      comments: rankedComments,
      memberJoins: rankedMemberJoins,
      birthdays: rankedBirthdays,
    }, limit);

    // ---- Build response metadata ----
    const newestPostAt = rankedPosts.length > 0 ? rankedPosts[0].createdAt : null;
    const newestCommentAt = rankedComments.length > 0 ? rankedComments[0].createdAt : null;
    const newestMemberAt = rankedMemberJoins.length > 0 ? rankedMemberJoins[0].createdAt : null;
    const nextBirthday = rankedBirthdays.length > 0 ? rankedBirthdays[0].createdAt : null;

    const hasMore = allItems.length === limit;
    const responseItems = hasMore ? allItems.slice(0, limit) : allItems;
    const nextCursor = hasMore && responseItems.length > 0
      ? responseItems[responseItems.length - 1].createdAt
      : null;

    const response: RankedActivityResponse = {
      familyId,
      familyName,
      items: responseItems,
      nextCursor,
      meta: {
        totalItems: allItems.length,
        hasMore,
        // Recommend polling 60s for posts/comments, 5min for member joins
        pollingHint: new Date(Date.now() + 60_000).toISOString(),
        sections: {
          posts: { count: rankedPosts.length, newestAt: newestPostAt },
          comments: { count: rankedComments.length, newestAt: newestCommentAt },
          members: { count: rankedMemberJoins.length, newestAt: newestMemberAt },
          birthdays: { count: rankedBirthdays.length, nextBirthdayAt: nextBirthday },
        },
        generatedAt: now.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/family/activity] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
