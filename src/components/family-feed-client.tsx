"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
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
        <EmptyState />
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
            className="min-w-[140px]"
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

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">📷</span>
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
        No moments shared yet
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
        Start sharing photos and videos with your family. Only the people you
        invite can see what you post.
      </p>
    </div>
  );
}
