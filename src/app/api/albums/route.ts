export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, albums, familyMemberships } from "@/db";
import { eq, and, desc } from "drizzle-orm";

// GET /api/albums?familyId=xxx - list albums for a family
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

  const allAlbums = await db.query.albums.findMany({
    where: eq(albums.familyId, familyId),
    orderBy: [desc(albums.createdAt)],
  });

  return NextResponse.json({ albums: allAlbums });
}

// POST /api/albums - create a new album
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { familyId, name, description, coverUrl } = body;

  if (!familyId || typeof familyId !== "string") {
    return NextResponse.json({ error: "Invalid family ID" }, { status: 400 });
  }

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Album name is required" }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Album name must be 100 characters or less" }, { status: 400 });
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

  const [album] = await db
    .insert(albums)
    .values({
      familyId,
      name: name.trim(),
      description: description?.trim() || null,
      coverUrl: coverUrl || null,
      createdBy: userId,
    })
    .returning();

  return NextResponse.json({ album }, { status: 201 });
}
