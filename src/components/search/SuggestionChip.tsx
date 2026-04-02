"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Suggestion {
  id: string;
  type: "auto_tag" | "memory" | "more_like_this" | "similar_people" | "smart_album";
  label: string;
  description?: string;
  media_url?: string;
  year?: number;
}

interface SuggestionChipProps {
  id: string;
  label: string;
  description?: string;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  variant?: "auto_tag" | "memory" | "similar";
  mediaUrl?: string;
  year?: number;
}

const variantStyles = {
  auto_tag: "bg-primary/10 text-primary border-primary/20",
  memory: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  similar: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

export function SuggestionChip({
  id,
  label,
  description,
  onAccept,
  onDismiss,
  variant = "auto_tag",
  mediaUrl,
  year,
}: SuggestionChipProps) {
  const [visible, setVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  function handleDismiss() {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss(id);
    }, 200);
  }

  function handleAccept() {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      onAccept(id);
    }, 200);
  }

  if (!visible) return null;

  return (
    <div
      data-testid={`suggestion-chip-${id}`}
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border p-3 transition-all duration-200",
        variantStyles[variant],
        isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
    >
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt=""
          className="h-12 w-12 rounded-md object-cover shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {year && (
            <span className="text-xs font-medium opacity-70">{year}</span>
          )}
          <p className="text-sm font-medium truncate">{label}</p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            data-testid={`suggestion-accept-${id}`}
            onClick={handleAccept}
            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs font-medium bg-[#C41E3A] text-white hover:bg-[#a31830] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]/50"
          >
            Accept
          </button>
          <button
            type="button"
            data-testid={`suggestion-dismiss-${id}`}
            onClick={handleDismiss}
            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-muted-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
