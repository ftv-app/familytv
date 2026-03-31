export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, invites, families } from "@/db";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

// GET /api/families/invites/[code] — validate an invite code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(code).digest("hex");
  const invite = await db.query.invites.findFirst({
    where: eq(invites.tokenHash, tokenHash),
    with: { family: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  if (invite.status === "revoked") {
    return NextResponse.json({ error: "This invite has been revoked" }, { status: 410 });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    family: {
      id: invite.family.id,
      name: invite.family.name,
    },
    expiresAt: invite.expiresAt.toISOString(),
  });
}
