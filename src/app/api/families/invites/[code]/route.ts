// GET /api/families/invites/[code] — Validate invite code
// Uses SHA-256 lookup hash for O(1) invite validation instead of iterating all invites
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

/**
 * Compute SHA-256 hash of invite code for indexed lookup
 */
function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
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

    // Compute lookup hash for O(1) indexed query
    const lookupHash = sha256(code);

    // Find invite by lookup_hash first (uses the indexed column)
    // This is O(1) instead of O(n) - no need to load all active invites
    const invite = await db.query.familyInvites.findFirst({
      where: and(
        eq(familyInvites.lookupHash, lookupHash),
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

    // Now verify with bcrypt (only one invite instead of all)
    const isValid = await bcrypt.compare(code, invite.inviteCodeHash);
    
    if (!isValid) {
      // This shouldn't happen if lookup_hash is correct, but handle it defensively
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

    // Check if revoked (already handled by query, but double-check)
    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "This invite has been revoked" },
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
