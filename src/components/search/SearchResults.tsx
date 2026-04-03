"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchResultItem {
  id: string;
  text: string;
  score: number;
  type: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}

interface SearchResultsProps {
  results: SearchResultItem[];
  loading?: boolean;
  error?: string | null;
  onResultClick?: (result: SearchResultItem) => void;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 0.9) return "#C41E3A"; // Velvet Red - high relevance
  if (score >= 0.7) return "#c4785a"; // Terracotta - good relevance
  if (score >= 0.5) return "#607a60"; // Muted green - partial relevance
  return "#5A5A62"; // Gray - low relevance
}

function getTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "photo":
    case "image":
      return "📷";
    case "video":
      return "🎬";
    case "post":
      return "📝";
    case "album":
      return "📚";
    case "event":
      return "📅";
    default:
      return "📄";
  }
}

function getTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case "photo":
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "post":
      return "Post";
    case "album":
      return "Album";
    case "event":
      return "Event";
    default:
      return "Memory";
  }
}

function SearchResultCard({
  result,
  onClick,
  animationDelay,
}: {
  result: SearchResultItem;
  onClick?: (result: SearchResultItem) => void;
  animationDelay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <button
      type="button"
      onClick={() => onClick?.(result)}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer",
        "hover:bg-[#252529] active:scale-[0.98]",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{
        backgroundColor: "#1A1A1E",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        animationDelay: `${animationDelay}ms`,
      }}
      data-testid="search-result-item"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail or type icon */}
        <div
          className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xl"
          style={{ backgroundColor: "#0D0D0F" }}
        >
          {result.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getTypeIcon(result.type)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(196, 30, 58, 0.15)",
                color: "#C41E3A",
              }}
            >
              {getTypeLabel(result.type)}
            </span>
          </div>

          <p
            className="text-sm leading-relaxed line-clamp-2 mb-2"
            style={{ color: "#E8E8EC" }}
          >
            {result.text || result.caption || "No description"}
          </p>

          {/* Score indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(result.score * 100)}%`,
                  backgroundColor: getScoreColor(result.score),
                }}
              />
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: getScoreColor(result.score) }}
            >
              {Math.round(result.score * 100)}%
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 flex items-center">
          <svg
            className="w-4 h-4"
            style={{ color: "#5A5A62" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4"
      data-testid="search-empty"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "rgba(196, 30, 58, 0.1)" }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: "#C41E3A" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <p
        className="text-base font-medium mb-1"
        style={{ color: "#FDF8F3" }}
      >
        No memories found
      </p>
      <p
        className="text-sm text-center"
        style={{ color: "#A8A8B0" }}
      >
        Try searching with different keywords
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4"
      data-testid="search-error"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: "#dc2626" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p
        className="text-base font-medium mb-1"
        style={{ color: "#FDF8F3" }}
      >
        Something went wrong
      </p>
      <p
        className="text-sm text-center"
        style={{ color: "#A8A8B0" }}
      >
        {error || "Please try again later"}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "8px",
            height: "88px",
          }}
        >
          <div className="flex items-center gap-3 p-3">
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: "#0D0D0F" }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-3 rounded"
                style={{ backgroundColor: "#2D2D32", width: "60%" }}
              />
              <div
                className="h-2 rounded"
                style={{ backgroundColor: "#2D2D32", width: "90%" }}
              />
              <div
                className="h-1 rounded"
                style={{ backgroundColor: "#2D2D32", width: "40%" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchResults({
  results,
  loading = false,
  error = null,
  onResultClick,
  className,
}: SearchResultsProps) {
  const [animatedResults, setAnimatedResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    if (results.length > 0) {
      // Stagger animation for results
      setAnimatedResults([]);
      results.forEach((result, index) => {
        setTimeout(() => {
          setAnimatedResults((prev) => [...prev, result]);
        }, index * 50);
      });
    } else {
      setAnimatedResults([]);
    }
  }, [results]);

  return (
    <div
      className={cn("w-full", className)}
      style={{
        backgroundColor: "#0D0D0F",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {loading && results.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
          {animatedResults.map((result, index) => (
            <SearchResultCard
              key={result.id}
              result={result}
              onClick={onResultClick}
              animationDelay={index * 50}
            />
          ))}
        </div>
      )}
    </div>
  );
}
