"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumForm } from "@/components/album-form";
import { toast } from "sonner";

interface Family {
  id: string;
  name: string;
}

export default function NewAlbumPage() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family");
      const data = await res.json();
      const familyList: Family[] = data.families || [];
      setFamilies(familyList);
      if (familyList.length === 1) {
        setSelectedFamilyId(familyList[0].id);
      } else if (familyList.length > 1) {
        // Default to first family — user can change via selector
        setSelectedFamilyId(familyList[0].id);
      } else {
        toast.error("You need to be part of a family to create an album");
      }
    } catch {
      toast.error("Failed to load families");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoaded && userId) {
      fetchFamilies();
    }
  }, [authLoaded, userId, fetchFamilies]);

  if (!authLoaded || (authLoaded && !userId)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground" data-testid="albums-new-auth-prompt">
          Please sign in to create an album.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6" data-testid="albums-new-loading">
        <Skeleton className="h-8 w-1/3 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
        <Skeleton className="h-64 w-full bg-[#e8e4de] dark:bg-[#2a2a2a] rounded-lg" />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center" data-testid="albums-new-no-family">
        <h1
          className="font-heading text-2xl font-bold text-[#1e1a17] dark:text-[#faf8f5] mb-4"
          data-testid="albums-new-no-family-title"
        >
          No Family Found
        </h1>
        <p
          className="text-muted-foreground mb-6"
          data-testid="albums-new-no-family-description"
        >
          You need to be part of a family to create albums.
        </p>
        <Link href="/albums" data-testid="albums-new-no-family-back-link">
          <Button
            variant="outline"
            className="border-[#d8d3cc] text-[#1e1a17] hover:bg-[#f0ede8] dark:border-[#444] dark:text-[#faf8f5] dark:hover:bg-[#2a2a2a]"
            data-testid="albums-new-no-family-back-button"
          >
            Back to Albums
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8" data-testid="albums-new-page">
      {/* Back Link */}
      <Link
        href="/albums"
        className="inline-flex items-center text-sm text-[#7c2d2d] hover:underline mb-6 dark:text-[#a84a4a]"
        data-testid="albums-new-back-link"
      >
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Albums
      </Link>

      {/* Page Title */}
      <div className="mb-6" data-testid="albums-new-header">
        <h1
          className="font-heading text-3xl font-bold text-[#1e1a17] dark:text-[#faf8f5]"
          data-testid="albums-new-title"
        >
          Create New Album
        </h1>
      </div>

      {/* Family Selector */}
      {families.length > 1 && (
        <div className="mb-6" data-testid="albums-new-family-selector">
          <label
            htmlFor="album-family-select"
            className="block text-sm font-medium text-[#1e1a17] dark:text-[#faf8f5] mb-2"
            data-testid="albums-new-family-label"
          >
            Family <span className="text-destructive">*</span>
          </label>
          <select
            id="album-family-select"
            value={selectedFamilyId ?? ""}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            className="w-full border border-[#d8d3cc] dark:border-[#444] rounded-md px-3 py-2 text-sm bg-background text-[#1e1a17] dark:text-[#faf8f5] dark:bg-[#1a1a1a]"
            data-testid="albums-new-family-select"
            required
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Single family: show name */}
      {families.length === 1 && selectedFamilyId && (
        <div className="mb-6" data-testid="albums-new-family-display">
          <span className="text-sm text-muted-foreground" data-testid="albums-new-family-name">
            Creating album for: <strong className="text-[#1e1a17] dark:text-[#faf8f5]">{families[0].name}</strong>
          </span>
        </div>
      )}

      {/* Form */}
      {selectedFamilyId && (
        <AlbumForm
          mode="create"
          familyId={selectedFamilyId}
        />
      )}
    </div>
  );
}
