import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, families, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
  });

  return (
    <div className="container max-w-2xl py-6 sm:py-8 px-4">
      <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-primary mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Families</CardTitle>
          </CardHeader>
          <CardContent>
            {memberships.length === 0 ? (
              <p className="text-muted-foreground">You haven&apos;t joined any families yet.</p>
            ) : (
              <ul className="space-y-2">
                {memberships.map((m) => (
                  <li key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{m.family.name}</span>
                    <span className="text-sm text-muted-foreground capitalize">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" type="submit">Sign Out</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
