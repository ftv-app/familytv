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
import { cn } from "@/lib/utils";

interface TagInfo {
  id: string;
  name: string;
  color: string;
}

interface FamilyFeedTaggedClientProps {
  initialPosts: PostWithAuthor[];
  familyId: string;
  nextCursor: string | null;
  activeTag: TagInfo;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const linearR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const linearG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const linearB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
  return luminance > 0.179 ? "#1a1a1a" : "#ffffff";
}

export function FamilyFeedTaggedClient({
  initialPosts,
  familyId,
  nextCursor: initialCursor,
  activeTag,
}: FamilyFeedTaggedClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCursor !== null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const textColor = getContrastColor(activeTag.color);

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
        `/api/posts?familyId=${familyId}&tagId=${activeTag.id}&cursor=${encodeURIComponent(cursor)}`
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

  function handleClearTagFilter() {
    router.push(`/app/family/${familyId}/feed`);
  }

  if (posts.length === 0 && !showSearch) {
    return (
      <div className="space-y-4">
        <CreatePost familyId={familyId} onPostCreated={handlePostCreated} />
        <SearchBar familyId={familyId} onSearch={handleSearch} loading={isSearching} />
        {/* Tag filter banner */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: activeTag.color }}
          data-testid="tag-filter-banner"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: textColor }}>
              🏷️ Showing posts tagged
            </span>
            <span
              className="font-semibold text-sm"
              style={{ color: textColor }}
              data-testid="tag-filter-name"
            >
              {activeTag.name}
            </span>
          </div>
          <button
            onClick={handleClearTagFilter}
            className="text-xs font-medium px-2 py-1 rounded-md transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-1"
            style={{ backgroundColor: "rgba(0,0,0,0.15)", color: textColor }}
            data-testid="clear-tag-filter"
          >
            Clear filter
          </button>
        </div>
        <WarmEmptyState
          emoji="📷"
          title={`No posts tagged "${activeTag.name}" yet`}
          description="When someone shares a moment with this tag, it will appear here."
          ctaLabel="Share the first moment"
          ctaHref="#create-post"
          secondaryLabel="Browse all posts →"
          secondaryHref={`/app/family/${familyId}/feed`}
        />
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

      {/* Tag filter banner */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: activeTag.color }}
        data-testid="tag-filter-banner"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: textColor }}>
            🏷️ Showing posts tagged
          </span>
          <span
            className="font-semibold text-sm"
            style={{ color: textColor }}
            data-testid="tag-filter-name"
          >
            {activeTag.name}
          </span>
        </div>
        <button
          onClick={handleClearTagFilter}
          className="text-xs font-medium px-2 py-1 rounded-md transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-1"
          style={{ backgroundColor: "rgba(0,0,0,0.15)", color: textColor }}
          data-testid="clear-tag-filter"
        >
          Clear filter
        </button>
      </div>

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
          <PostCard key={post.id} post={post} familyId={familyId} />
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
