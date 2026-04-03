"use client";

import { useState, useEffect, useCallback } from "react";
import { SuggestionChip, type Suggestion } from "./SuggestionChip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
  familyId: string;
  initialType?: "auto_tag" | "memory" | "more_like_this";
  referenceId?: string;
  onAccept?: (id: string, type: string) => void;
  onDismiss?: (id: string, type: string) => void;
  className?: string;
}

type SectionType = "auto_tag" | "memory" | "more_like_this";

const SECTION_CONFIG: Record<SectionType, { label: string; key: string }> = {
  auto_tag: { label: "Auto-tags", key: "auto-tags" },
  memory: { label: "Memories", key: "memories" },
  more_like_this: { label: "Similar", key: "similar" },
};

interface SuggestionsResponse {
  familyId: string;
  type: string;
  count: number;
  suggestions: Suggestion[];
}

async function fetchSuggestions(
  familyId: string,
  type: SectionType,
  referenceId?: string
): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    familyId,
    type,
  });
  if (referenceId) {
    params.set("referenceId", referenceId);
  }

  const res = await fetch(`/api/suggestions?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch suggestions");
  }

  const data: SuggestionsResponse = await res.json();
  return data.suggestions;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ type }: { type: SectionType }) {
  const config = SECTION_CONFIG[type];
  return (
    <div className="text-center py-6">
      <p className="text-sm text-muted-foreground">
        No {config.label.toLowerCase()} suggestions right now
      </p>
    </div>
  );
}

interface SectionProps {
  type: SectionType;
  familyId: string;
  referenceId?: string;
  onAccept?: (id: string, type: string) => void;
  onDismiss?: (id: string, type: string) => void;
}

function SuggestionsSection({
  type,
  familyId,
  referenceId,
  onAccept,
  onDismiss,
}: SectionProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSuggestions(familyId, type, referenceId);
      setSuggestions(data);
    } catch {
      setError("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [familyId, type, referenceId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleAccept(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    onAccept?.(id, type);
  }

  function handleDismiss(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    onDismiss?.(id, type);
  }

  const config = SECTION_CONFIG[type];
  const variant = type === "auto_tag" ? "auto_tag" : type === "memory" ? "memory" : "similar";

  return (
    <div data-testid={`suggestions-section-${config.key}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        {config.label}
      </h3>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="text-center py-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <EmptyState type={type} />
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <SuggestionChip
              key={suggestion.id}
              id={suggestion.id}
              label={suggestion.label}
              description={suggestion.description}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              variant={variant}
              mediaUrl={suggestion.media_url}
              year={suggestion.year}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SuggestionsPanel({
  familyId,
  initialType = "auto_tag",
  referenceId,
  onAccept,
  onDismiss,
  className,
}: SuggestionsPanelProps) {
  const [visible, setVisible] = useState(false);

  // Sections to display based on available suggestion types
  const sections: SectionType[] = ["auto_tag", "memory", "more_like_this"];

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="suggestions-panel"
      className={cn(
        "rounded-xl border bg-card p-4 space-y-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Suggestions
        </h2>
        <button
          onClick={() => setVisible(false)}
          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Close suggestions"
        >
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((type) => (
          <SuggestionsSection
            key={type}
            type={type}
            familyId={familyId}
            referenceId={referenceId}
            onAccept={onAccept}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}

// Inline export of showSuggestions helper for use in upload modal
export function useSuggestions() {
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  return { visible, show, hide };
}
