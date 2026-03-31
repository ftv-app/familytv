export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, invites, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

const INVITE_EXPIRY_DAYS = 7;

// GET /api/families/[familyId]/invites — list active invites for a family
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await params;

  // Verify user is member of this family (owner or member)
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this family" },
      { status: 403 }
    );
  }

  const familyInvites = await db.query.invites.findMany({
    where: and(
      eq(invites.familyId, familyId),
      eq(invites.status, "pending")
    ),
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
  });

  // Return invite records with code reconstructed (we store only hash)
  // Note: in production you'd use a different approach; for demo we return id-based lookup
  return NextResponse.json({ invites: familyInvites });
}

// POST /api/families/[familyId]/invites — generate a new invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await params;

  // Verify user is member of this family
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this family" },
      { status: 403 }
    );
  }

  // Generate invite token
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await db.insert(invites).values({
    familyId,
    email: "", // Code-based invites don't require email upfront
    tokenHash,
    expiresAt,
    createdBy: userId,
  });

  return NextResponse.json({
    code: token,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}

// DELETE /api/families/[familyId]/invites — revoke an invite (by invite id)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await params;
  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("inviteId");

  if (!inviteId) {
    return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
  }

  // Verify user is member of this family
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this family" },
      { status: 403 }
    );
  }

  // Revoke the invite
  await db.update(invites)
    .set({ status: "revoked" })
    .where(and(
      eq(invites.id, inviteId),
      eq(invites.familyId, familyId)
    ));

  return NextResponse.json({ success: true });
}
