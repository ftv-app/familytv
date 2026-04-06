"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TagChip } from "@/components/tag-chip";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  postId: string;
  familyId: string;
  /** Tags already applied to this post */
  tags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  className?: string;
}

const TAG_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
  "#ef4444", // red
];

function randomTagColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function TagInput({ postId, familyId, tags, onTagsChange, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tags/autocomplete?familyId=${encodeURIComponent(familyId)}&q=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error("autocomplete failed");
        const data = await res.json();
        // Filter out tags already applied
        const appliedIds = new Set(tags.map((t) => t.id));
        setSuggestions((data.tags || []).filter((t: Tag) => !appliedIds.has(t.id)));
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [familyId, tags]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  }

  async function applyTag(tagToApply: Tag) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${postId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [{ id: tagToApply.id, name: tagToApply.name, color: tagToApply.color }] }),
      });
      if (!res.ok) throw new Error("apply tag failed");
      const data = await res.json();
      const newTags: Tag[] = data.tags || [];
      onTagsChange?.(newTags);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("[TagInput] applyTag error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function removeTag(tagId: string) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${postId}/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("remove tag failed");
      onTagsChange?.(tags.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error("[TagInput] removeTag error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function createAndApplyTag() {
    const name = inputValue.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${postId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: [{ name, color: randomTagColor() }],
        }),
      });
      if (!res.ok) throw new Error("create tag failed");
      const data = await res.json();
      const newTags: Tag[] = data.tags || [];
      onTagsChange?.(newTags);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("[TagInput] createAndApplyTag error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        createAndApplyTag();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          applyTag(suggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          createAndApplyTag();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          e.preventDefault();
          applyTag(suggestions[highlightedIndex]);
        }
        break;
    }
  }

  const canCreate =
    inputValue.trim().length > 0 &&
    !suggestions.some((s) => s.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className={className} data-testid="tag-input-container">
      {/* Applied tags */}
      {tags.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 py-2"
          data-testid="tag-input-applied-tags"
        >
          {tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={() => removeTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1" ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && fetchSuggestions(inputValue)}
            placeholder="Add a tag…"
            disabled={saving}
            className="w-full h-9 px-3 pr-8 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: "rgba(196, 120, 90, 0.08)",
              border: "1px solid rgba(196, 120, 90, 0.2)",
              color: "#2D2D2D",
              outline: "none",
            }}
            data-testid="tag-input-field"
            aria-label="Add a tag"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
          />
          {/* Loading spinner */}
          {loading && (
            <div
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full animate-spin"
              style={{
                border: "1.5px solid rgba(168,168,176,0.3)",
                borderTopColor: "#A8A8B0",
              }}
              data-testid="tag-input-loading"
              aria-label="Loading suggestions"
            />
          )}

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <ul
              className="absolute z-50 w-full mt-1 py-1 rounded-lg shadow-lg overflow-auto"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(196, 120, 90, 0.15)",
                boxShadow: "0 4px 16px rgba(196,120,90,0.12)",
                maxHeight: "240px",
              }}
              role="listbox"
              data-testid="tag-input-suggestions"
            >
              {suggestions.map((tag, i) => (
                <li
                  key={tag.id}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: i === highlightedIndex ? "rgba(196, 120, 90, 0.08)" : "transparent",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur
                    applyTag(tag);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  data-testid={`tag-input-suggestion-${i}`}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
                    {tag.name}
                  </span>
                </li>
              ))}

              {/* Create new option */}
              {canCreate && (
                <li
                  role="option"
                  aria-selected={highlightedIndex === suggestions.length}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  style={{
                    backgroundColor:
                      highlightedIndex === suggestions.length
                        ? "rgba(196, 120, 90, 0.08)"
                        : "transparent",
                    borderTop: "1px solid rgba(196,120,90,0.1)",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    createAndApplyTag();
                  }}
                  data-testid="tag-input-create-option"
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    style={{ color: "#c4785a" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm" style={{ color: "#c4785a" }}>
                    Create &ldquo;{inputValue.trim()}&rdquo;
                  </span>
                </li>
              )}

              {!canCreate && inputValue.trim() && suggestions.length === 0 && (
                <li
                  className="px-3 py-2 text-sm"
                  style={{ color: "#A8A8B0" }}
                  data-testid="tag-input-no-match"
                >
                  No matching tags
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Submit button */}
        {inputValue.trim() && (
          <button
            type="button"
            onClick={createAndApplyTag}
            disabled={saving}
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#c4785a", color: "#ffffff" }}
            aria-label="Add tag"
            data-testid="tag-input-submit"
          >
            {saving ? (
              <div
                className="w-3.5 h-3.5 rounded-full animate-spin"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#ffffff",
                }}
              />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
