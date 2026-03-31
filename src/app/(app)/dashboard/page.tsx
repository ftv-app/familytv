import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, families, familyMemberships, posts, calendarEvents } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";
import type { DashboardStats } from "./dashboard-client";

export default async function DashboardPage() {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? null;
  } catch {
    redirect("/sign-in");
    return;
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Fetch real families from DB
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    orderBy: [desc(familyMemberships.joinedAt)],
  });

  const familiesData = await Promise.all(
    memberships.map(async (m) => {
      const memberResult = await db
        .select({ cnt: count() })
        .from(familyMemberships)
        .where(eq(familyMemberships.familyId, m.familyId));

      const postResult = await db
        .select({ cnt: count() })
        .from(posts)
        .where(eq(posts.familyId, m.familyId));

      return {
        id: m.family.id,
        name: m.family.name,
        memberCount: memberResult[0]?.cnt ?? 0,
        postCount: postResult[0]?.cnt ?? 0,
      };
    })
  );

  // Compute stats for the primary (first) family
  let stats: DashboardStats = { members: 0, postsThisWeek: 0, upcomingEvents: 0 };
  if (familiesData.length > 0) {
    const primaryFamily = familiesData[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const postsResult = await db
      .select({ cnt: count() })
      .from(posts)
      .where(eq(posts.familyId, primaryFamily.id));

    const eventsResult = await db
      .select({ cnt: count() })
      .from(calendarEvents)
      .where(eq(calendarEvents.familyId, primaryFamily.id));

    stats = {
      members: primaryFamily.memberCount,
      postsThisWeek: postsResult[0]?.cnt ?? 0,
      upcomingEvents: eventsResult[0]?.cnt ?? 0,
    };
  }

  return (
    <DashboardClient
      firstName={firstName}
      email={email}
      families={familiesData}
      stats={stats}
    />
  );
}
