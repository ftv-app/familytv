import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, comments, posts, familyMemberships } from "@/db";
import { eq, and, desc } from "drizzle-orm";

// GET /api/comments?postId=xxx
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  // Verify user is a member of the family that owns this post
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, post.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this family" }, { status: 403 });
  }

  const result = await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    orderBy: [desc(comments.createdAt)],
  });

  return NextResponse.json({ comments: result });
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { postId, content } = body;

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "postId and content required" }, { status: 400 });
  }

  // Verify user is a member of the family that owns this post
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, post.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this family" }, { status: 403 });
  }

  // Get user name from Clerk
  const user = await currentUser();
  const authorName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "Family Member";

  const [comment] = await db.insert(comments).values({
    postId,
    authorId: userId,
    authorName,
    content: content.trim(),
  }).returning();

  return NextResponse.json({ comment }, { status: 201 });
}

// DELETE /api/comments?id=xxx
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Get the comment and verify family membership
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, id),
    with: { post: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, comment.post.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this family" }, { status: 403 });
  }

  // Only the author can delete their own comment
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.authorId, userId)));
  return NextResponse.json({ success: true });
}
