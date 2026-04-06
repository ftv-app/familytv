export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, tags, mediaTags, posts, familyMemberships } from "@/db";
import { eq, and, desc } from "drizzle-orm";

/* ============================================================
   GET /api/tags/:id/posts
   List all posts tagged with a given tag (within a family)
   ============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { id: tagId } = await params;

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    // Look up the tag
    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Verify user is a member of this tag's family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, tag.familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Get all media_tag entries for this tag, joined with posts
    const taggedPosts = await db.query.mediaTags.findMany({
      where: eq(mediaTags.tagId, tagId),
      with: {
        post: true,
      },
      orderBy: [desc(mediaTags.createdAt)],
    });

    const postList = taggedPosts
      .map((mt) => mt.post)
      .filter((p) => p !== null)
      .map((post) => ({
        id: post.id,
        familyId: post.familyId,
        authorId: post.authorId,
        authorName: post.authorName,
        contentType: post.contentType,
        mediaUrl: post.mediaUrl,
        caption: post.caption,
        createdAt: post.createdAt?.toISOString(),
        updatedAt: post.updatedAt?.toISOString(),
      }));

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        familyId: tag.familyId,
      },
      posts: postList,
      total: postList.length,
    });
  } catch (err) {
    console.error("[GET /api/tags/:id/posts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
