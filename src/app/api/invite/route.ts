export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, invites, familyMemberships, families } from "@/db";
import { eq, and } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

const INVITE_EXPIRY_DAYS = 7;

// POST /api/invite - create an invite
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { familyId, email } = body;

  // Validate familyId
  if (!familyId || typeof familyId !== "string") {
    return NextResponse.json({ error: "Invalid family ID" }, { status: 400 });
  }

  // Verify user is a member of this family
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

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Check if already a member
  const existingMembership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.familyId, familyId),
      eq(familyMemberships.userId, email) // TODO: Clerk userId, not email
    ),
  });

  if (existingMembership) {
    return NextResponse.json(
      { error: "This person is already a member of your family" },
      { status: 400 }
    );
  }

  // Check for existing pending invite
  const existingInvite = await db.query.invites.findFirst({
    where: and(
      eq(invites.familyId, familyId),
      eq(invites.email, email.toLowerCase()),
      eq(invites.status, "pending")
    ),
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite has already been sent to this email" },
      { status: 400 }
    );
  }

  // Create invite token (secret) and hash it for storage
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const [invite] = await db.insert(invites).values({
    familyId,
    email: email.toLowerCase(),
    tokenHash,
    expiresAt,
    createdBy: userId,
  }).returning();

  // TODO: Send email with invite link
  // Return the public invite ID + secret token in URL for PATCH verification
  // Token is passed via query param (?token=xxx), not in the path
  return NextResponse.json({
    inviteId: invite.id,
    inviteLink: `/invite/${invite.id}?token=${token}`,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}

// GET /api/invite?inviteId=xxx - get invite info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("inviteId");

  if (!inviteId) {
    return NextResponse.json({ error: "inviteId required" }, { status: 400 });
  }

  // Look up invite by public ID (not token)
  const invite = await db.query.invites.findFirst({
    where: eq(invites.id, inviteId),
    with: { family: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite has already been used or expired" },
      { status: 400 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  // Return the token so client can include it in PATCH
  const tokenFromUrl = searchParams.get("token") || "";

  return NextResponse.json({
    family: {
      id: invite.family.id,
      name: invite.family.name,
    },
    email: invite.email,
    token: tokenFromUrl,
  });
}

// PATCH /api/invite - accept an invite (requires auth)
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { inviteId, token } = body;

  if (!inviteId || typeof inviteId !== "string") {
    return NextResponse.json({ error: "inviteId required" }, { status: 400 });
  }

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  // Look up by public invite ID
  const invite = await db.query.invites.findFirst({
    where: eq(invites.id, inviteId),
    with: { family: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  // Verify the secret token matches the stored hash (prevents invite ID enumeration)
  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (invite.tokenHash !== tokenHash) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite has already been used or revoked" },
      { status: 400 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  // Check if already a member
  const existingMembership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.familyId, invite.familyId),
      eq(familyMemberships.userId, userId)
    ),
  });

  if (existingMembership) {
    return NextResponse.json(
      { error: "You are already a member of this family" },
      { status: 400 }
    );
  }

  // Accept the invite: create membership + mark invite as accepted
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
