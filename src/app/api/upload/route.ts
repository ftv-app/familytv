import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { db, familyMemberships } from "@/db";
import { and, eq } from "drizzle-orm";

// POST /api/upload - upload media to Vercel Blob
// Body: multipart/form-data with file + fields (filename, contentType, familyId)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const filename = formData.get("filename") as string | null;
  const contentType = formData.get("contentType") as string | null;
  const familyId = formData.get("familyId") as string | null;

  if (!file || !filename || !contentType || !familyId) {
    return NextResponse.json(
      { error: "file, filename, contentType, and familyId are required" },
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

  // Generate a unique blob key
  const ext = filename.split(".").pop() ?? "bin";
  const blobKey = `${familyId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await put(blobKey, file, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
