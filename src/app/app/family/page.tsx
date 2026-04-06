import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, families, familyMemberships } from "@/db";
import { eq } from "drizzle-orm";

export default async function FamilyRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Get the user's first family
  const membership = await db.query.familyMemberships.findFirst({
    where: eq(familyMemberships.userId, userId),
    with: { family: true },
  });

  if (!membership) {
    redirect("/app/create-family");
  }

  redirect(`/app/family/${membership.family.id}`);
}
