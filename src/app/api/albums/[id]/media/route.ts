import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, albums, familyMemberships, posts } from "@/db";
import { and, eq, desc } from "drizzle-orm";

// GET /api/albums/[id]/media - list all media posts in an album
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: albumId } = await params;

  // Get the album to verify it exists and get familyId
  const album = await db.query.albums.findFirst({
    where: eq(albums.id, albumId),
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Verify user is a member of the album's family
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, album.familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this family" },
      { status: 403 }
    );
  }

  // Get all media posts in this album, ordered by serverTimestamp descending
  // We use raw SQL since Drizzle schema may not have albumId column yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (db as any).execute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).sql`
      SELECT
        p.id,
        p.media_url,
        p.caption,
        p.server_timestamp,
        p.author_name
      FROM posts p
      WHERE p.album_id = ${albumId}
        AND p.media_url IS NOT NULL
      ORDER BY p.server_timestamp DESC
    `
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const media = (result as any[]).map((row: any) => ({
    id: row.id,
    mediaUrl: row.media_url,
    caption: row.caption,
    serverTimestamp: row.server_timestamp instanceof Date
      ? row.server_timestamp.toISOString()
      : row.server_timestamp,
    authorName: row.author_name,
  }));

  return NextResponse.json({ media });
}

export const dynamic = 'force-dynamic';
