"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MergedPresenceUser } from "@/lib/watch-party/presence";

/* ============================================================
   Types
   ============================================================ */

interface PresenceStripProps {
  /** List of presence users */
  users: MergedPresenceUser[];
  /** Current user's ID */
  currentUserId?: string;
  /** Custom className */
  className?: string;
}

/* ============================================================
   Helpers
   ============================================================ */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getNameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ============================================================
   PresenceStrip (Desktop)
   ============================================================ */

function PresenceStrip({ users, currentUserId, className }: PresenceStripProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-[#1A1A1E]/80 backdrop-blur-sm",
        "border border-white/06",
        "overflow-x-auto",
        className
      )}
      role="region"
      aria-label="Family members currently watching"
      data-testid="watch-party-presence-strip"
    >
      {/* Header label */}
      <span
        className="text-sm font-medium shrink-0"
        style={{ color: "#A8A8B0" }}
        aria-hidden="true"
      >
        👀 Also watching:
      </span>

      {/* User list */}
      <div className="flex items-center gap-3" role="list">
        {users.length === 0 ? (
          <span
            className="text-sm"
            style={{ color: "#5A5A62" }}
            data-testid="watch-party-presence-only-you"
          >
            Just you
          </span>
        ) : (
          users.map((user) => (
            <PresenceUserItem
              key={user.oderId}
              user={user}
              isCurrentUser={user.userId === currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Presence User Item
   ============================================================ */

interface PresenceUserItemProps {
  user: MergedPresenceUser;
  isCurrentUser?: boolean;
}

function PresenceUserItem({ user, isCurrentUser }: PresenceUserItemProps) {
  const statusLabel = user.status === "active" ? "actively watching" : "idle";
  const ariaLabel = `${user.name}, ${isCurrentUser ? "you are" : ""} ${statusLabel}`;

  return (
    <div
      className="flex items-center gap-2 shrink-0"
      role="listitem"
      aria-label={ariaLabel}
      data-testid={`watch-party-presence-member-${getNameSlug(user.name)}`}
    >
      {/* Avatar */}
      <div
        className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          backgroundColor: "#252529",
          border: "2px solid rgba(212, 175, 55, 0.4)",
        }}
        data-testid="watch-party-watcher-avatar"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-heading font-semibold text-xs"
            style={{ color: "#D4AF37" }}
          >
            {getInitials(user.name)}
          </span>
        )}

        {/* Status dot */}
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: 10,
            height: 10,
            backgroundColor: user.status === "active" ? "#2ECC71" : "#A8A8B0",
            border: "1.5px solid #0D0D0F",
          }}
          aria-hidden="true"
          data-testid={
            user.status === "active"
              ? "watch-party-presence-dot-active"
              : "watch-party-presence-dot-idle"
          }
        />
      </div>

      {/* Name */}
      <span
        className="text-sm font-medium hidden lg:block"
        style={{ color: "#E8E8EC" }}
      >
        {isCurrentUser ? "You" : user.name}
      </span>
    </div>
  );
}

/* ============================================================
   PresenceCollapsed (Mobile)
   ============================================================ */

interface PresenceCollapsedProps {
  users: MergedPresenceUser[];
  /** Called when the presence bar is tapped (to open popover) */
  onTap?: () => void;
  /** Current user's ID */
  currentUserId?: string;
  /** Number of unread presence updates */
  unreadCount?: number;
  /** Custom className */
  className?: string;
}

