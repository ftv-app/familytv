import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { db, familyMemberships, albums } from "@/db";
import { and, eq } from "drizzle-orm";

// Allowed MIME types for upload
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
]);

// POST /api/upload - upload media to Vercel Blob and optionally create a post
// Body: multipart/form-data with file + fields (filename, contentType, familyId, albumId?, caption?, createAlbum?)
export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? null;
  } catch {
    // auth() throws when there's no valid session (e.g., no cookie in request).
    // Return 401 instead of propagating the error - the client can handle this.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const filename = formData.get("filename") as string | null;
  const contentType = formData.get("contentType") as string | null;
  const familyId = formData.get("familyId") as string | null;
  const albumId = formData.get("albumId") as string | null;
  const createAlbum = formData.get("createAlbum") as string | null;
  const caption = formData.get("caption") as string | null;

  if (!file || !filename || !contentType || !familyId) {
    return NextResponse.json(
      { error: "file, filename, contentType, and familyId are required" },
      { status: 400 }
    );
  }

  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Invalid content type: ${contentType}. Allowed: images and videos only.` },
      { status: 400 }
    );
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

  // Resolve albumId: either provided directly, or create a new album
  let resolvedAlbumId: string | null = albumId;

  if (albumId) {
    // Validate album belongs to this family
    const album = await db.query.albums.findFirst({
      where: and(eq(albums.id, albumId), eq(albums.familyId, familyId)),
    });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found or does not belong to this family" },
        { status: 404 }
      );
    }
    resolvedAlbumId = albumId;
  } else if (createAlbum) {
    // Create a new album and use its ID
    const newAlbumId = crypto.randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).sql`INSERT INTO albums (id, family_id, name, created_by) VALUES (${newAlbumId}, ${familyId}, ${createAlbum}, ${userId})`
    );
    resolvedAlbumId = newAlbumId;
  }

  // Generate a unique blob key
  const ext = filename.split(".").pop() ?? "bin";
  const blobKey = `${familyId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let blobUrl: string;
  try {
    const blob = await put(blobKey, file, {
      access: "private",
      contentType,
    });
    blobUrl = blob.url;
  } catch {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  // Create a post record for this media
  const postId = crypto.randomUUID();

  // Use raw SQL to insert the post since Drizzle schema may not have albumId column yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertResult = await (db as any).execute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).sql`
      INSERT INTO posts (id, family_id, author_id, content_type, media_url, caption, album_id, server_timestamp)
      VALUES (
        ${postId},
        ${familyId},
        ${userId},
        ${contentType},
        ${blobUrl},
        ${caption ?? null},
        ${resolvedAlbumId ?? null},
        NOW()
      )
      RETURNING id, family_id, media_url, caption, album_id, server_timestamp
    `
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postRow = (insertResult as any)[0];

  return NextResponse.json({
    url: blobUrl,
    post: {
      id: postRow.id,
      familyId: postRow.family_id,
      mediaUrl: postRow.media_url,
      caption: postRow.caption,
      albumId: postRow.album_id,
      serverTimestamp: postRow.server_timestamp instanceof Date
        ? postRow.server_timestamp.toISOString()
        : postRow.server_timestamp,
    },
  });
}
