"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { ReactionBubbleContainer, type ReactionBubbleData } from "./ReactionBubble";

/* ============================================================
   Constants
   ============================================================ */

export const REACTION_EMOJIS = ["😂", "❤️", "😮", "👏", "😢", "🎉"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/* ============================================================
   Emoji Labels
   ============================================================ */

const EMOJI_LABELS: Record<string, string> = {
  "😂": "crying with laughter",
  "❤️": "red heart",
  "😮": "astonished face",
  "👏": "clapping hands",
  "😢": "crying face",
  "🎉": "party popper",
};

const EMOJI_TO_SLUG: Record<string, string> = {
  "😂": "laugh",
  "❤️": "heart",
  "😮": "wow",
  "👏": "clap",
  "😢": "cry",
  "🎉": "party",
};

function getEmojiLabel(emoji: ReactionEmoji): string {
  return EMOJI_LABELS[emoji] ?? emoji;
}

function getEmojiSlug(emoji: string): string {
  return EMOJI_TO_SLUG[emoji] ?? emoji;
}

/* ============================================================
   Types
   ============================================================ */

interface ReactionBarProps {
  /** Current video playback timestamp */
  videoTimestamp?: number;
  /** Whether reactions are enabled (default: true) */
  enabled?: boolean;
  /** Callback when a reaction is sent */
  onReaction?: (emoji: string) => void;
  /** External reactions (from socket) to display */
  externalReactions?: ReactionBubbleData[];
  /** Custom className */
  className?: string;
}

/* ============================================================
   ReactionBar Component
   ============================================================ */

function ReactionBar({
  videoTimestamp = 0,
  enabled = true,
  onReaction,
  externalReactions = [],
  className,
}: ReactionBarProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [recentReactions, setRecentReactions] = useState<ReactionBubbleData[]>([]);
  const reactionCounterRef = useRef(0);

  /* ---- Handle reaction button click ---- */
  const handleReaction = useCallback(
    (emoji: ReactionEmoji | string) => {
      if (!enabled) return;

      const reaction: ReactionBubbleData = {
        id: `reaction-${Date.now()}-${reactionCounterRef.current++}`,
        emoji,
        userName: "You",
        isOwn: true,
        videoTimestamp,
      };

      setRecentReactions((prev) => [...prev.slice(-14), reaction]);
      onReaction?.(emoji);

      // Haptic feedback if available
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [enabled, videoTimestamp, onReaction]
  );

  /* ---- Handle emoji picker selection ---- */
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      handleReaction(emoji as ReactionEmoji);
    },
    [handleReaction]
  );

  /* ---- All visible reactions (own + external) ---- */
  const allReactions = [...recentReactions, ...externalReactions].slice(-15);

  return (
    <>
      {/* Floating Bubbles */}
      <ReactionBubbleContainer reactions={allReactions} maxBubbles={15} />

      {/* Reaction Bar */}
      <div
        className={cn(
          "relative w-full",
          // Mobile: fixed bottom bar
          "md:hidden",
          // Desktop: inline below video
          "hidden md:block",
          className
        )}
        role="region"
        aria-label="Watch party reactions"
        data-testid="watch-party-reaction-bar"
      >
        {/* Desktop: inline bar */}
        <div
          className={cn(
            "hidden md:flex items-center justify-center gap-2",
            "py-2 px-4 rounded-xl",
            "bg-[rgba(26,26,30,0.88)] backdrop-blur-sm",
            "border border-white/06"
          )}
          role="toolbar"
          aria-label="Quick reactions"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <ReactionButton
              key={emoji}
              emoji={emoji}
              label={getEmojiLabel(emoji)}
              onClick={() => handleReaction(emoji)}
              dataTestId={`watch-party-reaction-${getEmojiSlug(emoji)}`}
              isDesktop
            />
          ))}

          {/* Expand button */}
          <button
            type="button"
            onClick={() => setEmojiPickerOpen(true)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl",
              "text-xl leading-none",
              "bg-black/40 backdrop-blur-sm",
              "border border-white/10",
              "text-[#A8A8B0]",
              "hover:scale-105 hover:bg-black/60 hover:border-white/20",
              "active:scale-95",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]",
              "cursor-pointer select-none"
            )}
            aria-label="Open emoji picker"
            aria-expanded={emojiPickerOpen}
            aria-controls="emoji-picker-panel"
            data-testid="watch-party-emoji-picker-toggle"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>

        {/* Mobile: fixed bottom bar (44px min touch targets) */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40",
            "flex items-center justify-center gap-1",
            "px-2 pt-2 pb-2",
            // Safe area inset
            "pb-safe",
            // Background
            "bg-[#1A1A1E]/95 backdrop-blur-md",
            "border-t border-white/06"
          )}
          style={{
            height: "56px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          }}
          role="toolbar"
          aria-label="Quick reactions"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <ReactionButton
              key={emoji}
              emoji={emoji}
              label={getEmojiLabel(emoji)}
              onClick={() => handleReaction(emoji)}
              dataTestId={`watch-party-reaction-${getEmojiSlug(emoji)}`}
              isMobile
            />
          ))}

          {/* Expand button */}
          <button
            type="button"
            onClick={() => setEmojiPickerOpen(true)}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl",
              "text-xl leading-none",
              "min-w-[44px] min-h-[44px]",
              "bg-[#2D5A4A]",
              "text-white",
              "hover:scale-105",
              "active:scale-95",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1E]",
              "cursor-pointer select-none"
            )}
            aria-label="Open emoji picker"
            aria-expanded={emojiPickerOpen}
            aria-controls="emoji-picker-panel"
            data-testid="watch-party-reaction-expand"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      <div id="emoji-picker-panel">
        <EmojiPicker
          isOpen={emojiPickerOpen}
          onClose={() => setEmojiPickerOpen(false)}
          onSelect={handleEmojiSelect}
        />
      </div>
    </>
  );
}

/* ============================================================
   Reaction Button
   ============================================================ */

interface ReactionButtonProps {
  emoji: string;
  label: string;
  onClick: () => void;
  dataTestId: string;
  isDesktop?: boolean;
  isMobile?: boolean;
}

function ReactionButton({
  emoji,
  label,
  onClick,
  dataTestId,
  isDesktop,
  isMobile,
}: ReactionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-xl",
        "text-xl leading-none",
        "bg-black/40 backdrop-blur-sm",
        "border border-white/10",
        // Touch target - 44px minimum for mobile
        isMobile && "min-w-[44px] min-h-[44px] w-11 h-11",
        // Desktop size
        isDesktop && "w-10 h-10",
        // Interactions
        "hover:scale-110 hover:bg-black/60 hover:border-white/20",
        "active:scale-95 active:bg-[#2D5A4A]/40",
        "transition-all duration-150",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]",
        // Cursor
        "cursor-pointer select-none"
      )}
      aria-label={`React with ${label}`}
      aria-pressed="false"
      data-testid={dataTestId}
    >
      <span aria-hidden="true">{emoji}</span>
    </button>
  );
}

export { ReactionBar };
export type { ReactionBarProps };
