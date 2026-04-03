"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
   Drift generator (outside component to avoid impure calls in render)
   ============================================================ */

/**
 * Generate a random drift value for reaction bubble animation.
 * Called once per component mount, not during render.
 */
function generateDrift(): number {
  // Use crypto.getRandomValues for better randomness if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return ((arr[0] / 0xffffffff) - 0.5) * 60; // ±30px
  }
  // Fallback to Math.random (still runs outside render, so it's OK)
  return (Math.random() - 0.5) * 60;
}

/* ============================================================
   Component
   ============================================================ */

function ReactionBubble({ reaction, duration = 2800, className }: ReactionBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  // Initialize drift with useMemo to avoid impure call during render
  // useMemo with empty deps only runs once, similar to useRef lazy init
  const drift = useMemo(() => generateDrift(), []);
  // Lazy init for prefersReducedMotion to avoid impure call during render
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Listen for changes to prefers-reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-hide bubble based on prefersReducedMotion and duration
  useEffect(() => {
    // Fade in place if reduced motion is preferred
    if (prefersReducedMotion) {
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
          transform: `translateX(calc(-50% + ${drift}px))`,
          "--drift": `${drift}px`,
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
