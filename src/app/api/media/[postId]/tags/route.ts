export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, tags, mediaTags, posts, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/* ============================================================
   POST /api/media/:postId/tags
   Apply one or more tags to a post.
   Creates tags inline if they don't exist.

   Body: { tags: [{ name: string, color?: string }] }
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const body = await req.json();
    const { tags: tagInputs } = body as {
      tags: Array<{ name: string; color?: string }>;
    };

    if (!Array.isArray(tagInputs) || tagInputs.length === 0) {
      return NextResponse.json(
        { error: "tags array is required and must not be empty" },
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

    const appliedTags: Array<{ id: string; name: string; color: string }> = [];

    for (const input of tagInputs) {
      const trimmedName = input.name?.trim();
      if (!trimmedName || trimmedName.length === 0 || trimmedName.length > 64) {
        continue; // skip invalid
      }

      const tagColor = input.color || "#6366f1";

      // Check if tag with this name already exists in this family (case-insensitive)
      const existingTag = await db.query.tags.findFirst({
        where: and(
          sql`${tags.familyId} = ${post.familyId}`,
          sql`LOWER(${tags.name}) = ${trimmedName.toLowerCase()}`
        ),
      });

      let tagId: string;
      let tagRecord: { id: string; name: string; color: string };

      if (existingTag) {
        tagId = existingTag.id;
        tagRecord = existingTag;
      } else {
        // Create a new tag
        const [newTag] = await db
          .insert(tags)
          .values({
            familyId: post.familyId,
            name: trimmedName,
            color: tagColor,
            createdBy: userId,
          })
          .returning();
        tagId = newTag.id;
        tagRecord = newTag;
      }

      // Check if this tag is already applied to this post
      const existingMediaTag = await db.query.mediaTags.findFirst({
        where: and(eq(mediaTags.postId, postId), eq(mediaTags.tagId, tagId)),
      });

      if (!existingMediaTag) {
        await db.insert(mediaTags).values({
          postId,
          tagId,
          createdBy: userId,
        });
      }

      appliedTags.push({
        id: tagRecord.id,
        name: tagRecord.name,
        color: tagRecord.color,
      });
    }

    return NextResponse.json({ tags: appliedTags });
  } catch (err) {
    console.error("[POST /api/media/:postId/tags] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ============================================================
   DELETE /api/media/:postId/tags/:tagId
   Remove a tag from a post.
   ============================================================ */
