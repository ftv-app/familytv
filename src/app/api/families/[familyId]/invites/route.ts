// POST /api/families/[familyId]/invites — Generate invite (family admin only)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyInvites, familyMemberships, familyInviteRateLimits, families } from "@/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const INVITE_CODE_LENGTH = 32;
const INVITE_EXPIRY_DAYS = 7;
const MAX_INVITES_PER_DAY = 10;
const BCRYPT_ROUNDS = 12;

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ familyId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyId } = await context.params;

    // Verify user is a family admin (owner or admin role)
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

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only family admins can create invites" },
        { status: 403 }
      );
    }

    // Check rate limit (max 10 invites per family per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const rateLimit = await db.query.familyInviteRateLimits.findFirst({
      where: and(
        eq(familyInviteRateLimits.familyId, familyId),
        eq(familyInviteRateLimits.createdDate, today)
      ),
    });

    if (rateLimit && rateLimit.inviteCount >= MAX_INVITES_PER_DAY) {
      return NextResponse.json(
        { error: "Rate limit exceeded: maximum 10 invites per family per day" },
        { status: 429 }
      );
    }

    // Generate invite code (32-char hex)
    const inviteCode = randomBytes(INVITE_CODE_LENGTH / 2).toString("hex");
    
    // Hash the invite code with bcrypt
    const inviteCodeHash = await bcrypt.hash(inviteCode, BCRYPT_ROUNDS);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    // Create the invite
    const [invite] = await db.insert(familyInvites).values({
      familyId,
      inviteCodeHash,
      createdByUserId: userId,
      expiresAt,
    }).returning();

    // Update rate limit counter (composite PK: familyId + createdDate)
    if (rateLimit) {
      await db.update(familyInviteRateLimits)
        .set({ inviteCount: rateLimit.inviteCount + 1 })
        .where(
          and(
            eq(familyInviteRateLimits.familyId, familyId),
            eq(familyInviteRateLimits.createdDate, rateLimit.createdDate)
          )
        );
    } else {
      await db.insert(familyInviteRateLimits).values({
        familyId,
        createdDate: today,
        inviteCount: 1,
      });
    }

    // Get family name for the invite
    const family = await db.query.families.findFirst({
      where: eq(families.id, familyId),
    });

    const inviteLink = `https://familytv.vercel.app/invite/${invite.id}`;

    // TODO: Send email with invite link using Clerk's sendEmail or Resend API

    return NextResponse.json({
      inviteId: invite.id,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
      familyName: family?.name,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating family invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
