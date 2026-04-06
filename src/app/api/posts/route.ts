export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts, familyMemberships, mediaTags, tags } from "@/db";
import { eq, and, desc, lt, sql } from "drizzle-orm";

// GET /api/posts?familyId=xxx&tagId=yyy&cursor=xxx&limit=20
// Supports optional tagId filter (cursor-based pagination) for tag browse page
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const tagId = searchParams.get("tagId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
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

  // Build the base query: posts for this family
  let baseWhere = eq(posts.familyId, familyId);

  // If filtering by tagId, first get matching postIds from media_tags
  if (tagId) {
    // Verify the tag belongs to this family
    const tag = await db.query.tags.findFirst({
      where: and(eq(tags.id, tagId), eq(tags.familyId, familyId)),
    });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found in this family" }, { status: 404 });
    }

    // Get postIds that have this tag
    const taggedPostIds = await db.query.mediaTags.findMany({
      where: eq(mediaTags.tagId, tagId),
      columns: { postId: true },
    });
    const postIds = taggedPostIds.map((mt) => mt.postId);

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }

    // Override with postIds matching the tag filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseWhere = and(baseWhere, sql`${posts.id} = ANY(${postIds})`) as any;
  }

  // Cursor-based pagination: cursor is a post id, find posts older than the cursor's createdAt
  let paginatedPosts;
  if (cursor) {
    // Look up the cursor post to get its serverTimestamp
    const cursorPost = await db.query.posts.findFirst({
      where: eq(posts.id, cursor),
    });
    if (cursorPost) {
      paginatedPosts = await db.query.posts.findMany({
        where: and(
          baseWhere,
          lt(posts.createdAt, cursorPost.createdAt)
        ),
        orderBy: [desc(posts.createdAt)],
        limit: limit + 1, // fetch one extra to determine if there's a next page
      });
    } else {
      paginatedPosts = await db.query.posts.findMany({
        where: baseWhere,
        orderBy: [desc(posts.createdAt)],
        limit: limit + 1,
      });
    }
  } else {
    paginatedPosts = await db.query.posts.findMany({
      where: baseWhere,
      orderBy: [desc(posts.createdAt)],
      limit: limit + 1,
    });
  }

  // Determine if there's a next page
  const hasNextPage = paginatedPosts.length > limit;
  const pagePosts = hasNextPage ? paginatedPosts.slice(0, limit) : paginatedPosts;
  const nextCursor = hasNextPage && pagePosts.length > 0 ? pagePosts[pagePosts.length - 1].id : null;

  // Attach tags to each post
  const postIds = pagePosts.map((p) => p.id);
  const allMediaTags = postIds.length > 0
    ? await db.query.mediaTags.findMany({
        where: sql`${mediaTags.postId} = ANY(${postIds})`,
      })
    : [];

  const tagIds = [...new Set(allMediaTags.map((mt) => mt.tagId))];
  const tagRecords = tagIds.length > 0
    ? await db.query.tags.findMany({
        where: sql`${tags.id} = ANY(${tagIds})`,
      })
    : [];

  const tagById = Object.fromEntries(tagRecords.map((t) => [t.id, { id: t.id, name: t.name, color: t.color }]));
  const tagsByPostId: Record<string, { id: string; name: string; color: string }[]> = {};
  for (const mt of allMediaTags) {
    if (!tagsByPostId[mt.postId]) tagsByPostId[mt.postId] = [];
    if (tagById[mt.tagId]) tagsByPostId[mt.postId].push(tagById[mt.tagId]);
  }

  const postsWithTags = pagePosts.map(({ authorId: _authorId, ...rest }) => ({
    ...rest,
    tags: tagsByPostId[rest.id] ?? [],
  }));

  const response: { posts: typeof postsWithTags; nextCursor: string | null } = {
    posts: postsWithTags,
    nextCursor,
  };

  return NextResponse.json(response);
}

// POST /api/posts - create a new post
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { familyId, contentType, mediaUrl, caption } = body;

  if (!familyId || typeof familyId !== "string") {
    return NextResponse.json({ error: "Invalid family ID" }, { status: 400 });
  }

  if (!contentType || !["video", "image", "text"].includes(contentType)) {
    return NextResponse.json(
      { error: "contentType must be 'video', 'image', or 'text'" },
      { status: 400 }
    );
  }

  if (contentType !== "text" && (!mediaUrl || typeof mediaUrl !== "string")) {
    return NextResponse.json(
      { error: "mediaUrl is required for video/image posts" },
      { status: 400 }
    );
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

  // Get author name from Clerk user session
  // Clerk's auth() returns a merged auth object with user properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authObj = await auth() as any;
  const authorName =
    authObj.user?.fullName
    ?? authObj.user?.firstName
    ?? "Family member";

  const [post] = await db
    .insert(posts)
    .values({
      familyId,
      authorId: userId,
      authorName,
      contentType,
      mediaUrl: mediaUrl || null,
      caption: caption || null,
    })
    .returning();

  return NextResponse.json({ post }, { status: 201 });
}
