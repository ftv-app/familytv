import { auth } from "@clerk/nextjs/server";
import { db, posts, familyMemberships, mediaTags, tags } from "@/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
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

  // Attach tags to each post (matching /api/posts behavior)
  const postIds = postsData.map((p) => p.id);
  let tagsByPostId: Record<string, { id: string; name: string; color: string }[]> = {};

  if (postIds.length > 0) {
    const allMediaTags = await db.query.mediaTags.findMany({
      where: sql`${mediaTags.postId} = ANY(${postIds})`,
    });

    const tagIds = [...new Set(allMediaTags.map((mt) => mt.tagId))];
    const tagRecords = tagIds.length > 0
      ? await db.query.tags.findMany({
          where: sql`${tags.id} = ANY(${tagIds})`,
        })
      : [];

    const tagById = Object.fromEntries(
      tagRecords.map((t) => [t.id, { id: t.id, name: t.name, color: t.color }])
    );

    for (const mt of allMediaTags) {
      if (!tagsByPostId[mt.postId]) tagsByPostId[mt.postId] = [];
      if (tagById[mt.tagId]) tagsByPostId[mt.postId].push(tagById[mt.tagId]);
    }
  }

  const postsWithTags = postsData.map((post) => ({
    ...post,
    tags: tagsByPostId[post.id] ?? [],
  }));

  return (
    <FamilyFeedClient
      initialPosts={postsWithTags}
      familyId={familyId}
      nextCursor={nextCursor}
    />
  );
}
