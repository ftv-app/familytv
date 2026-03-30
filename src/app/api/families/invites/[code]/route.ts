// GET /api/families/invites/[code] — Validate invite code
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyInvites, families } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

    // Note: We cannot directly query by hashed code since bcrypt hashes are different each time
    // Instead, we need to iterate through all active invites and compare
    // For production, consider using a different approach (e.g., store a separate lookup hash)
    
    const activeInvites = await db.query.familyInvites.findMany({
      where: and(
        isNull(familyInvites.revokedAt),
        // Note: In a real implementation, you'd want to filter by expires_at > now()
        // but Drizzle doesn't support raw comparisons easily here
      ),
      with: {
        family: true,
      },
    });

    // Find matching invite by comparing bcrypt hashes
    for (const invite of activeInvites) {
      const isValid = await bcrypt.compare(code, invite.inviteCodeHash);
      
      if (isValid) {
        // Check if expired
        if (new Date() > invite.expiresAt) {
          return NextResponse.json(
            { error: "This invite has expired" },
            { status: 410 }
          );
        }

        // Check if revoked
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
      }
    }

    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

const INVITE_CODE_LENGTH = 32;
