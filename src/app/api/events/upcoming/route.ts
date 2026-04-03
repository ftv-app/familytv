export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, calendarEvents, familyMemberships } from "@/db";
import { eq, and, lte, gte } from "drizzle-orm";
import { desc } from "drizzle-orm";

// Types
interface UpcomingEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  createdBy: string;
  createdAt: string;
}

interface UpcomingEventsResponse {
  events: UpcomingEvent[];
  familyName: string;
}

// Time window for upcoming events (24 hours in milliseconds)
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS = 20;

/**
 * Get the user's family membership.
 * If familyId is provided in query params, validate membership.
 * Otherwise, return the user's first/primary family membership.
 */
async function getUserFamilyMembership(userId: string, familyIdParam?: string | null) {
  if (familyIdParam) {
    // Validate membership for the specified family
    const membership = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.userId, userId),
        eq(familyMemberships.familyId, familyIdParam)
      ),
      with: { family: true },
    });
    return membership;
  }

  // No familyId provided - get the user's first family membership
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    orderBy: [desc(familyMemberships.joinedAt)],
    limit: 1,
  });

  return memberships[0] || null;
}

// GET /api/events/upcoming
// Returns events starting within the next 24 hours
//
// Query params:
// - familyId (optional): Filter by family. If not provided, uses the user's first family
//
// Returns: { events: UpcomingEvent[], familyName: string }
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const familyIdParam = searchParams.get("familyId");

    // Get user's family membership
    const membership = await getUserFamilyMembership(userId, familyIdParam);
    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this family" },
        { status: 403 }
      );
    }

    const familyId = membership.familyId;
    const familyName = membership.family.name;

    // Calculate time window
    const now = new Date();
    const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_MS);

    // Query events that start within the next 24 hours
    const events = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.familyId, familyId),
        gte(calendarEvents.startDate, now),
        lte(calendarEvents.startDate, windowEnd)
      ),
      orderBy: [calendarEvents.startDate],
      limit: MAX_EVENTS,
    });

    // Transform to response format
    const upcomingEvents: UpcomingEvent[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || null,
      allDay: event.allDay,
      createdBy: event.createdBy,
      createdAt: event.createdAt.toISOString(),
    }));

    const response: UpcomingEventsResponse = {
      events: upcomingEvents,
      familyName,
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
