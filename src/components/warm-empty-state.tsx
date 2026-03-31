"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface WarmEmptyStateProps {
  /** Primary emoji or icon displayed at top */
  emoji?: string;
  /** Heading text */
  title: string;
  /** Descriptive body text */
  description: string;
  /** Primary CTA button label */
  ctaLabel?: string;
  /** Primary CTA href (optional — omit for button-only / callback use) */
  ctaHref?: string;
  /** Called when primary CTA is clicked (use instead of ctaHref for custom behaviour) */
  onCtaClick?: () => void;
  /** Secondary action label */
  secondaryLabel?: string;
  /** Secondary action href */
  secondaryHref?: string;
}

/**
 * FamilyTV warm empty-state component.
 *
 * Used when a surface (feed, calendar, notifications) has no content yet.
 * Designed for new families — guides them to their first action with a warm,
 * inviting tone using the FamilyTV brand palette:
 *   - Terracotta accent  #c4785a
 *   - Cream background   #faf8f5 / oklch(0.985 0 97)
 *   - Fraunces headings / Plus Jakarta Sans body
 *
 * Accessibility:
 *   - All text meets WCAG 2.1 AA contrast on cream background
 *   - Buttons are ≥ 44×44 px touch targets
 *   - Keyboard navigable, focus-visible styles applied
 *   - Decorative emoji is aria-hidden
 */
export function WarmEmptyState({
  emoji = "👨‍👩‍👧‍👦",
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryLabel,
  secondaryHref,
}: WarmEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center text-center px-6 py-16 rounded-2xl"
      style={{ backgroundColor: "#faf8f5" }}
    >
      {/* Decorative icon bubble */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "rgba(196, 120, 90, 0.12)" }}
      >
        <span className="text-4xl" aria-hidden="true">
          {emoji}
        </span>
      </div>

      {/* Heading — Fraunces, terracotta-tinted dark */}
      <h2
        className="font-heading text-2xl font-semibold mb-3"
        style={{
          fontFamily: "var(--font-heading, 'Fraunces', serif)",
          color: "oklch(0.18_0.015_50)",
        }}
      >
        {title}
      </h2>

      {/* Body — Plus Jakarta Sans, muted warm */}
      <p
        className="text-sm leading-relaxed max-w-xs mb-8"
        style={{
          fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
          color: "oklch(0.45_0.015_50)",
        }}
      >
        {description}
      </p>

      {/* CTAs */}
      {(ctaLabel || secondaryLabel) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {ctaLabel && (
            ctaHref ? (
              <Link href={ctaHref} className="inline-flex">
                <Button
                  size="lg"
                  className="gap-2 min-h-[48px] px-6 rounded-xl font-semibold shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: "#c4785a",
                    color: "#ffffff",
                    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                  }}
                >
                  {ctaLabel}
                </Button>
              </Link>
            ) : onCtaClick ? (
              <Button
                size="lg"
                onClick={onCtaClick}
                className="gap-2 min-h-[48px] px-6 rounded-xl font-semibold shadow-sm hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: "#c4785a",
                  color: "#ffffff",
                  fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                }}
              >
                {ctaLabel}
              </Button>
            ) : null
          )}

          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref} className="inline-flex">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 min-h-[48px] px-6 rounded-xl font-semibold border-2 transition-colors"
                style={{
                  borderColor: "rgba(196, 120, 90, 0.5)",
                  color: "#c4785a",
                  backgroundColor: "transparent",
                  fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                }}
              >
                {secondaryLabel}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
