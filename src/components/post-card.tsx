"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";

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

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isVideo = post.contentType === "video";
  const isImage = post.contentType === "image";
  const hasMedia = post.mediaUrl && (isVideo || isImage);

  return (
    <>
      <Card className="overflow-hidden border-border/60 shadow-sm">
        {/* Media */}
        {hasMedia ? (
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {isVideo ? (
              <VideoPlayer url={post.mediaUrl!} />
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
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="block w-full h-full cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.mediaUrl!}
                      alt={post.caption ?? "Family moment"}
                      className={cn(
                        "w-full h-full object-cover transition-opacity duration-300",
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}

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
              <p className="text-sm font-medium text-foreground leading-tight truncate">
                {post.authorName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
              {post.caption}
            </p>
          )}

          {/* Text-only placeholder */}
          {post.contentType === "text" && !post.caption && (
            <p className="text-sm text-muted-foreground italic mb-4">
              Shared a moment
            </p>
          )}

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
              <span>Comment</span>
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

      {lightboxOpen && post.mediaUrl && (
        <ImageLightbox
          src={post.mediaUrl}
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
      <div className="absolute inset-0">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // HTML5 video player for direct video files
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      {playing ? (
        <video
          src={url}
          controls
          autoPlay
          className="w-full h-full object-contain"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="w-full h-full flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
