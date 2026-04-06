import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db, familyMemberships } from "@/db";
import { eq, and } from "drizzle-orm";
import { TagBrowseClient } from "@/components/tag-browse-client";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ familyId: string }>;
}

export default async function FamilyTagsPage({ params }: PageProps) {
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back nav */}
      <Link
        href={`/app/family/${familyId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {family.name}
      </Link>

      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">
          Tags
        </h1>
        <p className="text-muted-foreground mt-1">
          Find moments by topic across your family&apos;s posts
        </p>
      </div>

      {/* Tag browse grid */}
      <TagBrowseClient familyId={familyId} />
    </div>
  );
}
