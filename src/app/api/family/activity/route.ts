export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts, calendarEvents, familyMemberships } from "@/db";
import { eq, and, desc, lt, gte, lte, max } from "drizzle-orm";

// GET /api/family/activity?familyId=xxx&cursor=string&limit=20
// Returns: { activities[], quietMembers[], upcomingEvents[] }
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  if (isNaN(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: "limit must be between 1 and 50" }, { status: 400 });
  }

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  const now = new Date();
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Parse cursor - expected to be an ISO timestamp
  let cursorDate: Date | undefined;
  if (cursor) {
    const parsed = new Date(cursor);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid cursor format" }, { status: 400 });
    }
    cursorDate = parsed;
  }

  // 1. Fetch recent posts (activities with media content)
  const recentPosts = await db
    .select({
      id: posts.id,
      familyId: posts.familyId,
      authorId: posts.authorId,
      authorName: posts.authorName,
      contentType: posts.contentType,
      mediaUrl: posts.mediaUrl,
      caption: posts.caption,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.familyId, familyId),
        cursorDate ? lt(posts.createdAt, cursorDate) : undefined
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // 2. Fetch recent events
  const recentEvents = await db
    .select({
      id: calendarEvents.id,
      familyId: calendarEvents.familyId,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startDate: calendarEvents.startDate,
      endDate: calendarEvents.endDate,
      allDay: calendarEvents.allDay,
      createdBy: calendarEvents.createdBy,
      createdAt: calendarEvents.createdAt,
    })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.familyId, familyId),
        cursorDate ? lt(calendarEvents.createdAt, cursorDate) : undefined
      )
    )
    .orderBy(desc(calendarEvents.createdAt))
    .limit(limit);

  // Combine and sort activities by createdAt, capped at limit
  const activities = [
    ...recentPosts.map(p => ({
      id: p.id,
      type: 'post' as const,
      familyId: p.familyId,
      authorId: p.authorId,
      authorName: p.authorName,
      contentType: p.contentType,
      mediaUrl: p.mediaUrl,
      caption: p.caption,
      createdAt: p.createdAt,
    })),
    ...recentEvents.map(e => ({
      id: e.id,
      type: 'event' as const,
      familyId: e.familyId,
      title: e.title,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      allDay: e.allDay,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  // 3. Fetch quiet members (no posts in 21+ days)
  // Get all family members
  const familyMembers = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.familyId, familyId),
  });

  // Get last post date for each member
  const lastPostDates = await db
    .select({
      authorId: posts.authorId,
      lastPostAt: max(posts.createdAt),
    })
    .from(posts)
    .where(eq(posts.familyId, familyId))
    .groupBy(posts.authorId);

  const lastPostMap = new Map(lastPostDates.map(r => [r.authorId, r.lastPostAt]));

  const quietMembers = familyMembers
    .filter(m => {
      const lastPost = lastPostMap.get(m.userId);
      // A member is quiet if they have no posts OR their last post was 21+ days ago
      return !lastPost || new Date(lastPost) < twentyOneDaysAgo;
    })
    .map(m => ({
      memberId: m.userId,
      name: m.userId, // userId is the identifier; display name would require Clerk lookup
      lastActive: lastPostMap.get(m.userId) || null,
    }));

  // 4. Fetch upcoming events in next 14 days
  const upcomingEvents = await db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.familyId, familyId),
      gte(calendarEvents.startDate, now),
      lte(calendarEvents.startDate, fourteenDaysFromNow)
    ),
    orderBy: [calendarEvents.startDate],
  });

  const upcomingEventsFormatted = upcomingEvents.map(e => {
    const startDate = new Date(e.startDate);
    const daysAway = Math.ceil((startDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return {
      id: e.id,
      title: e.title,
      date: e.startDate,
      daysAway,
    };
  });

  return NextResponse.json({
    activities,
    quietMembers,
    upcomingEvents: upcomingEventsFormatted,
  });
}
