"use client";

import { useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Types
   ============================================================ */

type ExtendedEmoji = string;

interface EmojiPickerProps {
  /** Whether the picker is open */
  isOpen: boolean;
  /** Called when picker closes */
  onClose: () => void;
  /** Called when an emoji is selected */
  onSelect: (emoji: ExtendedEmoji) => void;
  /** Custom className for the panel */
  className?: string;
}

/* ============================================================
   Extended Emoji Grid
   ============================================================ */

const EXTENDED_EMOJIS: ExtendedEmoji[] = [
  "😂", "❤️", "😮", "👏", "😢", "🔥",
  "🎉", "👍", "😊", "😍", "🥰", "🤔",
  "😅", "🤣", "😇", "🥳", "😎",
  "🤩", "😋", "🤗", "🤭", "😬", "🙄",
  "😤", "😠", "😈", "👻", "👀", "🎈",
  "✨", "🌟", "💫", "🎵", "🎬", "📺",
];

/* ============================================================
   Emoji Label Helper
   ============================================================ */

const EMOJI_LABELS: Record<string, string> = {
  "😂": "crying with laughter",
  "❤️": "red heart",
  "😮": "astonished",
  "👏": "clapping",
  "😢": "crying",
  "🔥": "fire",
  "🎉": "party",
  "👍": "thumbs up",
  "😊": "smiling",
  "😍": "heart eyes",
  "🥰": "smiling with hearts",
  "🤔": "thinking",
  "😅": "sweat smile",
  "🤣": "rolling on the floor laughing",
  "😇": "smiling angel",
  "🥳": "partying",
  "😎": "cool",
  "🤩": "star-struck",
  "😋": "yum",
  "🤗": "hugging",
  "🤭": "hand over mouth",
  "😬": "grimacing",
  "🙄": "eye roll",
  "😤": "steam from nose",
  "😠": "angry",
  "😈": "devil",
  "👻": "ghost",
  "👀": "eyes",
  "🎈": "balloon",
  "✨": "sparkles",
  "🌟": "star",
  "💫": "dizzy star",
  "🎵": "musical note",
  "🎬": "clapper board",
  "📺": "television",
};

function getEmojiLabel(emoji: ExtendedEmoji): string {
  return EMOJI_LABELS[emoji] ?? emoji;
}

function getEmojiSlug(emoji: string): string {
  const slugMap: Record<string, string> = {
    "😂": "laugh",
    "❤️": "heart",
    "😮": "wow",
    "👏": "clap",
    "😢": "cry",
    "🔥": "fire",
    "🎉": "party",
    "👍": "thumbs-up",
    "😊": "smiling",
    "😍": "heart-eyes",
    "🥰": "hearts",
    "🤔": "thinking",
    "😅": "sweat",
    "🤣": "rofl",
    "😇": "angel",
    "🥳": "partying",
    "😎": "cool",
    "🤩": "star-struck",
    "😋": "yum",
    "🤗": "hugging",
    "🤭": "hand-over-mouth",
    "😬": "grimacing",
    "🙄": "eye-roll",
    "😤": "triumph",
    "😠": "angry",
    "😈": "devil",
    "👻": "ghost",
    "👀": "eyes",
    "🎈": "balloon",
    "✨": "sparkles",
    "🌟": "star",
    "💫": "dizzy",
    "🎵": "music",
    "🎬": "clapper",
    "📺": "tv",
  };
  return slugMap[emoji] ?? emoji;
}

/* ============================================================
   EmojiPicker Component
   ============================================================ */

function EmojiPicker({ isOpen, onClose, onSelect, className }: EmojiPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* ---- Focus trap and initial focus ---- */
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    // Focus trap
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" && e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        return;
      }

      if (!gridRef.current) return;

      const buttons = Array.from(
        gridRef.current.querySelectorAll<HTMLButtonElement>('[data-testid^="watch-party-emoji-picker-item-"]')
      );

      if (buttons.length === 0) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (e.key === "Tab" && e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (e.key === "Tab") {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else {
        // Arrow key navigation
        e.preventDefault();
        const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
        let nextIndex = currentIndex;

        switch (e.key) {
          case "ArrowRight":
            nextIndex = Math.min(currentIndex + 1, buttons.length - 1);
            break;
          case "ArrowLeft":
            nextIndex = Math.max(currentIndex - 1, 0);
            break;
          case "ArrowDown":
            nextIndex = Math.min(currentIndex + 6, buttons.length - 1); // 6 columns
            break;
          case "ArrowUp":
            nextIndex = Math.max(currentIndex - 6, 0);
            break;
        }

        buttons[nextIndex]?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* ---- Click outside to close ---- */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        // Overlay backdrop
        "bg-black/40 backdrop-blur-sm",
        // Animation
        "animate-sheet-enter"
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a reaction"
      data-testid="watch-party-emoji-picker"
    >
      {/* Picker Panel */}
      <div
        className={cn(
          "w-full max-w-sm mx-auto rounded-t-2xl overflow-hidden",
          "bg-[#1A1A1E] border-t border-white/06",
          // Animation
          "animate-sheet-slide-up"
        )}
        style={{
          // Safe area for mobile
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div
          className="w-8 h-1 rounded-full mx-auto mt-2 mb-1"
          style={{ backgroundColor: "#5A5A62" }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2
            className="font-heading font-semibold text-base"
            style={{
              color: "#E8E8EC",
              fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
            }}
          >
            Choose a reaction
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-full",
              "text-[#A8A8B0] hover:text-[#E8E8EC]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1E]"
            )}
            aria-label="Close emoji picker"
            data-testid="watch-party-emoji-picker-close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Emoji Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-6 gap-2 p-4"
          role="grid"
          aria-label="Reaction emojis"
        >
          {EXTENDED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-xl",
                "text-2xl leading-none",
                "bg-transparent hover:bg-white/10",
                "active:scale-95",
                "transition-all duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1A1A1E]",
                "cursor-pointer select-none"
              )}
              data-testid={`watch-party-emoji-picker-item-${getEmojiSlug(emoji)}`}
              aria-label={`React with ${getEmojiLabel(emoji)}`}
              role="gridcell"
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { EmojiPicker, EXTENDED_EMOJIS };
export type { EmojiPickerProps, ExtendedEmoji };
