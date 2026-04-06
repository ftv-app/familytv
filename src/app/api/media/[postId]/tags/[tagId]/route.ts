export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, mediaTags, posts, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";

/* ============================================================
   DELETE /api/media/:postId/tags/:tagId
   Remove a tag from a post.
   ============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; tagId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, tagId } = await params;

    if (!postId || !tagId) {
      return NextResponse.json(
        { error: "postId and tagId are required" },
        { status: 400 }
      );
    }

    // Look up the post
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify user is a member of this post's family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, post.familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Check if the media tag association exists
    const existingMediaTag = await db.query.mediaTags.findFirst({
      where: and(eq(mediaTags.postId, postId), eq(mediaTags.tagId, tagId)),
    });

    if (!existingMediaTag) {
      return NextResponse.json(
        { error: "Tag is not applied to this post" },
        { status: 404 }
      );
    }

    // Delete the association
    await db.delete(mediaTags).where(eq(mediaTags.id, existingMediaTag.id));

    return NextResponse.json({ removed: true });
  } catch (err) {
    console.error("[DELETE /api/media/:postId/tags/:tagId] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
