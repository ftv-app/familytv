"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useWatchPartySocket";

/* ============================================================
   Types
   ============================================================ */

interface ChatBottomSheetProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  /** Number of new messages when scrolled up */
  newMessagesCount?: number;
  onNewMessagesClick?: () => void;
  className?: string;
}

/* ============================================================
   Helpers
   ============================================================ */

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ============================================================
   ChatBottomSheet (Mobile)
   ============================================================ */

function ChatBottomSheet({
  messages,
  currentUserId,
  onSendMessage,
  isOpen,
  onClose,
  isLoading,
  newMessagesCount = 0,
  onNewMessagesClick,
  className,
}: ChatBottomSheetProps) {
  const [inputValue, setInputValue] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* ---- Focus management ---- */
  useEffect(() => {
    if (isOpen) {
      // Focus input when sheet opens
      setTimeout(() => inputRef.current?.focus(), 350); // After animation
      // Focus close button for focus trap
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  /* ---- Focus trap ---- */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = messagesRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown as unknown as EventListener);
    return () => document.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
  }, [isOpen, onClose]);

  /* ---- Auto-scroll to bottom on new messages (when not scrolled up) ---- */
  useEffect(() => {
    if (isScrolledUp) return;
    if (messagesRef.current) {
      // Use scrollTop for compatibility with jsdom (no scrollTo in jsdom)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isScrolledUp]);

  /* ---- Detect scroll position ---- */
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsScrolledUp(!isAtBottom);
  }, []);

  /* ---- Handle send ---- */
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed || isLoading) return;

      onSendMessage(trimmed);
      setInputValue("");
      setIsScrolledUp(false);
      inputRef.current?.focus();
    },
    [inputValue, isLoading, onSendMessage]
  );

  /* ---- Keyboard: Enter to send ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading) return;
        onSendMessage(trimmed);
        setInputValue("");
        setIsScrolledUp(false);
        inputRef.current?.focus();
      }
    },
    [inputValue, isLoading, onSendMessage]
  );

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
        "bg-black/40 backdrop-blur-sm",
        "animate-sheet-enter"
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Live chat"
      data-testid="watch-party-chat-bottom-sheet"
    >
      <div
        className={cn(
          "w-full max-h-[70vh] rounded-t-2xl overflow-hidden flex flex-col",
          "bg-[#1A1A1E]",
          "border-t border-white/06",
          "animate-sheet-slide-up"
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div
          className="w-8 h-1 rounded-full mx-auto mt-2 mb-1 shrink-0"
          style={{ backgroundColor: "#5A5A62" }}
          aria-hidden="true"
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/06 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2
            className="font-heading font-semibold text-base"
            style={{
              color: "#E8E8EC",
              fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
            }}
          >
            💬 Live Chat
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
            aria-label="Close chat"
            data-testid="watch-party-chat-close"
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

        {/* Messages */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          onScroll={handleScroll}
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          data-testid="watch-party-chat-messages"
        >
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full text-center py-8"
              data-testid="watch-party-chat-empty"
            >
              <span className="text-3xl mb-2">👋</span>
              <p className="text-sm" style={{ color: "#A8A8B0" }}>
                No messages yet.
              </p>
              <p className="text-sm" style={{ color: "#A8A8B0" }}>
                Say something!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MobileChatMessageItem
                key={message.id}
                message={message}
                isOwn={message.userId === currentUserId}
              />
            ))
          )}
        </div>

        {/* New messages pill */}
        {isScrolledUp && newMessagesCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsScrolledUp(false);
              if (messagesRef.current) {
                // Use scrollTop for compatibility with jsdom
                messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
              }
              onNewMessagesClick?.();
            }}
            className={cn(
              "flex items-center justify-center gap-2 mx-auto mb-2 px-4 py-2 rounded-full",
              "text-sm font-medium",
              "bg-[#2D5A4A] text-[#FDF8F3]",
              "animate-bounce-in",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1E]",
              "cursor-pointer"
            )}
            aria-live="polite"
            data-testid="watch-party-chat-new-messages-pill"
          >
            💬 {newMessagesCount} new message{newMessagesCount !== 1 ? "s" : ""} ↓
          </button>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-white/06 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm",
                "bg-[#0D0D0F]",
                "text-[#E8E8EC] placeholder:text-[#5A5A62]",
                "border border-transparent",
                "focus:outline-none focus:border-[#2D5A4A]",
                "transition-colors duration-150"
              )}
              style={{
                fontFamily: "var(--font-sans, 'Source Sans 3', sans-serif)",
              }}
              aria-label="Type a message"
              data-testid="watch-party-chat-input"
              disabled={isLoading}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]"
              )}
              style={{
                backgroundColor: "#2D5A4A",
                color: "#FDF8F3",
              }}
              aria-label="Send message"
              data-testid="watch-party-chat-send"
            >
              Send
            </button>
          </div>

          {/* Character count */}
          {inputValue.length > 400 && (
            <p
              className="text-xs mt-1 text-right"
              style={{
                color: inputValue.length >= 500 ? "#E74C3C" : "#A8A8B0",
              }}
              data-testid="watch-party-chat-rate-limit"
            >
              {inputValue.length}/500
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   Mobile Chat Message Item
   ============================================================ */

interface MobileChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MobileChatMessageItem({ message, isOwn }: MobileChatMessageItemProps) {
  return (
    <div
      className={cn("flex gap-2", isOwn && "flex-row-reverse")}
      data-testid="watch-party-chat-message"
      data-message-id={message.id}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isOwn ? "#2D5A4A" : "#252529",
          border: isOwn ? "none" : "1px solid rgba(212, 175, 55, 0.3)",
        }}
        aria-hidden="true"
      >
        {message.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-heading font-semibold text-[10px]"
            style={{ color: isOwn ? "#FDF8F3" : "#D4AF37" }}
          >
            {getInitials(message.userName)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isOwn && "text-right")}>
        {/* Sender + timestamp */}
        <div
          className={cn("flex items-center gap-2 mb-0.5", isOwn && "flex-row-reverse")}
        >
          <span
            className="text-xs font-medium"
            style={{ color: "#D4AF37" }}
            data-testid="watch-party-chat-sender"
          >
            {isOwn ? "You" : message.userName}
          </span>
          <span
            className="text-xs"
            style={{ color: "#5A5A62" }}
            data-testid="watch-party-chat-timestamp"
          >
            {formatTimestamp(message.createdAt)}
          </span>
        </div>

        {/* Message text */}
        <p
          className={cn(
            "text-sm break-words",
            isOwn ? "text-[#E8E8EC] text-right" : "text-[#E8E8EC]"
          )}
          style={{
            fontFamily: "var(--font-sans, 'Source Sans 3', sans-serif)",
          }}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}

export { ChatBottomSheet };
export type { ChatBottomSheetProps };
