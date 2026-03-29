import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, families, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/family - list user's families
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
  });

  return NextResponse.json({ families: memberships.map((m) => m.family) });
}

// POST /api/family - create a new family
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Family name must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (name.trim().length > 50) {
    return NextResponse.json(
      { error: "Family name must be 50 characters or less" },
      { status: 400 }
    );
  }

  // Create the family
  const [family] = await db
    .insert(families)
    .values({ name: name.trim() })
    .returning();

  // Add creator as owner
  await db.insert(familyMemberships).values({
    familyId: family.id,
    userId,
    role: "owner",
  });

  return NextResponse.json({ familyId: family.id }, { status: 201 });
}
