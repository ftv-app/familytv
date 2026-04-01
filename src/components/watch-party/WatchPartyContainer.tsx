"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useWatchPartySocket, type ChatMessage } from "@/hooks/useWatchPartySocket";
import type { MergedPresenceUser } from "@/lib/watch-party/presence";
import { ReactionBar } from "./ReactionBar";
import { PresenceStrip, PresenceCollapsed, PresencePopover } from "./PresenceStrip";
import { ChatSidebar } from "./ChatSidebar";
import { ChatBottomSheet } from "./ChatBottomSheet";
import type { ReactionBubbleData } from "./ReactionBubble";

/* ============================================================
   Types
   ============================================================ */

interface WatchPartyContainerProps {
  /** Watch party room ID */
  roomId: string;
  /** Current user info */
  userId: string;
  userName: string;
  avatarUrl?: string;
  /** Video content info */
  videoUrl: string;
  videoTitle: string;
  videoChosenBy: string;
  posterUrl?: string;
  /** Socket.IO server URL */
  socketUrl?: string;
  /** Custom className */
  className?: string;
}

/* ============================================================
   WatchPartyContainer
   ============================================================ */

function WatchPartyContainer({
  roomId,
  userId,
  userName,
  avatarUrl,
  videoUrl,
  videoTitle,
  videoChosenBy,
  posterUrl,
  socketUrl,
  className,
}: WatchPartyContainerProps) {
  /* ---- State ---- */
  const [presencePopoverOpen, setPresencePopoverOpen] = useState(false);
  const [chatSheetOpen, setChatSheetOpen] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [externalReactions, setExternalReactions] = useState<ReactionBubbleData[]>([]);
  const [videoTimestamp, setVideoTimestamp] = useState(0);

  /* ---- Socket.IO Hook ---- */
  const {
    state,
    sendMessage,
    sendReaction,
    disconnect,
  } = useWatchPartySocket({
    roomId,
    userId,
    userName,
    avatarUrl,
    socketUrl,
    enableChat: true,
    enablePresence: true,
    onPresenceUpdate: (presence) => {
      // Presence updated
    },
    onMessageReceived: (message) => {
      // If chat is closed, increment unread count
      if (!chatSheetOpen) {
        setNewMessagesCount((prev) => prev + 1);
      }
    },
    onReactionReceived: (reaction) => {
      // Add external reaction bubble
      setExternalReactions((prev) => [
        ...prev.slice(-14),
        {
          id: `ext-${Date.now()}-${Math.random()}`,
          emoji: reaction.emoji,
          userName: reaction.userName,
          isOwn: false,
          videoTimestamp: reaction.videoTimestamp,
        },
      ]);
    },
    onConnectionChange: (isConnected) => {
      // Connection state changed
    },
  });

  /* ---- Computed ---- */
  const unreadChatCount = useMemo(() => {
    return newMessagesCount;
  }, [newMessagesCount]);

  /* ---- Handlers ---- */
  const handleSendMessage = useCallback(
    (text: string) => {
      sendMessage(text, videoTimestamp);
    },
    [sendMessage, videoTimestamp]
  );

  const handleReaction = useCallback(
    (emoji: string) => {
      sendReaction(emoji, videoTimestamp);
    },
    [sendReaction, videoTimestamp]
  );

  const handleVideoTimeUpdate = useCallback((time: number) => {
    setVideoTimestamp(time);
  }, []);

  const handleChatOpen = useCallback(() => {
    setChatSheetOpen(true);
    setNewMessagesCount(0);
  }, []);

  const handleChatClose = useCallback(() => {
    setChatSheetOpen(false);
  }, []);

  const handlePresencePopoverOpen = useCallback(() => {
    setPresencePopoverOpen(true);
  }, []);

  const handlePresencePopoverClose = useCallback(() => {
    setPresencePopoverOpen(false);
  }, []);

  /* ---- Render ---- */
  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        "bg-[#0D0D0F]",
        className
      )}
      data-testid="watch-party-container"
      style={{ backgroundColor: "#0D0D0F" }}
    >
      {/* Reconnecting banner */}
      {state.isReconnecting && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#F39C12", color: "#0D0D0F" }}
          role="alert"
          aria-live="assertive"
          data-testid="watch-party-offline-indicator"
        >
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Reconnecting...
        </div>
      )}

      {/* Main content: responsive grid */}
      <div
        className={cn(
          "h-full",
          // Mobile: stacked vertically
          "flex flex-col",
          // Desktop (md+): side-by-side grid
          "md:grid md:grid-cols-[1fr_300px] md:gap-4"
        )}
      >
        {/* Left: Video + Presence + Reactions */}
        <div
          className={cn(
            "flex flex-col min-h-0",
            // Mobile: flex-1
            "flex-1",
            // Desktop: full height
            "md:h-full"
          )}
        >
          {/* Video Player */}
          <VideoPlayerWrapper
            videoUrl={videoUrl}
            posterUrl={posterUrl}
            videoTitle={videoTitle}
            videoChosenBy={videoChosenBy}
            onTimeUpdate={handleVideoTimeUpdate}
          />

          {/* Presence + Chat Toggle Row (Mobile) */}
          <div className="md:hidden flex items-center justify-between px-3 py-2">
            <PresenceCollapsed
              users={state.presence}
              currentUserId={userId}
              onTap={handlePresencePopoverOpen}
              className="flex-1"
            />

            {/* Chat toggle */}
            <button
              type="button"
              onClick={handleChatOpen}
              className={cn(
                "relative ml-2 w-12 h-12 flex items-center justify-center rounded-lg",
                "bg-[#1A1A1E]/80 backdrop-blur-sm",
                "border border-white/06",
                "text-[#A8A8B0]",
                "hover:bg-[#1A1A1E]",
                "active:scale-95",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]",
                "cursor-pointer"
              )}
              aria-label={`Open live chat${unreadChatCount > 0 ? `, ${unreadChatCount} unread messages` : ""}`}
              aria-expanded={chatSheetOpen}
              data-testid="watch-party-chat-toggle"
            >
              💬
              {unreadChatCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1"
                  style={{ backgroundColor: "#C41E3A", color: "#FDF8F3" }}
                  aria-hidden="true"
                >
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {/* Presence Strip (Desktop) */}
          <div className="hidden md:block px-0 pt-3">
            <PresenceStrip users={state.presence} currentUserId={userId} />
          </div>

          {/* Reaction Bar */}
          <ReactionBar
            videoTimestamp={videoTimestamp}
            onReaction={handleReaction}
            externalReactions={externalReactions}
          />
        </div>

        {/* Right: Chat Sidebar (Desktop only) */}
        <div
          className={cn(
            "hidden md:flex flex-col h-full overflow-hidden"
          )}
        >
          <ChatSidebar
            messages={state.messages}
            currentUserId={userId}
            onSendMessage={handleSendMessage}
            isLoading={!state.isConnected}
          />
        </div>
      </div>

      {/* Mobile: Chat Bottom Sheet */}
      <ChatBottomSheet
        messages={state.messages}
        currentUserId={userId}
        onSendMessage={handleSendMessage}
        isOpen={chatSheetOpen}
        onClose={handleChatClose}
        isLoading={!state.isConnected}
        newMessagesCount={unreadChatCount}
        onNewMessagesClick={() => setNewMessagesCount(0)}
      />

      {/* Mobile: Presence Popover */}
      <PresencePopover
        users={state.presence}
        currentUserId={userId}
        isOpen={presencePopoverOpen}
        onClose={handlePresencePopoverClose}
      />
    </div>
  );
}

/* ============================================================
   Video Player Wrapper
   ============================================================ */

interface VideoPlayerWrapperProps {
  videoUrl: string;
  posterUrl?: string;
  videoTitle: string;
  videoChosenBy: string;
  onTimeUpdate?: (time: number) => void;
}

function VideoPlayerWrapper({
  videoUrl,
  posterUrl,
  videoTitle,
  videoChosenBy,
  onTimeUpdate,
}: VideoPlayerWrapperProps) {
  return (
    <div
      className="relative w-full bg-black"
      style={{ aspectRatio: "16/9" }}
      data-testid="watch-party-video-player"
    >
      <video
        className="w-full h-full"
        src={videoUrl}
        poster={posterUrl}
        style={{ objectFit: "contain" }}
        playsInline
        onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
        aria-label={`${videoTitle}, chosen by ${videoChosenBy}`}
      />

      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(13,13,15,0.5) 100%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export { WatchPartyContainer };
export type { WatchPartyContainerProps };
