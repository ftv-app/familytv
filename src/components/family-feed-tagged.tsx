import { auth } from "@clerk/nextjs/server";
import { db, posts, familyMemberships, mediaTags, tags } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { FamilyFeedTaggedClient } from "@/components/family-feed-tagged-client";

interface FamilyFeedTaggedProps {
  familyId: string;
  tagId: string;
}

export async function FamilyFeedTagged({ familyId, tagId }: FamilyFeedTaggedProps) {
  const { userId } = await auth();
  if (!userId) return null;

  // Verify membership
  const membership = await db.query.familyMemberships.findFirst({
    where: eq(familyMemberships.userId, userId),
  });

  if (!membership || membership.familyId !== familyId) {
    return null;
  }

  // Fetch tag info
  const tag = await db.query.tags.findFirst({
    where: and(eq(tags.id, tagId), eq(tags.familyId, familyId)),
  });

  if (!tag) {
    return null;
  }

  // Get postIds that have this tag
  const taggedPostIds = await db.query.mediaTags.findMany({
    where: eq(mediaTags.tagId, tagId),
    columns: { postId: true },
  });
  const postIds = taggedPostIds.map((mt) => mt.postId);

  if (postIds.length === 0) {
    return (
      <FamilyFeedTaggedClient
        initialPosts={[]}
        familyId={familyId}
        nextCursor={null}
        activeTag={{ id: tag.id, name: tag.name, color: tag.color }}
      />
    );
  }

  // Fetch posts matching this tag (newest first)
  const postsData = await db.query.posts.findMany({
    where: and(
      eq(posts.familyId, familyId),
      sql`${posts.id} = ANY(${postIds})`
    ),
    orderBy: [desc(posts.createdAt)],
    limit: 10,
  });

  const lastPost = postsData[postsData.length - 1];
  const nextCursor = postsData.length === 10 && lastPost
    ? lastPost.createdAt.toISOString()
    : null;

  // Attach tags to each post
  const fetchedPostIds = postsData.map((p) => p.id);
  let tagsByPostId: Record<string, { id: string; name: string; color: string }[]> = {};

  if (fetchedPostIds.length > 0) {
    const allMediaTags = await db.query.mediaTags.findMany({
      where: sql`${mediaTags.postId} = ANY(${fetchedPostIds})`,
    });

    const allTagIds = [...new Set(allMediaTags.map((mt) => mt.tagId))];
    const tagRecords = allTagIds.length > 0
      ? await db.query.tags.findMany({
          where: sql`${tags.id} = ANY(${allTagIds})`,
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
    <FamilyFeedTaggedClient
      initialPosts={postsWithTags}
      familyId={familyId}
      nextCursor={nextCursor}
      activeTag={{ id: tag.id, name: tag.name, color: tag.color }}
    />
  );
}
