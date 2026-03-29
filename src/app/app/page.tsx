import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, families, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";

export default async function AppPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  // Find the user's families
  const memberships = await db.query.familyMemberships.findMany({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
    limit: 1,
  });

  if (memberships.length === 0) {
    // User has no family yet - redirect to create one
    redirect("/app/create-family");
  }

  // Redirect to first family
  redirect(`/app/family/${memberships[0].family.id}`);
}
