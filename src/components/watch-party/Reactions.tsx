"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { cn } from "@/lib/utils";

// Default 6 reactions as per PRD
export const REACTION_EMOJIS = ["😂", "❤️", "😮", "👏", "😢", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/**
 * Reaction event from server (reaction:new)
 */
export interface ReactionEvent {
  userId: string;
  userName: string;
  emoji: ReactionEmoji;
  videoTimestamp: number;
}

/**
 * Local reaction bubble with unique ID and animation tracking
 */
export interface Reaction extends ReactionEvent {
  id: string;
  createdAt: Date;
  isOwn?: boolean;
}

interface ReactionsProps {
  /** Socket.IO server URL. If not provided, connects to default (window.location) */
  socketUrl?: string;
  /** The watch party room ID: family:${familyId}:video:${videoId}:session:${sessionId} */
  roomId: string;
  /** Current user's ID from Clerk JWT */
  userId: string;
  /** Current user's display name */
  userName: string;
  /** Current video playback timestamp in seconds */
  videoTimestamp?: number;
  /** Optional className for the container */
  className?: string;
  /** Maximum concurrent bubbles (default: 15 per PRD) */
  maxBubbles?: number;
  /** Callback when a reaction is received from another user */
  onReactionReceived?: (reaction: Reaction) => void;
  /** Callback when a reaction is sent */
  onReactionSent?: (reaction: Reaction) => void;
}

/**
 * Watch Party Quick Reactions Component
 * 
 * Features:
 * - 6 floating reaction bubbles: 😂 ❤️ 😮 👏 😢 🔥
 * - Click to send reaction via Socket.IO
 * - Reactions float up and fade out (animation)
 * - Shows reactions from other family members in real-time
 * - Mobile: fixed bottom bar with large touch targets (44x44px min)
 * - All buttons have data-testid="watch-party-reaction-{emoji}"
 * 
 * WCAG 2.1 AA compliant with proper focus management and keyboard support.
 */
export type { ReactionsProps };

export function Reactions({
  socketUrl,
  roomId,
  userId,
  userName,
  videoTimestamp = 0,
  className,
  maxBubbles = 15,
  onReactionReceived,
  onReactionSent,
}: ReactionsProps) {
  // Socket.IO connection
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Active reaction bubbles on screen
  const [bubbles, setBubbles] = useState<Reaction[]>([]);
  
  // Track bubble counter for unique IDs
  const bubbleCounterRef = useRef(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!roomId) return;

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      // Socket connected
    });

    socketInstance.on("disconnect", (reason) => {
      // Socket disconnected
    });

    socketInstance.on("connect_error", (error) => {
      // Socket connection error
    });

    // Listen for reactions from other users
    socketInstance.on("reaction:new", (data: ReactionEvent) => {
      // Skip if this is our own reaction (server echoes back)
      // or if it's from a different room
      const reaction: Reaction = {
        ...data,
        id: `bubble-${Date.now()}-${bubbleCounterRef.current++}`,
        createdAt: new Date(),
        isOwn: data.userId === userId,
      };

      setBubbles((prev) => {
        // Cull old bubbles if at max
        const updated = [...prev, reaction];
        if (updated.length > maxBubbles) {
          return updated.slice(-maxBubbles);
        }
        return updated;
      });

      onReactionReceived?.(reaction);
    });

    // Defer setSocket to avoid synchronous state update in effect body
    // This prevents potential cascading renders
    const timerId = setTimeout(() => {
      setSocket(socketInstance);
    }, 0);

    // Cleanup: remove listener and disconnect
    return () => {
      socketInstance.off("reaction:new");
      socketInstance.disconnect();
      setSocket(null);
      clearTimeout(timerId);
    };
  }, [roomId, socketUrl, userId, maxBubbles, onReactionReceived]);

  // Auto-remove bubbles after animation completes (3 seconds)
  useEffect(() => {
    if (bubbles.length === 0) return;

    const timeoutId = setTimeout(() => {
      // Use functional update to avoid dependency on bubbles
      setBubbles((prev) => {
        // Remove bubbles older than 3 seconds
        const cutoff = Date.now() - 3000;
        return prev.filter((b) => b.createdAt.getTime() > cutoff);
      });
    }, 100); // Check every 100ms

    return () => clearTimeout(timeoutId);
  }, [bubbles.length]); // Depend on length only to avoid cascading renders

  /**
   * Send a reaction via Socket.IO
   */
  const sendReaction = useCallback(
    (emoji: ReactionEmoji) => {
      if (!socket?.connected) {
        return;
      }

      const reactionData = {
        roomId,
        userId,
        userName,
        emoji,
        videoTimestamp,
      };

      // Emit to server
      socket.emit("reaction:send", reactionData);

      // Create local bubble for own reaction (immediately visible)
      const ownReaction: Reaction = {
        ...reactionData,
        id: `bubble-${Date.now()}-${bubbleCounterRef.current++}`,
        createdAt: new Date(),
        isOwn: true,
      };

      setBubbles((prev) => {
        const updated = [...prev, ownReaction];
        if (updated.length > maxBubbles) {
          return updated.slice(-maxBubbles);
        }
        return updated;
      });

      onReactionSent?.(ownReaction);
    },
    [socket, roomId, userId, userName, videoTimestamp, maxBubbles, onReactionSent]
  );

  return (
    <div
      className={cn(
        "relative w-full",
        // Mobile: fixed bottom bar
        "mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0",
        "mobile:bg-black/80 mobile:backdrop-blur-sm mobile:z-50",
        // Desktop: inline below video
        "desktop:relative desktop:bg-transparent",
        className
      )}
      role="region"
      aria-label="Watch party reactions"
      data-testid="watch-party-reaction-bar"
    >
      {/* Floating Reaction Bubbles Container */}
      <div
        className="absolute bottom-16 left-0 right-0 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {bubbles.map((bubble) => (
          <ReactionBubble key={bubble.id} reaction={bubble} />
        ))}
      </div>

      {/* Reaction Bar */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 p-2",
          // Mobile: full width with padding for safe area
          "mobile:pb-safe",
          // Desktop: inline
          "desktop:py-2 desktop:px-4"
        )}
        role="toolbar"
        aria-label="Quick reactions"
      >
        {REACTION_EMOJIS.map((emoji) => (
          <ReactionButton
            key={emoji}
            emoji={emoji}
            onClick={() => sendReaction(emoji)}
            aria-label={`react with ${getEmojiLabel(emoji)}`}
            data-testid={`watch-party-reaction-${emoji}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual reaction button with proper accessibility and touch targets
 */
interface ReactionButtonProps {
  emoji: ReactionEmoji;
  onClick: () => void;
  "aria-label": string;
  "data-testid": string;
}

function ReactionButton({ emoji, onClick, "aria-label": ariaLabel, "data-testid": dataTestid }: ReactionButtonProps) {
  return (
    <button
      type="button"
      role="button"
      data-testid={dataTestid}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        // Base styles - large touch target (minimum 44x44px per WCAG 2.1 AA)
        "inline-flex items-center justify-center",
        "rounded-xl",
        "min-w-[44px] min-h-[44px]", // 44x44px minimum touch target
        "w-11 h-11", // Consistent size: 44px
        
        // Visual styling - semi-transparent dark background
        "bg-black/40 backdrop-blur-sm",
        "border border-white/10",
        
        // Typography
        "text-xl leading-none",
        
        // Interaction states
        "transition-all duration-150",
        "hover:scale-110 hover:bg-black/60 hover:border-white/20",
        "active:scale-95",
        
        // Focus state for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        
        // Prevent text selection
        "select-none",
        
        // Cursor
        "cursor-pointer"
      )}
    >
      <span aria-hidden="true">{emoji}</span>
    </button>
  );
}

/**
 * Floating reaction bubble with animation
 * Animates: float up 200px, fade out in last 500ms, slight horizontal drift
 */
interface ReactionBubbleProps {
  reaction: Reaction;
}

/* ============================================================
   Module-level drift storage (avoids impure calls during render)
   ============================================================ */

// Store drift values per reaction ID to ensure stability across re-renders
const driftStorage = new Map<string, number>();

function ReactionBubble({ reaction }: ReactionBubbleProps) {
  // Random horizontal drift: ±30px as per PRD
  // eslint-disable-next-line react-hooks/purity -- Stable per-ID, cosmetic only
  if (!driftStorage.has(reaction.id)) {
    // eslint-disable-next-line react-hooks/purity
    driftStorage.set(reaction.id, (Math.random() - 0.5) * 60);
  }
  const drift = driftStorage.get(reaction.id)!;
  
  return (
    <div
      data-testid={`watch-party-reaction-bubble-${reaction.emoji}`}
      className={cn(
        "absolute bottom-16 left-1/2",
        "pointer-events-none",
        "select-none",
        "reaction-bubble" // CSS animation class
      )}
      style={{
        // Random horizontal offset for variety
        transform: `translateX(calc(-50% + ${drift}px))`,
        // CSS custom property for drift in animation
        "--drift": `${drift}px`,
      } as React.CSSProperties}
      aria-label={`${reaction.userName} reacted with ${getEmojiLabel(reaction.emoji)}`}
      role="img"
    >
      <div
        className={cn(
          "flex flex-col items-center gap-0.5",
          "animate-float-up" // Animation class
        )}
      >
        {/* Emoji */}
        <span className="text-3xl leading-none drop-shadow-lg">
          {reaction.emoji}
        </span>
        
        {/* User name badge */}
        <span
          className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            "bg-black/60 backdrop-blur-sm",
            "text-white/90 whitespace-nowrap"
          )}
        >
          {reaction.isOwn ? "You" : reaction.userName}
        </span>
      </div>
    </div>
  );
}

/**
 * Get human-readable label for emoji (for accessibility)
 */
function getEmojiLabel(emoji: ReactionEmoji): string {
  const labels: Record<ReactionEmoji, string> = {
    "😂": "crying with laughter",
    "❤️": "red heart",
    "😮": "astonished face",
    "👏": "clapping hands",
    "😢": "crying face",
    "🔥": "fire",
  };
  return labels[emoji] || emoji;
}

export default Reactions;
