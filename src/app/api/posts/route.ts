export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts, familyMemberships } from "@/db";
import { eq, and, desc } from "drizzle-orm";

// GET /api/posts?familyId=xxx - list posts for a family
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

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

  const allPosts = await db.query.posts.findMany({
    where: eq(posts.familyId, familyId),
    orderBy: [desc(posts.createdAt)],
  });

  return NextResponse.json({ posts: allPosts });
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

  const [post] = await db
    .insert(posts)
    .values({
      familyId,
      authorId: userId,
      contentType,
      mediaUrl: mediaUrl || null,
      caption: caption || null,
    })
    .returning();

  return NextResponse.json({ post }, { status: 201 });
}
