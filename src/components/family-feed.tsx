import { auth } from "@clerk/nextjs/server";
import { db, posts, familyMemberships } from "@/db";
import { eq, desc } from "drizzle-orm";
import { FamilyFeedClient } from "@/components/family-feed-client";

interface FamilyFeedProps {
  familyId: string;
}

export async function FamilyFeed({ familyId }: FamilyFeedProps) {
  const { userId } = await auth();
  if (!userId) return null;

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: eq(familyMemberships.userId, userId),
  });

  if (!membership || membership.familyId !== familyId) {
    return null;
  }

  // Fetch initial posts (newest first)
  const postsData = await db.query.posts.findMany({
    where: eq(posts.familyId, familyId),
    orderBy: [desc(posts.createdAt)],
    limit: 10,
  });

  const lastPost = postsData[postsData.length - 1];
  const nextCursor = postsData.length === 10 && lastPost
    ? lastPost.createdAt.toISOString()
    : null;

  return (
    <FamilyFeedClient
      initialPosts={postsData}
      familyId={familyId}
      nextCursor={nextCursor}
    />
  );
}
