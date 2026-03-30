// DELETE /api/families/[familyId]/invites/[inviteId] — Revoke invite (admin only)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyInvites, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ familyId: string; inviteId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyId, inviteId } = await context.params;

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
        { error: "Only family admins can revoke invites" },
        { status: 403 }
      );
    }

    // Find the invite
    const invite = await db.query.familyInvites.findFirst({
      where: and(
        eq(familyInvites.id, inviteId),
        eq(familyInvites.familyId, familyId)
      ),
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if already revoked
    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "Invite is already revoked" },
        { status: 400 }
      );
    }

    // Revoke the invite
    await db.update(familyInvites)
      .set({ revokedAt: new Date() })
      .where(eq(familyInvites.id, inviteId));

    return NextResponse.json({
      success: true,
      message: "Invite revoked successfully",
    }, { status: 200 });

  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
