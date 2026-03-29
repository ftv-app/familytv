export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, calendarEvents, familyMemberships } from "@/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// GET /api/events?familyId=xxx - list events for a family
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  if (!familyId) {
    return NextResponse.json({ error: "familyId is required" }, { status: 400 });
  }

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  const events = await db.query.calendarEvents.findMany({
    where: eq(calendarEvents.familyId, familyId),
    orderBy: [desc(calendarEvents.startDate)],
  });

  return NextResponse.json({ events });
}

// POST /api/events - create a new event
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { familyId, title, description, startDate, endDate, allDay } = body;

  if (!familyId || typeof familyId !== "string") {
    return NextResponse.json({ error: "Invalid family ID" }, { status: 400 });
  }

  if (!title || typeof title !== "string" || title.trim().length < 1) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!startDate) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this family" }, { status: 403 });
  }

  const [event] = await db
    .insert(calendarEvents)
    .values({
      familyId,
      title: title.trim(),
      description: description || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: Boolean(allDay),
      createdBy: userId,
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}
