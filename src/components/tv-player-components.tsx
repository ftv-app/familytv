"use client";

import { useEffect } from "react";

/* ---- Live Badge ---- */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${className}`}
      style={{
        background: "rgba(196, 30, 58, 0.15)",
        border: "1px solid rgba(196, 30, 58, 0.3)",
        color: "#C41E3A",
      }}
    >
      <span
        className="live-dot w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "#C41E3A" }}
      />
      <span className="font-heading text-xs font-semibold uppercase tracking-wide">
        LIVE
      </span>
    </div>
  );
}

/* ---- Solo Mode Badge ---- */
export function SoloBadge({ className }: { className?: string }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${className}`}
      style={{
        background: "rgba(243, 156, 18, 0.15)",
        border: "1px solid rgba(243, 156, 18, 0.3)",
        color: "#F39C12",
      }}
    >
      SOLO
    </span>
  );
}

/* ---- Presence Avatar ---- */
export interface Watcher {
  id: string;
  name: string;
  avatarUrl: string;
  isSolo?: boolean;
}

interface PresenceAvatarsProps {
  watchers: Watcher[];
  max?: number;
  size?: "sm" | "md";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PresenceAvatars({
  watchers,
  max = 3,
  size = "sm",
}: PresenceAvatarsProps) {
  const visible = watchers.slice(0, max);
  const overflow = watchers.length - max;

  return (
    <div className="flex items-center gap-1">
      {visible.map((watcher) => (
        <div
          key={watcher.id}
          className="relative"
          title={`${watcher.name} is watching`}
        >
          {/* Avatar */}
          <div
            className="rounded-full overflow-hidden flex items-center justify-center font-heading font-semibold"
            style={{
              width: size === "sm" ? 32 : 40,
              height: size === "sm" ? 32 : 40,
              border: "2px solid rgba(212, 175, 55, 0.4)",
              backgroundColor: "#252529",
              fontSize: size === "sm" ? 11 : 13,
              color: "#D4AF37",
            }}
          >
            {watcher.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={watcher.avatarUrl}
                alt={watcher.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(watcher.name)
            )}
          </div>
          {/* Online/solo dot */}
          <span
            className="absolute bottom-0 right-0 rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: watcher.isSolo ? "#F39C12" : "#2ECC71",
              border: "1.5px solid #0D0D0F",
            }}
          />
        </div>
      ))}

      {overflow > 0 && (
        <span
          className="text-xs font-mono ml-1"
          style={{ color: "#A8A8B0" }}
        >
          +{overflow}
        </span>
      )}

      {/* Solo badge */}
      {watchers.length === 1 && watchers[0].isSolo && (
        <SoloBadge className="ml-2" />
      )}
    </div>
  );
}
