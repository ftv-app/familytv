import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserDisplayName } from "@/lib/get-user-display-name";
import { db, families, familyMemberships, posts, calendarEvents } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";
import type { DashboardStats } from "./dashboard-client";
import type { FamilyMember, LastActivity } from "./dashboard-client";

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

  // Use the first family's name as the "channel callsign"
  const familyName = familiesData.length > 0 ? familiesData[0].name : undefined;

  // Fetch family members for presence indicators
  let familyMembers: FamilyMember[] = [];
  if (familiesData.length > 0) {
    const primaryFamilyId = familiesData[0].id;
    const memberRecords = await db.query.familyMemberships.findMany({
      where: eq(familyMemberships.familyId, primaryFamilyId),
      with: { family: false },
    });

    // Fetch actual display names (synced from Clerk on first auth)
    const membersWithNames = await Promise.all(
      memberRecords.map(async (m) => ({
        id: m.id,
        name: await getUserDisplayName(m.userId),
        role: m.role,
        isOnline: false,
      }))
    );
    familyMembers = membersWithNames;
  }

  // Compute stats for the primary (first) family
  let stats: DashboardStats = { members: 0, postsThisWeek: 0, upcomingEvents: 0 };
  let lastActivity: LastActivity | null = null;

  if (familiesData.length > 0) {
    const primaryFamily = familiesData[0];

    const postsResult = await db
      .select({ cnt: count() })
      .from(posts)
      .where(eq(posts.familyId, primaryFamily.id));

    const eventsResult = await db
      .select({ cnt: count() })
      .from(calendarEvents)
      .where(eq(calendarEvents.familyId, primaryFamily.id));

    // Fetch the most recent post for "last activity" display
    const recentPosts = await db.query.posts.findMany({
      where: eq(posts.familyId, primaryFamily.id),
      orderBy: [desc(posts.createdAt)],
      limit: 1,
    });

    if (recentPosts.length > 0) {
      const latest = recentPosts[0];
      // eslint-disable-next-line react-hooks/purity -- Server component: Date.now() runs once per request
      const seconds = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
      let timeAgo: string;
      if (seconds < 60) {
        timeAgo = "just now";
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        timeAgo = `${mins} minute${mins > 1 ? "s" : ""} ago`;
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(seconds / 86400);
        timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
      }

      lastActivity = {
        authorName: latest.authorName,
        timeAgo,
        contentType: latest.contentType || "moment",
      };

      // Update family members with real names from recent posts
      if (familyMembers.length > 0 && recentPosts[0]) {
        familyMembers = familyMembers.map((member, i) => ({
          ...member,
          name: i === 0 ? recentPosts[0].authorName : `Member ${i + 1}`,
        }));
      }
    }

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
      familyName={familyName}
      familyMembers={familyMembers}
      stats={stats}
      lastActivity={lastActivity}
    />
  );
}
