"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  familyId: string;
  onSearch: (query: string, familyId: string) => Promise<void>;
  loading?: boolean;
  onClear?: () => void;
  className?: string;
}

export function SearchBar({
  familyId,
  onSearch,
  loading = false,
  onClear,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      await onSearch(searchQuery, familyId);
    },
    [onSearch, familyId]
  );

  // Debounce search on query change
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, handleSearch]);

  const handleClear = () => {
    setQuery("");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onClear?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div
      className={cn(
        "relative flex items-center w-full",
        className
      )}
      style={{ backgroundColor: "#1A1A1E", borderRadius: "8px" }}
    >
      {/* Search icon */}
      <div className="absolute left-3 flex items-center justify-center pointer-events-none">
        <svg
          className="w-4 h-4"
          style={{ color: "#A8A8B0" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <Input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search your family memories..."
        data-testid="search-input"
        className="pl-10 pr-10 border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none"
        style={{
          backgroundColor: "transparent",
          color: "#FDF8F3",
          height: "44px",
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <div
          className="absolute right-10 flex items-center justify-center"
          data-testid="search-loading"
        >
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: "rgba(142, 142, 150, 0.3)",
              borderTopColor: "#C41E3A",
            }}
          />
        </div>
      )}

      {/* Clear button */}
      {query && !loading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 flex items-center justify-center w-6 h-6 rounded-full hover:opacity-70 transition-opacity cursor-pointer"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          data-testid="search-clear"
          aria-label="Clear search"
        >
          <svg
            className="w-3 h-3"
            style={{ color: "#A8A8B0" }}
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
      )}

      {/* Non-search state: show search icon on right when empty */}
      {!query && !loading && (
        <div className="absolute right-3 flex items-center justify-center pointer-events-none">
          <svg
            className="w-4 h-4"
            style={{ color: "#5A5A62" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
