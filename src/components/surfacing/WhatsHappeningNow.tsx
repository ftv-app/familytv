"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PresenceUpdate, ReactionUpdate } from "@/lib/socket/types";
import { Clock, Calendar, Users, MessageCircle, Heart, Loader2, Wifi, WifiOff } from "lucide-react";

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const TERRACOTTA = "#c4785a";
const CREAM = "#faf8f5";
const CREAM_MUTED = "oklch(0.45_0.015_50)";
const DARK_CHARS = "oklch(0.18_0.015_50)";
const CARD_BG = "#fffdfb";
const CARD_BORDER = "rgba(196,120,90,0.15)";
const ONLINE_GREEN = "#22C55E";
const WARM_BG = "rgba(196,120,90,0.06)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OnlineMember {
  userId: string;
  userName: string;
  sessionId: string;
  joinedAt: number;
}

interface RecentActivity {
  id: string;
  type: "reaction" | "comment" | "post";
  actorName: string;
  emoji?: string;
  preview?: string;
  timestamp: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startDate: string;
  allDay: boolean;
  hoursFromNow: number;
}

interface SurfacingState {
  onlineMembers: OnlineMember[];
  recentActivity: RecentActivity[];
  upcomingEvents: UpcomingEvent[];
  isConnected: boolean;
  isLoading: boolean;
}

interface WhatsHappeningNowProps {
  familyId: string;
  currentUserId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatEventHours(hours: number): string {
  if (hours < 1) return "starting soon";
  if (hours < 24) return `in ${Math.round(hours)}h`;
  return `tomorrow`;
}

// ─── Presence Card ─────────────────────────────────────────────────────────────
function OnlinePresenceCard({
  members,
  onMemberClick,
}: {
  members: OnlineMember[];
  onMemberClick?: (member: OnlineMember) => void;
}) {
  if (members.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 2px 12px rgba(196,120,90,0.08)",
      }}
      data-testid="surfacing-presence-card"
    >
      <div className="flex items-center gap-2">
        <Wifi className="w-4 h-4" style={{ color: ONLINE_GREEN }} aria-hidden="true" />
        <span
          className="text-sm font-semibold"
          style={{ color: DARK_CHARS, fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
        >
          {members.length === 1 ? "Family member" : "Family members"} online
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.userId}
            onClick={() => onMemberClick?.(m)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: WARM_BG,
              color: DARK_CHARS,
              border: `1px solid ${CARD_BORDER}`,
            }}
            data-testid="surfacing-online-member"
            data-user-id={m.userId}
            aria-label={`${m.userName} is online`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ONLINE_GREEN }}
              aria-hidden="true"
            />
            {m.userName}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity Card ──────────────────────────────────────────────────────
