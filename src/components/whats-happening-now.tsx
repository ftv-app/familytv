"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cake,
  Users,
  MessageSquare,
  Image,
  Video,
  FileText,
  Heart,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Cinema Black / Dark Mode Token Aliases ────────────────────────────────────
const bg = "var(--background)";
const fg = "var(--foreground)";
const cardBg = "var(--card)";
const cardFg = "var(--card-foreground)";
const mutedFg = "var(--muted-foreground)";
const muted = "var(--muted)";
const primary = "var(--primary)";
const border = "var(--border)";
const accent = "var(--accent)";

// ─── Spec Types (CTM-38) ───────────────────────────────────────────────────────
export interface SurfacedItem {
  type: "post" | "comment" | "member_join" | "birthday";
  id: string;
  score: number;
  createdAt?: string;
  serverTimestamp: string;
  // post fields
  author?: Actor;
  contentType?: "photo" | "video" | "text";
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  caption?: string;
  reactionCount?: number;
  commentCount?: number;
  // comment fields
  postId?: string;
  postCaption?: string;
  content?: string;
  postAuthor?: Actor;
  isOnOwnPost?: boolean;
  // member join fields
  actor?: Actor;
  joinedAt?: string;
  invitedBy?: Actor;
  // birthday fields
  person?: Actor;
  displayName?: string;
  daysUntil?: number;
  isToday?: boolean;
  isTomorrow?: boolean;
  dateLabel?: string;
  ageTurning?: number;
}

export interface Actor {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
}

export interface ActivityMeta {
  totalItems: number;
  hasMore: boolean;
  pollingHint: string;
  sections: {
    posts: { count: number; newestAt: string | null };
    comments: { count: number; newestAt: string | null };
    members: { count: number; newestAt: string | null };
    birthdays: { count: number; nextBirthdayAt: string | null };
  };
}

export interface ActivityResponse {
  familyId: string;
  generatedAt: string;
  items: SurfacedItem[];
  meta: ActivityMeta;
}

// ─── Legacy API shape (current implementation) ─────────────────────────────────
interface LegacyActivityItem {
  id: string;
  type: "post" | "comment" | "reaction" | "event";
  actor: { name: string; avatar: string | null };
  content: Record<string, unknown>;
  createdAt: string;
}

interface LegacyActivityResponse {
  items: LegacyActivityItem[];
  nextCursor: string | null;
  familyName: string;
}

