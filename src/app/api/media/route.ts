import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/media?url=<blob-url>
// Proxies private Vercel Blob requests with auth check
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const blobUrl = searchParams.get("url");

  if (!blobUrl || typeof blobUrl !== "string") {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  // Only allow Vercel Blob domains
  const allowedHost = ".vercel-storage.com";
  try {
    const urlObj = new URL(blobUrl);
    if (!urlObj.hostname.endsWith(allowedHost)) {
      return NextResponse.json({ error: "Invalid blob domain" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch the blob with the token header and forward to client
  const blobRes = await fetch(blobUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN ?? ""}`,
    },
  });

  if (!blobRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: blobRes.status }
    );
  }

  const blobData = await blobRes.arrayBuffer();
  const contentType = blobRes.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(blobData, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export const dynamic = 'force-dynamic';