function RecentActivityCard({
  activities,
  onActivityClick,
}: {
  activities: RecentActivity[];
  onActivityClick?: (activity: RecentActivity) => void;
}) {
  if (activities.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 2px 12px rgba(196,120,90,0.08)",
      }}
      data-testid="surfacing-activity-card"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4" style={{ color: TERRACOTTA }} aria-hidden="true" />
        <span
          className="text-sm font-semibold"
          style={{ color: DARK_CHARS, fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
        >
          Recent activity
        </span>
      </div>
      <div className="space-y-2">
        {activities.map((a) => (
          <button
            key={a.id}
            onClick={() => onActivityClick?.(a)}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-[rgba(196,120,90,0.06)]"
            data-testid="surfacing-activity-item"
            data-activity-id={a.id}
            data-activity-type={a.type}
          >
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: WARM_BG }}>
              {a.type === "reaction" && a.emoji ? (
                <span className="text-sm" aria-hidden="true">{a.emoji}</span>
              ) : a.type === "comment" ? (
                <MessageCircle className="w-3.5 h-3.5" style={{ color: TERRACOTTA }} aria-hidden="true" />
              ) : (
                <Heart className="w-3.5 h-3.5" style={{ color: TERRACOTTA }} aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: DARK_CHARS }}>
                <span className="font-medium">{a.actorName}</span>
                {a.type === "reaction" && a.emoji
                  ? ` reacted ${a.emoji}`
                  : a.type === "comment"
                  ? ` commented`
                  : ` shared a moment`}
              </p>
              {a.preview && (
                <p className="text-xs truncate" style={{ color: CREAM_MUTED }}>
                  {a.preview}
                </p>
              )}
            </div>
            <time
              dateTime={new Date(a.timestamp).toISOString()}
              className="text-xs shrink-0"
              style={{ color: `${TERRACOTTA}99` }}
            >
              {formatTimeAgo(a.timestamp)}
            </time>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Upcoming Event Card ───────────────────────────────────────────────────────
function UpcomingEventCard({
  events,
  onEventClick,
}: {
  events: UpcomingEvent[];
  onEventClick?: (event: UpcomingEvent) => void;
}) {
  if (events.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 2px 12px rgba(196,120,90,0.08)",
      }}
      data-testid="surfacing-event-card"
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" style={{ color: TERRACOTTA }} aria-hidden="true" />
        <span
          className="text-sm font-semibold"
          style={{ color: DARK_CHARS, fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
        >
          Upcoming
        </span>
      </div>
      <div className="space-y-2">
        {events.map((e) => (
          <button
            key={e.id}
            onClick={() => onEventClick?.(e)}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-[rgba(196,120,90,0.06)]"
            data-testid="surfacing-event-item"
            data-event-id={e.id}
          >
            <div
              className="shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center"
              style={{ backgroundColor: "rgba(196,120,90,0.1)" }}
              aria-hidden="true"
            >
              <Clock className="w-3.5 h-3.5" style={{ color: TERRACOTTA }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: DARK_CHARS }}>
                {e.title}
              </p>
              <p className="text-xs" style={{ color: CREAM_MUTED }}>
                {e.allDay ? "All day" : formatEventHours(e.hoursFromNow)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Connection Status ────────────────────────────────────────────────────────
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs"
      style={{ color: isConnected ? ONLINE_GREEN : "#EF4444" }}
      role="status"
      aria-live="polite"
      data-testid="surfacing-connection-status"
      aria-label={isConnected ? "Connected to real-time updates" : "Disconnected from real-time updates"}
    >
      {isConnected ? (
        <Wifi className="w-3 h-3" aria-hidden="true" />
      ) : (
        <WifiOff className="w-3 h-3" aria-hidden="true" />
      )}
      {isConnected ? "Live" : "Offline"}
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────
function SurfacingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 animate-pulse"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: WARM_BG }} />
            <div className="h-3 rounded w-32" style={{ backgroundColor: WARM_BG }} />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-6 rounded-full w-16" style={{ backgroundColor: WARM_BG }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function NothingHappening({ familyName }: { familyName?: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 2px 12px rgba(196,120,90,0.08)",
      }}
      data-testid="surfacing-empty"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: WARM_BG }}
        aria-hidden="true"
      >
        <Users className="w-5 h-5" style={{ color: CREAM_MUTED }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: DARK_CHARS }}>
        Nothing happening yet
      </p>
      <p className="text-xs" style={{ color: CREAM_MUTED }}>
        {familyName ? `Invite family to ${familyName}` : "Invite family members to get started"}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function WhatsHappeningNow({
  familyId,
  currentUserId,
}: WhatsHappeningNowProps) {
  const [state, setState] = useState<SurfacingState>({
    onlineMembers: [],
    recentActivity: [],
    upcomingEvents: [],
    isConnected: false,
    isLoading: true,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const presenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch upcoming events (24h) from activity API
  const fetchUpcomingEvents = useCallback(async (): Promise<UpcomingEvent[]> => {
    try {
      const res = await fetch(
        `/api/family/activity?familyId=${familyId}&limit=20`
      );
      if (!res.ok) return [];
      const data = await res.json();

      const now = Date.now();
      const in24h = now + 24 * 60 * 60 * 1000;

      return (data.items ?? [])
        .filter((item: { type: string; content: { startDate?: string; allDay?: boolean } }) => {
          if (item.type !== "event") return false;
          if (!item.content.startDate) return false;
          const eventTime = new Date(item.content.startDate).getTime();
          return eventTime >= now && eventTime <= in24h;
        })
        .map((item: { id: string; content: { title: string; startDate: string; allDay?: boolean } }) => {
          const startTime = new Date(item.content.startDate).getTime();
          const hoursFromNow = (startTime - now) / (1000 * 60 * 60);
          return {
            id: item.id,
            title: item.content.title,
            startDate: item.content.startDate,
            allDay: item.content.allDay ?? false,
            hoursFromNow,
          };
        })
        .slice(0, 3);
    } catch {
      return [];
    }
  }, [familyId]);

  // Setup WebSocket presence connection
  const connectPresence = useCallback(() => {
    // Use the Socket.IO-style presence endpoint
    // The presence data is published via the socket server on the same host
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/api/socket/presence`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({ ...prev, isConnected: true }));
        // Announce presence
        ws.send(
          JSON.stringify({
            type: "presence:join",
            payload: { familyId, userId: currentUserId },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "presence:update") {
            const update = msg.payload as PresenceUpdate;
            setState((prev) => {
              if (update.action === "leave") {
                return {
                  ...prev,
                  onlineMembers: prev.onlineMembers.filter(
                    (m) => m.userId !== update.userId
                  ),
                };
              }
              // join
              if (!prev.onlineMembers.find((m) => m.userId === update.userId)) {
                return {
                  ...prev,
                  onlineMembers: [
                    ...prev.onlineMembers,
                    {
                      userId: update.userId,
                      userName: update.userName,
                      sessionId: update.sessionId,
                      joinedAt: update.joinedAt,
                    },
                  ],
                };
              }
              return prev;
            });
          } else if (msg.type === "reaction:update") {
            const reaction = msg.payload as ReactionUpdate;
            setState((prev) => {
              const newActivity: RecentActivity = {
                id: `reaction-${reaction.timestamp}`,
                type: "reaction",
                actorName: reaction.userName,
                emoji: reaction.emoji,
                timestamp: reaction.timestamp,
              };
              return {
                ...prev,
                recentActivity: [newActivity, ...prev.recentActivity].slice(0, 5),
              };
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setState((prev) => ({ ...prev, isConnected: false }));
        // Reconnect after 3s
        presenceTimeoutRef.current = setTimeout(() => {
          connectPresence();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available — fall back to polling
      setState((prev) => ({ ...prev, isConnected: false }));
    }
  }, [familyId, currentUserId]);

  useEffect(() => {
    // Initial data load
    const loadInitial = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      const [events] = await Promise.all([fetchUpcomingEvents()]);
      setState((prev) => ({
        ...prev,
        upcomingEvents: events,
        isLoading: false,
      }));
    };
    loadInitial();

    // Connect to presence
    connectPresence();

    return () => {
      socketRef.current?.close();
      if (presenceTimeoutRef.current) {
        clearTimeout(presenceTimeoutRef.current);
      }
    };
  }, [connectPresence, fetchUpcomingEvents]);

  const handleActivityClick = useCallback((activity: RecentActivity) => {
    // Navigate to the relevant post or reaction source
    // For now, this is a no-op; can be wired to navigate()
  }, []);

  const handleEventClick = useCallback((event: UpcomingEvent) => {
    // Could open event detail modal
  }, []);

  const handleMemberClick = useCallback((member: OnlineMember) => {
    // Could open member profile
  }, []);

  const { onlineMembers, recentActivity, upcomingEvents, isConnected, isLoading } = state;

  if (isLoading) {
    return (
      <section
        aria-label="What's happening now"
        data-testid="surfacing-container"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-heading text-lg font-semibold"
            style={{ color: DARK_CHARS }}
          >
            What&apos;s happening
          </h2>
        </div>
        <SurfacingSkeleton />
      </section>
    );
  }

  const hasContent =
    onlineMembers.length > 0 || recentActivity.length > 0 || upcomingEvents.length > 0;

  return (
    <section
      aria-label="What's happening now"
      data-testid="surfacing-container"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-heading text-lg font-semibold"
          style={{ color: DARK_CHARS }}
        >
          What&apos;s happening
        </h2>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {!hasContent ? (
        <NothingHappening />
      ) : (
        <div className="space-y-3">
          <OnlinePresenceCard
            members={onlineMembers}
            onMemberClick={handleMemberClick}
          />
          <UpcomingEventCard
            events={upcomingEvents}
            onEventClick={handleEventClick}
          />
          <RecentActivityCard
            activities={recentActivity}
            onActivityClick={handleActivityClick}
          />
        </div>
      )}
    </section>
  );
}
