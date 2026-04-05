"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { WarmEmptyState } from "@/components/warm-empty-state";
import type { PostWithAuthor } from "@/components/post-card";
import { SearchBar, SearchResults } from "@/components/search";
import type { SearchResultItem } from "@/components/search";

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  async function handleSearch(query: string, famId: string) {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setSearchQuery(query);
    setShowSearch(true);
    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, family_id: famId, limit: 10 }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  }

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

  if (posts.length === 0 && !showSearch) {
    return (
      <div className="space-y-4">
        <CreatePost familyId={familyId} onPostCreated={handlePostCreated} />
        <SearchBar familyId={familyId} onSearch={handleSearch} loading={isSearching} />
        <EmptyFeedState familyId={familyId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePost familyId={familyId} onPostCreated={handlePostCreated} />
      <SearchBar
        familyId={familyId}
        onSearch={handleSearch}
        loading={isSearching}
        onClear={handleClearSearch}
      />
      {showSearch && searchResults.length > 0 && (
        <SearchResults results={searchResults} />
      )}
      {showSearch && searchQuery && searchResults.length === 0 && !isSearching && (
        <p className="text-center text-sm text-muted-foreground py-4" data-testid="search-empty">
          No results for &quot;{searchQuery}&quot;
        </p>
      )}

      <div className="space-y-4" data-testid="feed-post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-2" data-testid="feed-load-more-container">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[140px] min-h-[44px]"
            data-testid="feed-load-more-button"
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
        <p className="text-center text-sm text-muted-foreground py-4" data-testid="feed-all-caught-up">
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
      title="Your family's story starts here"
      description="When someone shares a moment, it will appear here."
      ctaLabel="Share the first moment"
      ctaHref="#create-post"
      secondaryLabel="Invite family members →"
      secondaryHref={`/app/family/${familyId}/invite`}
    />
  );
}
