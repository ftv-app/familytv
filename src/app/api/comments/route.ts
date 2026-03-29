import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, comments } from "@/db";
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

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const body = await req.json();
  const { content } = body;

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "postId and content required" }, { status: 400 });
  }

  // Get user name from Clerk
  const { user } = await auth();
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

  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.authorId, userId)));
  return NextResponse.json({ success: true });
}
