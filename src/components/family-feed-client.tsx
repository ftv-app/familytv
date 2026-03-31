"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { WarmEmptyState } from "@/components/warm-empty-state";
import type { PostWithAuthor } from "@/components/post-card";

interface FamilyFeedClientProps {
  initialPosts: PostWithAuthor[];
  familyId: string;
  nextCursor: string | null;
}

export function FamilyFeedClient({
  initialPosts,
  familyId,
  nextCursor: initialCursor,
}: FamilyFeedClientProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCursor !== null);
  const router = useRouter();

  async function handleLoadMore() {
    if (!cursor || loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/posts?familyId=${familyId}&cursor=${encodeURIComponent(cursor)}`
      );
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      const newPosts: PostWithAuthor[] = data.posts;

      setPosts((prev) => [...prev, ...newPosts]);

      const last = newPosts[newPosts.length - 1];
      if (last && newPosts.length >= 10) {
        setCursor(last.createdAt.toString());
        setHasMore(true);
      } else {
        setCursor(null);
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  function handlePostCreated(newPost: PostWithAuthor) {
    setPosts((prev) => [newPost, ...prev]);
    router.refresh();
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <CreatePost familyId={familyId} onPostCreated={handlePostCreated} />
        <EmptyFeedState familyId={familyId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePost familyId={familyId} onPostCreated={handlePostCreated} />

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[140px] min-h-[44px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You&apos;re all caught up! 🎉
        </p>
      )}
    </div>
  );
}

function EmptyFeedState({ familyId }: { familyId: string }) {
  return (
    <WarmEmptyState
      emoji="📷"
      title="Your family feed is waiting"
      description="Share your first photo or video and start filling this feed with the moments that matter most."
      ctaLabel="Share your first memory"
      ctaHref="#create-post"
      secondaryLabel="Invite family members"
      secondaryHref={`/app/family/${familyId}/invite`}
    />
  );
}
