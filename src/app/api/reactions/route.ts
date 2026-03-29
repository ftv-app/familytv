import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, reactions } from "@/db";
import { eq, and, sql } from "drizzle-orm";

// GET /api/reactions?postId=xxx
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

  const result = await db
    .select({
      emoji: reactions.emoji,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(reactions)
    .where(eq(reactions.postId, postId))
    .groupBy(reactions.emoji);

  return NextResponse.json({ reactions: result });
}

// POST /api/reactions - add/update reaction
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { postId, emoji } = body;

  if (!postId || !emoji) {
    return NextResponse.json({ error: "postId and emoji required" }, { status: 400 });
  }

  // Upsert reaction
  await db
    .insert(reactions)
    .values({ postId, userId, emoji })
    .onConflictDoUpdate({
      target: [reactions.userId, reactions.postId],
      set: { emoji },
    });

  return NextResponse.json({ success: true });
}

// DELETE /api/reactions?postId=xxx
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  await db.delete(reactions).where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));
  return NextResponse.json({ success: true });
}
