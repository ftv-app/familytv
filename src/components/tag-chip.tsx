"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Determines whether text should be light or dark based on background color.
 * Uses the relative luminance formula from WCAG.
 */
function getContrastColor(hexColor: string): "#ffffff" | "#1a1a1a" {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Linearize RGB values
  const linearR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const linearG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const linearB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  const luminance = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;

  return luminance > 0.179 ? "#1a1a1a" : "#ffffff";
}

export function TagChip({ tag, onRemove, onClick, className }: TagChipProps) {
  const textColor = useMemo(() => getContrastColor(tag.color), [tag.color]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium transition-opacity",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{ backgroundColor: tag.color }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <span
        className="truncate max-w-[120px]"
        style={{ color: textColor }}
        data-testid="tag-chip-name"
      >
        {tag.name}
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:opacity-70 focus:outline-none focus-visible:ring-1"
          style={{ color: textColor }}
          aria-label={`Remove tag ${tag.name}`}
          data-testid="tag-chip-remove"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 2l6 6M8 2l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}