function PresenceCollapsed({
  users,
  onTap,
  currentUserId,
  unreadCount = 0,
  className,
}: PresenceCollapsedProps) {
  const count = users.length + (currentUserId ? 1 : 0);

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-[#1A1A1E]/80 backdrop-blur-sm",
        "border border-white/06",
        "min-h-[48px]",
        "transition-all duration-150",
        "hover:bg-[#1A1A1E]/90",
        "active:scale-98",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0F]",
        "cursor-pointer",
        className
      )}
      aria-label={`${count} family members currently watching. Tap to see who.`}
      aria-expanded={false}
      aria-haspopup="dialog"
      data-testid="watch-party-presence-collapsed"
    >
      {/* Icon */}
      <span className="text-base" aria-hidden="true">
        👀
      </span>

      {/* Stacked avatars */}
      <div className="flex items-center">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.oderId}
            className="relative"
            style={{
              marginLeft: index === 0 ? 0 : -8,
              zIndex: 3 - index,
            }}
            aria-hidden="true"
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: "#252529",
                border: "2px solid #0D0D0F",
              }}
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="font-heading font-semibold text-[10px]"
                  style={{ color: "#D4AF37" }}
                >
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            {/* Status dot */}
            <span
              className="absolute bottom-0 right-0 rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: user.status === "active" ? "#2ECC71" : "#A8A8B0",
                border: "1px solid #0D0D0F",
              }}
            />
          </div>
        ))}

        {/* Current user avatar if not in list */}
        {currentUserId && !users.some((u) => u.userId === currentUserId) && (
          <div
            className="relative"
            style={{ marginLeft: users.length > 0 ? -8 : 0 }}
            aria-hidden="true"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "#2D5A4A",
                border: "2px solid #0D0D0F",
              }}
            >
              <span
                className="font-heading font-semibold text-[10px]"
                style={{ color: "#FDF8F3" }}
              >
                You
              </span>
            </div>
            <span
              className="absolute bottom-0 right-0 rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: "#2ECC71",
                border: "1px solid #0D0D0F",
              }}
            />
          </div>
        )}
      </div>

      {/* Count */}
      <span
        className="text-sm font-medium"
        style={{ color: "#A8A8B0" }}
        aria-hidden="true"
      >
        {count} watching
      </span>

      {/* Unread badge (if any) */}
      {unreadCount > 0 && (
        <span
          className="flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-semibold px-1"
          style={{
            backgroundColor: "#2D5A4A",
            color: "#FDF8F3",
          }}
          aria-hidden="true"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

/* ============================================================
   PresencePopover (Mobile tap to expand)
   ============================================================ */

interface PresencePopoverProps {
  users: MergedPresenceUser[];
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function PresencePopover({
  users,
  currentUserId,
  isOpen,
  onClose,
  className,
}: PresencePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* ---- Focus trap ---- */
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = popoverRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  // Generate timestamp using useMemo - must be called unconditionally per hooks rules
  // eslint-disable-next-line react-hooks/purity -- Client component: runs once per mount
  const currentTimestamp = useMemo(() => Date.now(), []);

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
      aria-label="Family members watching"
      data-testid="watch-party-presence-popover"
    >
      <div
        ref={popoverRef}
        className={cn(
          "w-full max-w-sm mx-auto rounded-t-2xl overflow-hidden",
          "bg-[#1A1A1E] border-t border-white/06",
          "animate-sheet-slide-up"
        )}
        style={{
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
            👀 Also watching
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
            aria-label="Close presence list"
            data-testid="watch-party-presence-popover-close"
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

        {/* User list */}
        <div className="px-4 pb-4 space-y-3" role="list" aria-label="Family members">
          {users.length === 0 && !currentUserId ? (
            <p className="text-center py-4" style={{ color: "#5A5A62" }}>
              Just you watching
            </p>
          ) : (
            <>
              {/* Current user first */}
              {currentUserId && (
                <PresencePopoverUser
                  user={{
                    oderId: "current-user",
                    userId: currentUserId,
                    name: "You",
                    avatar: null,
                    status: "active",
                    isMultiDevice: false,
                    deviceCount: 1,
                    lastSeen: currentTimestamp,
                    currentView: null,
                  }}
                  isCurrentUser
                />
              )}

              {/* Other users */}
              {users
                .filter((u) => u.userId !== currentUserId)
                .map((user) => (
                  <PresencePopoverUser key={user.oderId} user={user} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Presence Popover User Item
   ============================================================ */

interface PresencePopoverUserProps {
  user: MergedPresenceUser & { name: string; avatar: string | null };
  isCurrentUser?: boolean;
}

function PresencePopoverUser({ user, isCurrentUser }: PresencePopoverUserProps) {
  const statusLabel = user.status === "active" ? "actively watching" : "idle";

  return (
    <div
      className="flex items-center gap-3"
      role="listitem"
      aria-label={`${user.name}, ${statusLabel}`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
        style={{
          backgroundColor: "#252529",
          border: "2px solid rgba(212, 175, 55, 0.4)",
        }}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-heading font-semibold text-sm"
            style={{ color: "#D4AF37" }}
          >
            {getInitials(user.name)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "#E8E8EC" }}>
          {isCurrentUser ? "You" : user.name}
        </p>
        <p className="text-xs" style={{ color: "#A8A8B0" }}>
          {statusLabel}
        </p>
      </div>

      {/* Status dot */}
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{
          backgroundColor: user.status === "active" ? "#2ECC71" : "#A8A8B0",
        }}
        aria-hidden="true"
        data-testid={
          user.status === "active"
            ? "watch-party-presence-dot-active"
            : "watch-party-presence-dot-idle"
        }
      />
    </div>
  );
}

export { PresenceStrip, PresenceCollapsed, PresencePopover };
export type { PresenceStripProps, PresenceCollapsedProps, PresencePopoverProps };
