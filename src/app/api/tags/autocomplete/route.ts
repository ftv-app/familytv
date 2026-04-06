export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, tags, familyMemberships } from "@/db";
import { and, eq, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";

/* ============================================================
   GET /api/tags/autocomplete?familyId=xxx&q=xxx
   Autocomplete tag names for a family (for inline creation UX)
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const familyId = req.nextUrl.searchParams.get("familyId");
    const query = req.nextUrl.searchParams.get("q");

    if (!familyId) {
      return NextResponse.json({ error: "familyId is required" }, { status: 400 });
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "q (search query) is required" }, { status: 400 });
    }

    const trimmedQuery = query.trim().toLowerCase();

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

    // Fetch matching tags (case-insensitive prefix match, max 10)
    const matchingTags = await db.query.tags.findMany({
      where: and(
        sql`${tags.familyId} = ${familyId}`,
        ilike(tags.name, `${trimmedQuery}%`)
      ),
      limit: 10,
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });

    const results = matchingTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }));

    return NextResponse.json({ tags: results });
  } catch (err) {
    console.error("[GET /api/tags/autocomplete] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}