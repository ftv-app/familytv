export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, invites, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

// POST /api/families/invites/[code]/accept — accept an invite (requires auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Check if already a member
  const existingMembership = await db.query.familyMemberships.findFirst({
    where: eq(familyMemberships.userId, userId),
  });

  if (existingMembership) {
    return NextResponse.json(
      { error: "You are already a member of a family" },
      { status: 400 }
    );
  }

  // Accept the invite: mark as accepted + create membership
  await db.transaction(async (tx) => {
    await tx.update(invites)
      .set({ status: "accepted" })
      .where(eq(invites.id, invite.id));

    await tx.insert(familyMemberships).values({
      familyId: invite.familyId,
      userId,
      role: "member",
    });
  });

  return NextResponse.json({
    family: {
      id: invite.family.id,
      name: invite.family.name,
    },
  });
}
