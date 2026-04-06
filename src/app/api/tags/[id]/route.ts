export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, tags, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/* ============================================================
   DELETE /api/tags/:id
   Delete a tag (removes all media associations)
   ============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    // Look up the tag
    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
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

    // Delete the tag (cascade will remove media_tags associations)
    await db.delete(tags).where(eq(tags.id, id));

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/tags/:id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}