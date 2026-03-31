// GET /api/families/invites/[code] — Validate invite code
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyInvites, families } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code || code.length !== INVITE_CODE_LENGTH) {
      return NextResponse.json(
        { error: "Invalid invite code format" },
        { status: 400 }
      );
    }

    // O(1) lookup via indexed SHA256 hash, then verify with bcrypt
    const lookupHash = createHash("sha256").update(code).digest("hex");
    
    const invite = await db.query.familyInvites.findFirst({
      where: and(
        eq(familyInvites.inviteCodeLookupHash, lookupHash),
        isNull(familyInvites.revokedAt)
      ),
      with: {
        family: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Verify with bcrypt (handles timing-safe comparison)
    const isValid = await bcrypt.compare(code, invite.inviteCodeHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      familyId: invite.familyId,
      familyName: invite.family.name,
      familyAvatarUrl: invite.family.avatarUrl,
      expiresAt: invite.expiresAt.toISOString(),
    });

  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

const INVITE_CODE_LENGTH = 32;
