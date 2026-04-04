import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, families, familyMemberships, posts, calendarEvents, comments, reactions } from "@/db";
import { eq, desc, count, inArray, lt } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";
import type { DashboardStats } from "./dashboard-client";
import type { FamilyMember, LastActivity } from "./dashboard-client";
import type { ActivityItem } from "@/components/feed/ActivityFeed";

export default async function DashboardPage() {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? null;
  } catch {
    redirect("/sign-in");
    return;
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Fetch real families from DB
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    orderBy: [desc(familyMemberships.joinedAt)],
  });

  const familiesData = await Promise.all(
    memberships.map(async (m) => {
      const memberResult = await db
        .select({ cnt: count() })
        .from(familyMemberships)
        .where(eq(familyMemberships.familyId, m.familyId));

      const postResult = await db
        .select({ cnt: count() })
        .from(posts)
        .where(eq(posts.familyId, m.familyId));

      return {
        id: m.family.id,
        name: m.family.name,
        memberCount: memberResult[0]?.cnt ?? 0,
        postCount: postResult[0]?.cnt ?? 0,
      };
    })
  );

  // Use the first family's name as the "channel callsign"
  const familyName = familiesData.length > 0 ? familiesData[0].name : undefined;

  // Fetch family members for presence indicators
  let familyMembers: FamilyMember[] = [];
  if (familiesData.length > 0) {
    const primaryFamilyId = familiesData[0].id;
    const memberRecords = await db.query.familyMemberships.findMany({
      where: eq(familyMemberships.familyId, primaryFamilyId),
      with: { family: false },
    });

    // For now, mark members as offline (we don't have real-time presence data)
    // The names come from Clerk — we use the cached authorName from posts if available
    familyMembers = memberRecords.map((m, i) => ({
      id: m.id,
      name: `Member ${i + 1}`,
      role: m.role,
      isOnline: false,
    }));
  }

  // Compute stats for the primary (first) family
  let stats: DashboardStats = { members: 0, postsThisWeek: 0, upcomingEvents: 0 };
  let lastActivity: LastActivity | null = null;
  let feedItems: ActivityItem[] = [];
  let feedCursor: string | null = null;

  if (familiesData.length > 0) {
    const primaryFamily = familiesData[0];

    const postsResult = await db
      .select({ cnt: count() })
      .from(posts)
      .where(eq(posts.familyId, primaryFamily.id));

    const eventsResult = await db
      .select({ cnt: count() })
      .from(calendarEvents)
      .where(eq(calendarEvents.familyId, primaryFamily.id));

    // Fetch the most recent post for "last activity" display
    const recentPosts = await db.query.posts.findMany({
      where: eq(posts.familyId, primaryFamily.id),
      orderBy: [desc(posts.createdAt)],
      limit: 1,
    });

    if (recentPosts.length > 0) {
      const latest = recentPosts[0];
      // eslint-disable-next-line react-hooks/purity -- Server component: Date.now() runs once per request
      const seconds = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
      let timeAgo: string;
      if (seconds < 60) {
        timeAgo = "just now";
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        timeAgo = `${mins} minute${mins > 1 ? "s" : ""} ago`;
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(seconds / 86400);
        timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
      }

      lastActivity = {
        authorName: latest.authorName,
        timeAgo,
        contentType: latest.contentType || "moment",
      };

      // Update family members with real names from recent posts
      if (familyMembers.length > 0 && recentPosts[0]) {
        familyMembers = familyMembers.map((member, i) => ({
          ...member,
          name: i === 0 ? recentPosts[0].authorName : `Member ${i + 1}`,
        }));
      }
    }

    stats = {
      members: primaryFamily.memberCount,
      postsThisWeek: postsResult[0]?.cnt ?? 0,
      upcomingEvents: eventsResult[0]?.cnt ?? 0,
    };

    // ── Fetch initial feed items (Activity Feed) ─────────────────────────────
    const INITIAL_FEED_LIMIT = 20;

    // Fetch posts and events for the family
    const [familyPosts, familyEvents] = await Promise.all([
      db.query.posts.findMany({
        where: eq(posts.familyId, primaryFamily.id),
        orderBy: [desc(posts.createdAt)],
        limit: INITIAL_FEED_LIMIT,
      }),
      db.query.calendarEvents.findMany({
        where: eq(calendarEvents.familyId, primaryFamily.id),
        orderBy: [desc(calendarEvents.createdAt)],
        limit: INITIAL_FEED_LIMIT,
      }),
    ]);

    // Get post IDs for fetching comments/reactions
    const postIds = familyPosts.map((p) => p.id);

    // Fetch comments and reactions for these posts
    let familyComments: typeof comments.$inferSelect[] = [];
    let familyReactions: typeof reactions.$inferSelect[] = [];

    if (postIds.length > 0) {
      const [commentsResult, reactionsResult] = await Promise.all([
        db.query.comments.findMany({
          where: inArray(comments.postId, postIds),
          orderBy: [desc(comments.createdAt)],
          limit: INITIAL_FEED_LIMIT,
        }),
        db.query.reactions.findMany({
          where: inArray(reactions.postId, postIds),
          orderBy: [desc(reactions.createdAt)],
          limit: INITIAL_FEED_LIMIT,
        }),
      ]);
      familyComments = commentsResult;
      familyReactions = reactionsResult;
    }

    // Transform into ActivityItems and sort by createdAt descending
    const activities: ActivityItem[] = [
      ...familyPosts.map((p) => ({
        id: p.id,
        type: "post" as const,
        actor: { name: p.authorName, avatar: null },
        content: {
          contentType: p.contentType ?? undefined,
          mediaUrl: p.mediaUrl ?? undefined,
          caption: p.caption ?? undefined,
        },
        createdAt: p.createdAt.toISOString(),
      })),
      ...familyComments.map((c) => ({
        id: c.id,
        type: "comment" as const,
        actor: { name: c.authorName, avatar: null },
        content: { postId: c.postId, content: c.content },
        createdAt: c.createdAt.toISOString(),
      })),
      ...familyReactions.map((r) => ({
        id: r.id,
        type: "reaction" as const,
        actor: { name: r.userId, avatar: null },
        content: { postId: r.postId, emoji: r.emoji },
        createdAt: r.createdAt.toISOString(),
      })),
      ...familyEvents.map((e) => ({
        id: e.id,
        type: "event" as const,
        actor: { name: e.createdBy, avatar: null },
        content: {
          title: e.title,
          description: e.description ?? undefined,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
          allDay: e.allDay ?? undefined,
        },
        createdAt: e.createdAt.toISOString(),
      })),
    ];

    // Sort by createdAt descending
    activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply limit and determine cursor
    feedItems = activities.slice(0, INITIAL_FEED_LIMIT);
    const hasMore = activities.length > INITIAL_FEED_LIMIT;
    const lastItem = feedItems[feedItems.length - 1];
    feedCursor = hasMore && lastItem ? lastItem.createdAt : null;
  }

  return (
    <DashboardClient
      firstName={firstName}
      email={email}
      families={familiesData}
      familyName={familyName}
      familyMembers={familyMembers}
      stats={stats}
      lastActivity={lastActivity}
      feedItems={feedItems}
      feedCursor={feedCursor}
    />
  );
}
