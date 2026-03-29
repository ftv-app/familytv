import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db, families, familyMemberships, invites } from "@/db";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function FamilyDashboardPage({
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

  // Get all members
  const allMemberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.familyId, familyId),
    with: { family: true },
  });

  // Get pending invites
  const pendingInvites = await db.query.invites.findMany({
    where: and(
      eq(invites.familyId, familyId),
      eq(invites.status, "pending")
    ),
  });

  const family = membership.family;
  const members = allMemberships;

  return (
    <div className="space-y-8">
      {/* Family header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            {family.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
            {pendingInvites.length} pending invite
            {pendingInvites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`/app/family/${familyId}/invite`}>
          <Button>Invite family</Button>
        </Link>
      </div>

      {/* Feed placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Family Feed</CardTitle>
          <CardDescription>
            Photos, videos, and moments shared with your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Nothing shared yet. Start by sharing a photo or video.
            </p>
            <p className="text-sm text-muted-foreground">
              Media sharing coming in Sprint 002.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 py-2"
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {m.userId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.userId.slice(0, 8)}... (you)
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {m.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-foreground">{inv.email}</span>
                  <span className="text-xs text-muted-foreground">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
