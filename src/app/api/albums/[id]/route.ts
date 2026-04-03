export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, albums, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/albums/[id] - get a single album
export async function GET(req: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const album = await db.query.albums.findFirst({
    where: eq(albums.id, id),
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Verify user is a family member
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, album.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  return NextResponse.json({ album });
}

// PATCH /api/albums/[id] - update an album
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const album = await db.query.albums.findFirst({
    where: eq(albums.id, id),
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Verify user is a family member
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, album.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, coverUrl } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Album name cannot be empty" }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Album name must be 100 characters or less" }, { status: 400 });
    }
  }

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateValues.name = name.trim();
  if (description !== undefined) updateValues.description = description?.trim() || null;
  if (coverUrl !== undefined) updateValues.coverUrl = coverUrl || null;

  const [updated] = await db
    .update(albums)
    .set(updateValues)
    .where(eq(albums.id, id))
    .returning();

  return NextResponse.json({ album: updated });
}

// DELETE /api/albums/[id] - delete an album
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const album = await db.query.albums.findFirst({
    where: eq(albums.id, id),
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Verify user is a family member
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, album.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  await db.delete(albums).where(eq(albums.id, id));

  return NextResponse.json({ success: true });
}