// ─── Component Props ────────────────────────────────────────────────────────────
export interface WhatsHappeningNowProps {
  familyId: string;
  /** Defaults to 20 */
  limit?: number;
  /** Optional: pass Clerk userId for personalisation (hiding own posts) */
  currentUserId?: string;
  /** Called when user taps an activity item */
  onItemClick?: (item: SurfacedItem) => void;
  /** Called when user taps "See all" */
  onSeeAllClick?: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMs / 1000 / 60 / 60);
  const diffDays = Math.floor(diffMs / 1000 / 60 / 60 / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDaysUntil(days: number): string {
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// ─── Adapters ─────────────────────────────────────────────────────────────────
// Adapt legacy API shape to the spec's SurfacedItem type
function adaptLegacyItem(item: LegacyActivityItem, currentUserId?: string): SurfacedItem {
  const actor: Actor = {
    id: "",
    name: item.actor.name,
    avatarUrl: item.actor.avatar ?? undefined,
    initials: getInitials(item.actor.name),
  };

  if (item.type === "post") {
    return {
      type: "post",
      id: item.id,
      author: actor,
      contentType: (item.content.contentType as "photo" | "video" | "text") ?? "text",
      mediaUrl: item.content.mediaUrl as string | undefined,
      caption: item.content.caption as string | undefined,
      createdAt: item.createdAt,
      serverTimestamp: item.createdAt,
      score: 0,
    };
  }

  if (item.type === "comment") {
    return {
      type: "comment",
      id: item.id,
      postId: item.content.postId as string,
      content: (item.content.content as string) ?? "",
      author: actor,
      createdAt: item.createdAt,
      serverTimestamp: item.createdAt,
      score: 0,
    };
  }

  // reaction / event — map to a compatible shape
  return {
    type: "post",
    id: item.id,
    author: actor,
    contentType: "text",
    caption:
      item.type === "reaction"
        ? `reacted with ${item.content.emoji ?? "👍"}`
        : (item.content.title as string | undefined),
    createdAt: item.createdAt,
    serverTimestamp: item.createdAt,
    score: 0,
  };
}

// ─── Section Counts ────────────────────────────────────────────────────────────
function countByType(items: SurfacedItem[]) {
  return {
    posts: items.filter((i) => i.type === "post").length,
    comments: items.filter((i) => i.type === "comment").length,
    members: items.filter((i) => i.type === "member_join").length,
    birthdays: items.filter((i) => i.type === "birthday").length,
  };
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({
  item,
  onClick,
}: {
  item: SurfacedItem;
  onClick?: (item: SurfacedItem) => void;
}) {
  const icon =
    item.contentType === "video" ? (
      <Video className="w-3.5 h-3.5" aria-hidden="true" />
    ) : item.contentType === "photo" ? (
      <Image className="w-3.5 h-3.5" aria-hidden="true" />
    ) : (
      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
    );

  return (
    <button
      onClick={() => onClick?.(item)}
      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:brightness-95 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      data-testid="whats-happening-post"
      data-post-id={item.id}
      aria-label={`Post by ${item.author?.name}: ${item.caption ?? ""}`}
    >
      <Avatar className="w-9 h-9 shrink-0 mt-0.5" data-testid="whats-happening-avatar">
        {item.author?.avatarUrl && (
          <AvatarImage src={item.author.avatarUrl} alt={item.author.name} />
        )}
        <AvatarFallback
          className="text-xs"
          style={{ backgroundColor: muted, color: mutedFg }}
        >
          {item.author?.initials ?? getInitials(item.author?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: cardFg }}
            data-testid="whats-happening-author-name"
          >
            {item.author?.name}
          </span>
          <span
            className="text-xs shrink-0"
            style={{ color: mutedFg }}
            data-testid="whats-happening-post-time"
          >
            {item.serverTimestamp ? formatTimeAgo(item.serverTimestamp) : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: primary }} aria-hidden="true">
            {icon}
          </span>
          <span className="text-xs" style={{ color: mutedFg }}>
            {item.contentType === "photo"
              ? "photo"
              : item.contentType === "video"
              ? "video"
              : "post"}
          </span>
        </div>

        {item.caption && (
          <p
            className="text-sm line-clamp-2"
            style={{ color: cardFg }}
            data-testid="whats-happening-post-caption"
          >
            {item.caption}
          </p>
        )}

        {item.mediaUrl && (
          <div
            className="mt-2 rounded-lg overflow-hidden h-32 w-full"
            style={{ backgroundColor: muted }}
            data-testid="whats-happening-post-media"
            aria-label="Post media"
          >
            {/* Lazy-loaded via browser; no Next/Image needed for URL */}
            <img
              src={item.mediaUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {(item.reactionCount ?? 0) > 0 || (item.commentCount ?? 0) > 0 ? (
          <div className="flex items-center gap-3 mt-2" aria-label="Engagement">
            {(item.reactionCount ?? 0) > 0 && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: mutedFg }}
                data-testid="whats-happening-post-reactions"
              >
                <Heart className="w-3 h-3" aria-hidden="true" />
                {item.reactionCount}
              </span>
            )}
            {(item.commentCount ?? 0) > 0 && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: mutedFg }}
                data-testid="whats-happening-post-comments"
              >
                <MessageSquare className="w-3 h-3" aria-hidden="true" />
                {item.commentCount}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </button>
  );
}

// ─── Comment Card ──────────────────────────────────────────────────────────────
function CommentCard({
  item,
  onClick,
}: {
  item: SurfacedItem;
  onClick?: (item: SurfacedItem) => void;
}) {
  return (
    <button
      onClick={() => onClick?.(item)}
      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:brightness-95 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      data-testid="whats-happening-comment"
      data-comment-id={item.id}
      aria-label={`Comment by ${item.author?.name} on your post`}
    >
      <Avatar className="w-9 h-9 shrink-0 mt-0.5" data-testid="whats-happening-avatar">
        {item.author?.avatarUrl && (
          <AvatarImage src={item.author.avatarUrl} alt={item.author.name} />
        )}
        <AvatarFallback
          className="text-xs"
          style={{ backgroundColor: muted, color: mutedFg }}
        >
          {item.author?.initials ?? getInitials(item.author?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ color: cardFg }}
              data-testid="whats-happening-comment-author"
            >
              {item.author?.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
              data-testid="whats-happening-comment-badge"
            >
              on your post
            </Badge>
          </div>
          <span
            className="text-xs shrink-0"
            style={{ color: mutedFg }}
            data-testid="whats-happening-comment-time"
          >
            {item.serverTimestamp ? formatTimeAgo(item.serverTimestamp) : ""}
          </span>
        </div>

        <p
          className="text-sm line-clamp-2"
          style={{ color: cardFg }}
          data-testid="whats-happening-comment-content"
        >
          {item.content}
        </p>

        {item.postCaption && (
          <p
            className="text-xs mt-1 italic truncate"
            style={{ color: mutedFg }}
            data-testid="whats-happening-comment-post-caption"
          >
            Re: {item.postCaption}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Birthday Card ─────────────────────────────────────────────────────────────
function BirthdayCard({
  item,
  onClick,
}: {
  item: SurfacedItem;
  onClick?: (item: SurfacedItem) => void;
}) {
  return (
    <button
      onClick={() => onClick?.(item)}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:brightness-95 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      data-testid="whats-happening-birthday"
      data-birthday-id={item.id}
      aria-label={`${item.displayName ?? item.person?.name} birthday: ${item.dateLabel}`}
    >
      <div
        className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${primary}20` }}
        aria-hidden="true"
        data-testid="whats-happening-birthday-icon"
      >
        <Cake className="w-4 h-4" style={{ color: primary }} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ color: cardFg }}
              data-testid="whats-happening-birthday-name"
            >
              {item.displayName ?? item.person?.name}
            </span>
            {item.isToday && (
              <Badge
                className="text-[10px] px-1.5 py-0"
                data-testid="whats-happening-birthday-today-badge"
              >
                🎉 Today!
              </Badge>
            )}
            {item.isTomorrow && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
                data-testid="whats-happening-birthday-tomorrow-badge"
              >
                Tomorrow
              </Badge>
            )}
          </div>
          <span
            className="text-xs shrink-0"
            style={{ color: primary }}
            data-testid="whats-happening-birthday-label"
          >
            {item.dateLabel}
          </span>
        </div>
        <p className="text-xs" style={{ color: mutedFg }}>
          Birthday {item.dateLabel?.toLowerCase()}
        </p>
      </div>
    </button>
  );
}

// ─── Member Join Card ─────────────────────────────────────────────────────────
function MemberJoinCard({
  item,
  onClick,
}: {
  item: SurfacedItem;
  onClick?: (item: SurfacedItem) => void;
}) {
  return (
    <button
      onClick={() => onClick?.(item)}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:brightness-95 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      data-testid="whats-happening-member-join"
      data-member-id={item.id}
      aria-label={`${item.actor?.name ?? "Someone"} joined the family`}
    >
      <Avatar className="w-9 h-9 shrink-0" data-testid="whats-happening-avatar">
        {item.actor?.avatarUrl && (
          <AvatarImage src={item.actor.avatarUrl} alt={item.actor.name} />
        )}
        <AvatarFallback
          className="text-xs"
          style={{ backgroundColor: muted, color: mutedFg }}
        >
          {item.actor?.initials ?? getInitials(item.actor?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-semibold"
              style={{ color: cardFg }}
              data-testid="whats-happening-member-name"
            >
              {item.actor?.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
              data-testid="whats-happening-member-joined-badge"
            >
              <Users className="w-2.5 h-2.5 mr-0.5 inline" aria-hidden="true" />
              Joined
            </Badge>
          </div>
          <span
            className="text-xs shrink-0"
            style={{ color: mutedFg }}
            data-testid="whats-happening-member-time"
          >
            {item.serverTimestamp ? formatTimeAgo(item.serverTimestamp) : ""}
          </span>
        </div>
        {item.invitedBy && (
          <p className="text-xs" style={{ color: mutedFg }}>
            Invited by {item.invitedBy.name}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  count,
  items,
  children,
  onSeeAll,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  items: SurfacedItem[];
  children: (item: SurfacedItem) => React.ReactNode;
  onSeeAll?: () => void;
  emptyMessage?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      className="space-y-2"
      data-testid={`whats-happening-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      aria-label={title}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span style={{ color: primary }} aria-hidden="true">
            {icon}
          </span>
          <h3
            className="text-sm font-semibold"
            style={{ color: fg }}
            data-testid={`whats-happening-section-${title.toLowerCase().replace(/\s+/g, "-")}-title`}
          >
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            data-testid={`whats-happening-section-${title.toLowerCase().replace(/\s+/g, "-")}-count`}
          >
            {count}
          </Badge>
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-xs transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: primary }}
            data-testid={`whats-happening-see-all-${title.toLowerCase().replace(/\s+/g, "-")}`}
            aria-label={`See all ${title}`}
          >
            See all
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2" role="list" aria-label={`${title} items`}>
        {items.map((item) => (
          <div key={item.id} role="listitem" data-testid={`whats-happening-item`}>
            {children(item)}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ familyName }: { familyName?: string }) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${border}`,
      }}
      data-testid="whats-happening-empty"
      role="status"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: muted }}
        aria-hidden="true"
      >
        <Sparkles className="w-5 h-5" style={{ color: mutedFg }} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: cardFg }}>
        Nothing happening yet
      </p>
      <p className="text-xs" style={{ color: mutedFg }}>
        {familyName
          ? `Share a moment with ${familyName} to get started`
          : "Share a moment with your family to get started"}
      </p>
    </div>
  );
}

// ─── Error State ───────────────────────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${border}`,
      }}
      data-testid="whats-happening-error"
      role="alert"
    >
      <p className="text-sm mb-3" style={{ color: cardFg }}>
        {message ?? "Couldn't load activity"}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: primary,
            color: "var(--primary-foreground)",
          }}
          data-testid="whats-happening-retry"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function WhatsHappeningNow({
  familyId,
  limit = 20,
  currentUserId,
  onItemClick,
  onSeeAllClick,
}: WhatsHappeningNowProps) {
  const [items, setItems] = useState<SurfacedItem[]>([]);
  const [familyName, setFamilyName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState({
    posts: 0,
    comments: 0,
    members: 0,
    birthdays: 0,
  });

  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/family/activity?familyId=${familyId}&limit=${limit}`
      );

      if (!res.ok) {
        if (res.status === 401) throw new Error("Please sign in");
        if (res.status === 403) throw new Error("You're not a member of this family");
        if (res.status === 429) throw new Error("Too many requests — please wait a moment");
        throw new Error(`Failed to load (${res.status})`);
      }

      const data = await res.json();

      // Detect which shape the API returned
      const isLegacy = "nextCursor" in data;

      if (isLegacy) {
        // Legacy shape — adapt to SurfacedItem[]
        const legacy = data as LegacyActivityResponse;
        const adapted: SurfacedItem[] = (legacy.items ?? []).map((item) =>
          adaptLegacyItem(item, currentUserId)
        );
        setItems(adapted);
        setFamilyName(legacy.familyName);
        setHasMore(legacy.nextCursor !== null);
        setCounts(countByType(adapted));
      } else {
        // Spec-compliant shape
        const specData = data as ActivityResponse;
        setItems(specData.items ?? []);
        setFamilyName(specData.familyId);
        setGeneratedAt(specData.generatedAt ?? null);
        setHasMore(specData.meta?.hasMore ?? false);
        setCounts({
          posts: specData.meta?.sections?.posts?.count ?? 0,
          comments: specData.meta?.sections?.comments?.count ?? 0,
          members: specData.meta?.sections?.members?.count ?? 0,
          birthdays: specData.meta?.sections?.birthdays?.count ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [familyId, limit, currentUserId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // ─── Partition items by type ────────────────────────────────────────────────
  const posts = items.filter((i) => i.type === "post").slice(0, 3);
  const comments = items.filter((i) => i.type === "comment").slice(0, 3);
  const memberJoins = items.filter((i) => i.type === "member_join").slice(0, 2);
  const birthdays = items.filter((i) => i.type === "birthday").slice(0, 3);

  const hasAnyContent = posts.length > 0 || comments.length > 0 || memberJoins.length > 0 || birthdays.length > 0;

  return (
    <div
      className="w-full"
      data-testid="whats-happening-now"
      aria-label="What's happening now"
      aria-busy={isLoading}
    >
      {/* Section: Recent Posts */}
      {posts.length > 0 && (
        <Section
          title="Recent posts"
          icon={<Image className="w-4 h-4" aria-hidden="true" />}
          count={counts.posts}
          items={posts}
          onSeeAll={onSeeAllClick}
        >
          {(item) => <PostCard item={item} onClick={onItemClick} />}
        </Section>
      )}

      {/* Section: Comments on your posts */}
      {comments.length > 0 && (
        <Section
          title="Comments on your posts"
          icon={<MessageSquare className="w-4 h-4" aria-hidden="true" />}
          count={counts.comments}
          items={comments}
          onSeeAll={onSeeAllClick}
        >
          {(item) => <CommentCard item={item} onClick={onItemClick} />}
        </Section>
      )}

      {/* Section: Birthdays */}
      {birthdays.length > 0 && (
        <Section
          title="Upcoming birthdays"
          icon={<Cake className="w-4 h-4" aria-hidden="true" />}
          count={counts.birthdays}
          items={birthdays}
          onSeeAll={onSeeAllClick}
        >
          {(item) => <BirthdayCard item={item} onClick={onItemClick} />}
        </Section>
      )}

      {/* Section: New members */}
      {memberJoins.length > 0 && (
        <Section
          title="New family members"
          icon={<Users className="w-4 h-4" aria-hidden="true" />}
          count={counts.members}
          items={memberJoins}
          onSeeAll={onSeeAllClick}
        >
          {(item) => <MemberJoinCard item={item} onClick={onItemClick} />}
        </Section>
      )}

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* Error */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={fetchActivity} />
      )}

      {/* Empty */}
      {!isLoading && !error && !hasAnyContent && (
        <EmptyState familyName={familyName} />
      )}

      {/* Meta footer — polling hint */}
      {generatedAt && (
        <p
          className="text-[10px] text-center mt-3"
          style={{ color: mutedFg }}
          data-testid="whats-happening-meta"
          aria-live="polite"
        >
          Updated {formatTimeAgo(generatedAt)}
          {hasMore && (
            <span data-testid="whats-happening-has-more">
              {" "}·{" "}
              <button
                onClick={onSeeAllClick}
                className="underline hover:no-underline"
                style={{ color: primary }}
                data-testid="whats-happening-view-more-link"
              >
                View more
              </button>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
