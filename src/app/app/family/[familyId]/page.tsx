import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db, families, familyMemberships, invites } from "@/db";
import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/backend";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FamilyFeed } from "@/components/family-feed";
import { FamilyCalendar } from "@/components/family-calendar";
import { FamilyMembers } from "@/components/family-members";
import type { FamilyMember, PendingInvite } from "@/components/family-members";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { familyId } = await params;

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, familyId)
    ),
    with: { family: true },
  });

  if (!membership) {
    redirect("/app");
  }

  const family = membership.family;

  // Get all members
  const allMemberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.familyId, familyId),
  });

  // Get pending invites
  const pendingInvitesRaw = await db.query.invites.findMany({
    where: and(eq(invites.familyId, familyId), eq(invites.status, "pending")),
  });

  // Map DB rows to component types — resolve real names from Clerk
  const userIds = allMemberships.map((m) => m.userId);
  const clerkUsers = await clerkClient.users.getUserList({ userId: userIds });
  const clerkUserMap = new Map(clerkUsers.map((u) => [u.id, u]));

  const members: FamilyMember[] = allMemberships.map((m) => {
    const clerkUser = clerkUserMap.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      name: clerkUser?.fullName ?? m.userId.slice(0, 8) + "...",
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? `${m.userId.slice(0, 8)}@example.com`,
      role: m.role as "owner" | "member",
      joinedAt: m.joinedAt,
    };
  });

  const pendingInvites: PendingInvite[] = pendingInvitesRaw.map((inv) => ({
    id: inv.id,
    email: inv.email,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Family header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">
            {family.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""}
            {pendingInvites.length > 0 &&
              ` · ${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href={`/app/family/${familyId}/invite`} className="shrink-0">
          <Button className="gap-2 w-full sm:w-auto">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Invite
          </Button>
        </Link>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-6 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="feed" className="gap-1.5 shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Feed
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5 shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Calendar
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Members
            <span className="ml-1 text-xs opacity-60">{members.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <FamilyFeed familyId={familyId} />
        </TabsContent>

        <TabsContent value="calendar">
          <FamilyCalendar familyId={familyId} />
        </TabsContent>

        <TabsContent value="members">
          <FamilyMembers
            familyId={familyId}
            members={members}
            pendingInvites={pendingInvites}
            currentUserId={userId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
