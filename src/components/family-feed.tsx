"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FamilyPost {
  id: string;
  authorName: string;
  authorId: string;
  caption: string;
  mediaType: "photo" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  commentCount: number;
  createdAt: Date;
}

// Placeholder data — replace with API call when posts table is ready
const PLACEHOLDER_POSTS: FamilyPost[] = [
  {
    id: "1",
    authorName: "Sarah",
    authorId: "user_1",
    caption: "Sunset at the beach today! The kids loved building sandcastles 🏖️",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    commentCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    authorName: "Mike",
    authorId: "user_2",
    caption: "Grandma's 80th birthday dinner was perfect. Love you all! 🎂",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
    commentCount: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "3",
    authorName: "Emma",
    authorId: "user_3",
    caption: "First day of school! So proud of my little one 📚",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    commentCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface PostCardProps {
  post: FamilyPost;
}

function PostCard({ post }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* Media */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {post.mediaType === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-7 h-7 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground">Video playback coming soon</p>
            </div>
          </div>
        ) : (
          <>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
              </div>
            )}
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <span className="text-4xl">🖼️</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt={post.caption}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">
              {post.authorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-foreground leading-relaxed mb-4">
          {post.caption}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{post.commentCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>Like</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddPostCardProps {
  onAddPost: () => void;
}

function AddPostCard({ onAddPost }: AddPostCardProps) {
  return (
    <Card className="border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors cursor-pointer" onClick={onAddPost}>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">Share a moment</p>
        <p className="text-xs text-muted-foreground mt-1">
          Photo or video
        </p>
      </CardContent>
    </Card>
  );
}

interface FamilyFeedProps {
  familyId: string;
  posts?: FamilyPost[];
}

export function FamilyFeed({ familyId, posts: initialPosts }: FamilyFeedProps) {
  // Use placeholder posts until API is built
  const posts = initialPosts ?? PLACEHOLDER_POSTS;
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleLoadMore() {
    // Placeholder: wire up to API when posts endpoint exists
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setHasMore(false);
    setLoading(false);
  }

  if (posts.length === 0) {
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
        <Button onClick={() => {}}>Share your first moment</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add post CTA */}
      <AddPostCard onAddPost={() => {}} />

      {/* Posts grid */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load more */}
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

      {/* End of feed */}
      {!hasMore && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You&apos;re all caught up! 🎉
        </p>
      )}
    </div>
  );
}

export type { FamilyPost };
