export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { getPresenceManager } from "@/lib/watch-party/presence";
import type { PresenceState } from "@/lib/watch-party/presence";

// GET /api/family/presence
// Returns family-wide presence for online members
//
// Query params:
// - familyId (optional): Filter by family. If not provided, uses the user's first family
//
// Returns: { onlineMembers: [{ userId, oderId, name, avatar, status, lastSeen, currentView }], timestamp }
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const familyIdParam = searchParams.get("familyId");

    // Get user's family membership
    let membership;
    if (familyIdParam) {
      // Validate membership for the specified family
      membership = await db.query.familyMemberships.findFirst({
        where: and(
          eq(familyMemberships.userId, userId),
          eq(familyMemberships.familyId, familyIdParam)
        ),
        with: { family: true },
      });
    } else {
      // No familyId provided - get the user's first family membership
      const memberships = await db.query.familyMemberships.findMany({
        where: eq(familyMemberships.userId, userId),
        with: { family: true },
        orderBy: [familyMemberships.joinedAt],
        limit: 1,
      });
      membership = memberships[0] || null;
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this family" },
        { status: 403 }
      );
    }

    const familyId = membership.familyId;

    // Get presence data from PresenceManager
    const presenceManager = getPresenceManager();
    const { onlineMembers, timestamp } = presenceManager.getFamilyPresence(familyId);
    const presence: PresenceState = { users: onlineMembers, timestamp };

    return NextResponse.json(presence);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
