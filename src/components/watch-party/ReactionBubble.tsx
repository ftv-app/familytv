"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Types
   ============================================================ */

interface ReactionBubbleData {
  id: string;
  emoji: string;
  userName: string;
  isOwn: boolean;
  videoTimestamp?: number;
}

/* ============================================================
   Props
   ============================================================ */

interface ReactionBubbleProps {
  reaction: ReactionBubbleData;
  /** Animation duration in ms (default: 2800 from PRD) */
  duration?: number;
  /** Custom className */
  className?: string;
}

/* ============================================================
   Emoji Label Helper
   ============================================================ */

const EMOJI_LABELS: Record<string, string> = {
  "😂": "crying with laughter",
  "❤️": "red heart",
  "😮": "astonished face",
  "👏": "clapping hands",
  "😢": "crying face",
  "🔥": "fire",
  "🎉": "party popper",
  "👍": "thumbs up",
  "😊": "smiling face",
  "😍": "heart eyes",
};

function getEmojiLabel(emoji: string): string {
  return EMOJI_LABELS[emoji] ?? emoji;
}

/* ============================================================
   Component
   ============================================================ */

function ReactionBubble({ reaction, duration = 2800, className }: ReactionBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const driftRef = useRef((Math.random() - 0.5) * 60); // ±30px random drift
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (prefersReducedMotion) {
      // Fade in place instead of floating animation
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1000); // 1s fade per reduced-motion spec
      return () => clearTimeout(fadeTimer);
    }

    // Remove bubble after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <div
      data-testid="watch-party-reaction-bubble"
      className={cn(
        "absolute pointer-events-none select-none",
        "flex flex-col items-center gap-0.5",
        // Position: centered horizontally, starts near reaction bar
        "left-1/2",
        // Animation
        !prefersReducedMotion && "animate-float-up",
        className
      )}
      style={
        {
          // Random horizontal drift
          transform: `translateX(calc(-50% + ${driftRef.current}px))`,
          "--drift": `${driftRef.current}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={`${reaction.userName} reacted with ${getEmojiLabel(reaction.emoji)}`}
    >
      {/* Emoji */}
      <span
        className={cn(
          "text-3xl leading-none drop-shadow-lg",
          // Fade out in last 500ms
          !prefersReducedMotion && "animate-bubble-fade"
        )}
        aria-hidden="true"
      >
        {reaction.emoji}
      </span>

      {/* User name badge */}
      <span
        className={cn(
          "text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
          "bg-black/60 backdrop-blur-sm text-white/90"
        )}
        aria-hidden="true"
      >
        {reaction.isOwn ? "You" : reaction.userName}
      </span>
    </div>
  );
}

/* ============================================================
   Container for managing multiple bubbles
   ============================================================ */

interface ReactionBubbleContainerProps {
  reactions: ReactionBubbleData[];
  maxBubbles?: number;
  className?: string;
}

function ReactionBubbleContainer({
  reactions,
  maxBubbles = 15,
  className,
}: ReactionBubbleContainerProps) {
  const visibleReactions = reactions.slice(-maxBubbles);

  return (
    <div
      className={cn(
        "absolute bottom-16 left-0 right-0 pointer-events-none overflow-hidden",
        className
      )}
      aria-live="polite"
      aria-atomic="false"
      role="status"
    >
      {visibleReactions.map((reaction) => (
        <ReactionBubble key={reaction.id} reaction={reaction} />
      ))}
    </div>
  );
}

export { ReactionBubble, ReactionBubbleContainer };
export type { ReactionBubbleData, ReactionBubbleProps };
