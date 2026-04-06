export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, tags, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/* ============================================================
   GET /api/tags?familyId=xxx
   List all tags for a family (ordered by name)
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const familyId = req.nextUrl.searchParams.get("familyId");
    if (!familyId) {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }

    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Fetch tags for this family
    const familyTags = await db.query.tags.findMany({
      where: sql`${tags.familyId} = ${familyId}`,
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });

    // Get post count for each tag
    const tagsWithCounts = await Promise.all(
      familyTags.map(async (tag) => {
        const countResult = await db.execute(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (db as any).sql`SELECT COUNT(*) as count FROM media_tags WHERE tag_id = ${tag.id}`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (countResult as any[])[0]?.count ?? 0;
        return {
          id: tag.id,
          familyId: tag.familyId,
          name: tag.name,
          color: tag.color,
          createdBy: tag.createdBy,
          createdAt: tag.createdAt?.toISOString(),
          postCount: Number(count),
        };
      })
    );

    return NextResponse.json({ tags: tagsWithCounts });
  } catch (err) {
    console.error("[GET /api/tags] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/tags
   Create a new tag for a family
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const body = await req.json();
    const { familyId, name, color } = body as {
      familyId: string;
      name: string;
      color?: string;
    };

    if (!familyId) {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 64) {
      return NextResponse.json(
        { error: "name must be between 1 and 64 characters" },
        { status: 400 }
      );
    }

    // Validate color if provided
    const tagColor = color || "#6366f1";
    if (!/^#[0-9a-fA-F]{6}$/.test(tagColor)) {
      return NextResponse.json(
        { error: "color must be a valid hex color (e.g. #6366f1)" },
        { status: 400 }
      );
    }

    // Verify user is a member of this family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a family member" }, { status: 403 });
    }

    // Check for case-insensitive duplicate
    const existing = await db.query.tags.findFirst({
      where: and(
        sql`${tags.familyId} = ${familyId}`,
        sql`LOWER(${tags.name}) = ${trimmedName.toLowerCase()}`
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists in your family" },
        { status: 400 }
      );
    }

    // Create the tag
    const [newTag] = await db
      .insert(tags)
      .values({
        familyId,
        name: trimmedName,
        color: tagColor,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      tag: {
        id: newTag.id,
        familyId: newTag.familyId,
        name: newTag.name,
        color: newTag.color,
        createdBy: newTag.createdBy,
        createdAt: newTag.createdAt?.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tags] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}