"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";
import { TagInput, type Tag } from "@/components/tag-input";

export interface PostWithAuthor {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  contentType: "video" | "image" | "text";
  mediaUrl?: string | null;
  caption?: string | null;
  createdAt: Date | string;
  tags?: Tag[];
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Convert private blob URLs to our auth proxy
function getMediaSrc(url: string): string {
  if (url.includes(".vercel-storage.com")) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface PostCardProps {
  post: PostWithAuthor;
  familyId?: string;
}

export function PostCard({ post, familyId: familyIdProp }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>(post.tags ?? []);

  const effectiveFamilyId = familyIdProp ?? post.familyId;

  const isVideo = post.contentType === "video";
  const isImage = post.contentType === "image";
  const hasMedia = post.mediaUrl && (isVideo || isImage);
  const mediaSrc = post.mediaUrl ? getMediaSrc(post.mediaUrl) : null;

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        data-testid="post-card"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(196, 120, 90, 0.12)",
          borderRadius: "12px",
          boxShadow:
            "0 2px 12px rgba(196, 120, 90, 0.08), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Author row */}
        <div
          className="flex items-center gap-3 px-5 pt-4 pb-3"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Avatar
            className="w-11 h-11 shrink-0"
            data-testid="post-avatar"
            style={{ border: "2px solid #c4785a" }}
          >
            <AvatarFallback
              className="text-sm font-medium"
              style={{
                backgroundColor: "rgba(196, 120, 90, 0.15)",
                color: "#c4785a",
              }}
            >
              {getInitials(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold leading-tight truncate"
              style={{
                fontFamily: "var(--font-heading, 'Fraunces', serif)",
                color: "#2D2D2D",
              }}
              data-testid="post-author-name"
            >
              {post.authorName}
            </p>
            <p
              className="text-sm"
              style={{ color: "#A8A8B0" }}
              data-testid="post-timestamp"
            >
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Media */}
        {hasMedia ? (
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: "16/9", backgroundColor: "#f0ede8" }}
            data-testid="post-media-container"
          >
            {isVideo ? (
              <VideoPlayer url={mediaSrc!} />
            ) : (
              <>
                {!imageLoaded && !imageError && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "#f0ede8" }}
                  >
                    <div
                      className="w-6 h-6 rounded-full animate-spin"
                      style={{
                        border: "2px solid rgba(168, 168, 176, 0.3)",
                        borderTopColor: "#A8A8B0",
                      }}
                    />
                  </div>
                )}
                {imageError ? (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "#f0ede8" }}
                  >
                    <span className="text-4xl" aria-hidden="true">🖼️</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="block w-full h-full cursor-zoom-in"
                    data-testid="post-image-expand"
                    aria-label="Expand image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaSrc!}
                      alt={post.caption ?? "Family moment"}
                      className={cn(
                        "w-full h-full object-cover transition-opacity duration-300",
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      data-testid="post-image"
                    />
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}

        {/* Content */}
        <div style={{ backgroundColor: "#ffffff" }}>
          {/* Caption */}
          {post.caption && (
            <p
              className="px-5 pt-3 pb-2 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#2D2D2D", fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
              data-testid="post-caption"
            >
              {post.caption}
            </p>
          )}

          {/* Tags */}
          {effectiveFamilyId && (
            <div className="px-5 pt-1" data-testid="post-tags-section">
              <TagInput
                postId={post.id}
                familyId={effectiveFamilyId}
                tags={tags}
                onTagsChange={setTags}
              />
            </div>
          )}

          {/* Text-only placeholder */}
          {post.contentType === "text" && !post.caption && (
            <p
              className="px-5 pt-3 pb-2 text-sm italic"
              style={{ color: "#A8A8B0" }}
              data-testid="post-text-placeholder"
            >
              Shared a moment
            </p>
          )}

          {/* Reactions row */}
          <div
            className="flex items-center gap-4 px-5 py-3"
            data-testid="post-reactions"
          >
            <button
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "#A8A8B0" }}
              data-testid="post-comment-btn"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4785a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A8B0")}
              aria-label="View comments"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                style={{ color: "#c4785a" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span data-testid="post-comment-count">Comment</span>
            </button>
            <button
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "#A8A8B0" }}
              data-testid="post-like-btn"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4785a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A8B0")}
              aria-label="Like post"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                style={{ color: "#c4785a" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span data-testid="post-like-count">Like</span>
            </button>
          </div>
        </div>
      </Card>

      {lightboxOpen && post.mediaUrl && (
        <ImageLightbox
          src={mediaSrc}
          alt={post.caption ?? "Family moment"}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);

  // Handle YouTube embeds vs direct video files
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");

  if (isYouTube || isVimeo) {
    const embedUrl = isYouTube
      ? url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")
      : url.replace("vimeo.com/", "player.vimeo.com/video/");
    return (
      <div className="absolute inset-0" data-testid="post-video-player">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

  // HTML5 video player for direct video files
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      data-testid="post-video-player"
    >
      {playing ? (
        <video
          src={url}
          controls
          autoPlay
          className="w-full h-full object-contain"
          data-testid="post-video"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="w-full h-full flex items-center justify-center cursor-pointer"
          data-testid="post-video-play-btn"
          aria-label="Play video"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(196, 120, 90, 0.9)" }}
          >
            <svg
              className="w-7 h-7 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
