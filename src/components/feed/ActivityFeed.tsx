"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WarmEmptyState } from "@/components/warm-empty-state";
import { Calendar, MessageCircle, Heart, ImageIcon, Clock, Loader2 } from "lucide-react";

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const TERRACOTTA = "#c4785a";
const CREAM = "#faf8f5";
const CREAM_MUTED = "oklch(0.45_0.015_50)";
const DARK_CHARS = "oklch(0.18_0.015_50)";
const WARM_BG = "#faf8f5";
const CARD_BG = "#fffdfb";
const CARD_BORDER = "rgba(196,120,90,0.15)";
const LOADING_BG = "rgba(196,120,90,0.08)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityActor {
  name: string;
  avatar: string | null;
}

interface ActivityContent {
  contentType?: string;
  mediaUrl?: string;
  caption?: string;
  postId?: string;
  content?: string;
  emoji?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string | null;
  allDay?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "post" | "comment" | "reaction" | "event";
  actor: ActivityActor;
  content: ActivityContent;
  createdAt: string;
}

interface ActivityFeedResponse {
  items: ActivityItem[];
  nextCursor: string | null;
  familyName: string;
}

interface ActivityFeedProps {
  familyId: string;
  initialItems?: ActivityItem[];
  initialCursor?: string | null;
  familyName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m}m ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(seconds / 86400);
  return `${d}d ago`;
}

