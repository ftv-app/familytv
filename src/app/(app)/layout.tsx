import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, families, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the user's first family to build family-scoped nav links
  const userMemberships = await db
    .select({ familyId: familyMemberships.familyId })
    .from(familyMemberships)
    .where(eq(familyMemberships.userId, userId))
    .limit(1);

  const familyId = userMemberships[0]?.familyId ?? null;

  return <AppShell familyId={familyId ?? undefined}>{children}</AppShell>;
}
