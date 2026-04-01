"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useWatchPartySocket";

/* ============================================================
   Types
   ============================================================ */

interface ChatSidebarProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
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

  // Same day, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Different day
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
   ChatSidebar (Desktop)
   ============================================================ */

function ChatSidebar({
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
  className,
}: ChatSidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- Auto-scroll to bottom on new messages ---- */
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use try/catch for jsdom compatibility
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch {
        // Fallback: no-op in jsdom
      }
    }
  }, [messages]);

  /* ---- Focus input on mount ---- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ---- Handle send ---- */
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed || isLoading) return;

      onSendMessage(trimmed);
      setInputValue("");
      // Keep focus in input for rapid follow-up messages
      inputRef.current?.focus();
    },
    [inputValue, isLoading, onSendMessage]
  );

  /* ---- Keyboard shortcut: Enter to send ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed || isLoading) return;
        onSendMessage(trimmed);
        setInputValue("");
        inputRef.current?.focus();
      }

      // Escape to clear
      if (e.key === "Escape") {
        setInputValue("");
        inputRef.current?.blur();
      }
    },
    [inputValue, isLoading, onSendMessage]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-[#1A1A1E]",
        "border-l border-white/06",
        className
      )}
      data-testid="watch-party-chat-sidebar"
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/06"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2
          className="font-heading font-medium text-xs uppercase tracking-wider"
          style={{
            color: "#A8A8B0",
            fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
            letterSpacing: "0.08em",
          }}
        >
          Live Chat
        </h2>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
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
            <span className="text-3xl mb-2 animate-wave">👋</span>
            <p
              className="text-sm"
              style={{ color: "#A8A8B0" }}
            >
              No messages yet.
            </p>
            <p
              className="text-sm"
              style={{ color: "#A8A8B0" }}
            >
              Say something!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwn={message.userId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/06"
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
            style={{ color: inputValue.length >= 500 ? "#E74C3C" : "#A8A8B0" }}
          >
            {inputValue.length}/500
          </p>
        )}
      </form>
    </div>
  );
}

/* ============================================================
   Chat Message Item
   ============================================================ */

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn && "flex-row-reverse"
      )}
      data-testid="watch-party-chat-message"
      data-message-id={message.id}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
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
      <div
        className={cn(
          "flex-1 min-w-0",
          isOwn && "text-right"
        )}
      >
        {/* Sender name + timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 mb-0.5",
            isOwn && "flex-row-reverse"
          )}
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
            isOwn
              ? "text-[#E8E8EC] text-right"
              : "text-[#E8E8EC]"
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

export { ChatSidebar };
export type { ChatSidebarProps };
