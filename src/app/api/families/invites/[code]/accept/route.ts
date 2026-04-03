// POST /api/families/invites/[code]/accept — Accept invite, add user to family
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyInvites, familyMemberships, families } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * Compute SHA-256 hash of invite code for indexed lookup
 */
function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await context.params;

    if (!code || code.length !== INVITE_CODE_LENGTH) {
      return NextResponse.json(
        { error: "Invalid invite code format" },
        { status: 400 }
      );
    }

    // Use SHA-256 lookup hash for O(1) query instead of iterating all invites
    const lookupHash = sha256(code);

    // Find the invite by lookup_hash (indexed) first
    const matchedInvite = await db.query.familyInvites.findFirst({
      where: and(
        eq(familyInvites.lookupHash, lookupHash),
        isNull(familyInvites.revokedAt)
      ),
      with: {
        family: true,
      },
    });

    if (!matchedInvite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Verify with bcrypt (only one invite, not all)
    const isValid = await bcrypt.compare(code, matchedInvite.inviteCodeHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > matchedInvite.expiresAt) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    // Check if revoked (already handled by query, but double-check)
    if (matchedInvite.revokedAt) {
      return NextResponse.json(
        { error: "This invite has been revoked" },
        { status: 410 }
      );
    }

    // Check if user is already a member
    const existingMembership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, matchedInvite.familyId)
      ),
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this family" },
        { status: 400 }
      );
    }

    // Accept the invite: create membership
    const [membership] = await db.insert(familyMemberships).values({
      familyId: matchedInvite.familyId,
      userId,
      role: "member",
    }).returning();

    // Revoke the invite so it can't be used again
    await db.update(familyInvites)
      .set({ revokedAt: new Date() })
      .where(eq(familyInvites.id, matchedInvite.id));

    return NextResponse.json({
      success: true,
      familyId: matchedInvite.familyId,
      familyName: matchedInvite.family.name,
      familyAvatarUrl: matchedInvite.family.avatarUrl,
      membershipId: membership.id,
    }, { status: 200 });

  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}

const INVITE_CODE_LENGTH = 32;