function formatEventDate(isoString: string, allDay?: boolean): string {
  const date = new Date(isoString);
  if (allDay) {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const TYPE_META: Record<
  ActivityItem["type"],
  { icon: React.ElementType; label: string; color: string }
> = {
  post: { icon: ImageIcon, label: "shared a moment", color: TERRACOTTA },
  comment: { icon: MessageCircle, label: "commented", color: "#5B8A72" },
  reaction: { icon: Heart, label: "reacted", color: "#C4785A" },
  event: { icon: Calendar, label: "created an event", color: "#8B6BB5" },
};

// ─── Activity Card ─────────────────────────────────────────────────────────────
function ActivityCard({ item }: { item: ActivityItem }) {
  const meta = TYPE_META[item.type];

  const renderContent = () => {
    switch (item.type) {
      case "post":
        return (
          <span className="text-sm" style={{ color: CREAM_MUTED }}>
            {item.content.caption
              ? `"${item.content.caption.slice(0, 80)}${item.content.caption.length > 80 ? "…" : ""}"`
              : `shared a ${item.content.contentType || "moment"}`}
          </span>
        );
      case "comment":
        return (
          <span className="text-sm" style={{ color: CREAM_MUTED }}>
            &ldquo;{item.content.content?.slice(0, 80)}{item.content.content && item.content.content.length > 80 ? "…" : ""}&rdquo;
          </span>
        );
      case "reaction":
        return (
          <span className="text-lg" aria-label={`reacted with ${item.content.emoji}`}>
            {item.content.emoji}
          </span>
        );
      case "event":
        return (
          <div className="space-y-1">
            <p className="font-semibold text-sm" style={{ color: DARK_CHARS }}>
              {item.content.title}
            </p>
            {item.content.startDate && (
              <p className="text-sm flex items-center gap-1" style={{ color: CREAM_MUTED }}>
                <Clock className="w-3 h-3" aria-hidden="true" />
                {formatEventDate(item.content.startDate, item.content.allDay)}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <article
      className="rounded-2xl p-4 flex gap-3 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 2px 12px rgba(196,120,90,0.08)",
      }}
      data-testid="feed-card"
      data-feed-type={item.type}
      aria-label={`${item.actor.name} ${meta.label}`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
        style={{
          backgroundColor: LOADING_BG,
          color: TERRACOTTA,
        }}
        aria-hidden="true"
      >
        {item.actor.name.charAt(0).toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold"
            style={{ color: DARK_CHARS, fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
          >
            {item.actor.name}
          </span>
          <span className="text-sm" style={{ color: CREAM_MUTED }}>
            {meta.label}
          </span>
        </div>
        <div data-testid="feed-card-content">{renderContent()}</div>
        <time
          dateTime={item.createdAt}
          className="text-sm block"
          style={{ color: `${TERRACOTTA}99` }}
          data-testid="feed-card-time"
        >
          {timeAgo(item.createdAt)}
        </time>
      </div>

      {/* Type icon */}
      <div className="shrink-0 self-start mt-1">
        <meta.icon
          className="w-4 h-4"
          style={{ color: meta.color }}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function ActivityCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-4 flex gap-3 animate-pulse"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
      }}
      aria-hidden="true"
    >
      <div
        className="w-10 h-10 rounded-full shrink-0"
        style={{ backgroundColor: LOADING_BG }}
      />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3 rounded-md w-24" style={{ backgroundColor: LOADING_BG }} />
          <div className="h-3 rounded-md w-20" style={{ backgroundColor: LOADING_BG }} />
        </div>
        <div className="h-3 rounded-md w-3/4" style={{ backgroundColor: LOADING_BG }} />
        <div className="h-2 rounded-md w-16" style={{ backgroundColor: LOADING_BG }} />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
// Per spec in design/sprint-010/empty-states-spec.md — "Your family's story starts here"
function EmptyFeed({ familyName }: { familyName?: string }) {
  return (
    <WarmEmptyState
      emoji="👨‍👩‍👧‍👦"
      title="Your family's story starts here"
      description={
        familyName
          ? `When someone shares a moment in ${familyName}, it will appear here.`
          : "When someone shares a moment, it will appear here."
      }
      ctaLabel="Share the first moment"
      ctaHref="/app/family"
      secondaryLabel="Invite family members"
      secondaryHref="/app/family/invites"
    />
  );
}

// ─── Load More / End ──────────────────────────────────────────────────────────
function LoadMoreButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px]"
      style={{
        backgroundColor: disabled ? LOADING_BG : TERRACOTTA,
        color: "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      }}
      data-testid="feed-load-more"
      aria-label="Load more activity"
      aria-busy={disabled}
    >
      {disabled ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Loading…
        </>
      ) : (
        "Load more"
      )}
    </button>
  );
}

function EndOfFeed() {
  return (
    <p
      className="text-center text-sm py-4"
      style={{ color: CREAM_MUTED }}
      role="status"
      aria-live="polite"
      data-testid="feed-end"
    >
      You&apos;re all caught up
    </p>
  );
}

// ─── Main Feed Component ───────────────────────────────────────────────────────
export function ActivityFeed({
  familyId,
  initialItems = [],
  initialCursor = null,
  familyName,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Initial fetch if no initial items
  useEffect(() => {
    if (initialItems.length === 0 && familyId) {
      fetchFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  const fetchFeed = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setHasError(false);

      try {
        const params = new URLSearchParams({ familyId });
        if (cursor && loadMore) {
          params.set("cursor", cursor);
        }
        params.set("limit", "20");

        const res = await fetch(`/api/family/activity?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: ActivityFeedResponse = await res.json();

        setItems((prev) =>
          loadMore ? [...prev, ...data.items] : data.items
        );
        setCursor(data.nextCursor);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [familyId, cursor]
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && cursor) {
      fetchFeed(true);
    }
  }, [isLoadingMore, cursor, fetchFeed]);

  // Infinite scroll via Intersection Observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && cursor) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, isLoadingMore, handleLoadMore]);

  // Loading state
  if (isLoading) {
    return (
      <section aria-label="Family activity feed" data-testid="feed-container">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        role="alert"
        className="rounded-2xl p-6 text-center"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        data-testid="feed-error"
      >
        <p className="text-sm mb-3" style={{ color: CREAM_MUTED }}>
          Couldn&apos;t load activity. Check your connection.
        </p>
        <button
          onClick={() => fetchFeed()}
          className="text-sm font-semibold underline"
          style={{ color: TERRACOTTA }}
          data-testid="feed-retry"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <section aria-label="Family activity feed" data-testid="feed-container">
        <EmptyFeed familyName={familyName} />
      </section>
    );
  }

  return (
    <section aria-label="Family activity feed" data-testid="feed-container">
      {/* Feed items */}
      <div className="space-y-3" role="feed" aria-busy={isLoadingMore}>
        {items.map((item) => (
          <ActivityCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>

      {/* Load more / sentinel */}
      {cursor ? (
        <>
          <div ref={observerRef} className="h-1" aria-hidden="true" />
          <div className="mt-4">
            <LoadMoreButton onClick={handleLoadMore} disabled={isLoadingMore} />
          </div>
        </>
      ) : (
        <div className="mt-4">
          <EndOfFeed />
        </div>
      )}
    </section>
  );
}
