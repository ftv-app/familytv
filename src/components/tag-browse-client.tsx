"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TagBrowseItem {
  id: string;
  familyId: string;
  name: string;
  color: string;
  postCount: number;
  createdAt?: string;
}

interface TagBrowseClientProps {
  familyId: string;
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

export function TagBrowseClient({ familyId }: TagBrowseClientProps) {
  const router = useRouter();
  const [tags, setTags] = useState<TagBrowseItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch(`/api/tags?familyId=${familyId}`);
        if (!res.ok) throw new Error("Failed to fetch tags");
        const data = await res.json();
        setTags(data.tags ?? []);
      } catch {
        setTags([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="tag-browse-loading">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center space-y-3"
        data-testid="tag-browse-empty"
      >
        {/* Spotlight-style empty state */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ backgroundColor: "rgba(212, 175, 55, 0.08)" }}
        >
          🏷️
        </div>
        <div>
          <p className="text-lg font-medium text-foreground font-heading">No tags yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tags you add to posts will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Browse by Tag
        </h2>
        <span className="text-sm text-muted-foreground">
          {tags.length} tag{tags.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tag grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        data-testid="tag-browse-grid"
      >
        {tags.map((tag) => {
          const textColor = getContrastColor(tag.color);
          return (
            <button
              key={tag.id}
              data-testid={`tag-card-${tag.id}`}
              onClick={() => router.push(`/app/family/${familyId}/feed?tagId=${tag.id}`)}
              className={cn(
                "relative flex flex-col items-start justify-end p-3 rounded-xl",
                "transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer",
                "text-left group"
              )}
              style={{ backgroundColor: tag.color, minHeight: "96px" }}
            >
              {/* Spotlight glow on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              />

              {/* Post count badge */}
              <div
                className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  color: textColor,
                }}
                data-testid={`tag-count-${tag.id}`}
              >
                {tag.postCount} {tag.postCount === 1 ? "post" : "posts"}
              </div>

              {/* Tag name */}
              <span
                className="font-semibold text-sm leading-tight line-clamp-2"
                style={{ color: textColor }}
                data-testid={`tag-name-${tag.id}`}
              >
                {tag.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
