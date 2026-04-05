"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/album-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { WarmEmptyState } from "@/components/warm-empty-state";

interface Album {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  familyId: string;
}

interface Family {
  id: string;
  name: string;
}

export default function AlbumsPage() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch families for the user
  const fetchFamilies = useCallback(async () => {
    try {
      const res = await fetch("/api/family");
      const data = await res.json();
      const familyList: Family[] = data.families || [];
      setFamilies(familyList);
      if (familyList.length === 1 && !selectedFamilyId) {
        setSelectedFamilyId(familyList[0].id);
      } else if (familyList.length > 0 && !selectedFamilyId) {
        setSelectedFamilyId(familyList[0].id);
      }
    } catch {
      toast.error("Failed to load families");
    }
  }, [selectedFamilyId]);

  // Fetch albums for the selected family
  const fetchAlbums = useCallback(async () => {
    if (!selectedFamilyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/albums?familyId=${selectedFamilyId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load albums");
        setAlbums([]);
        return;
      }
      setAlbums(data.albums || []);
    } catch {
      toast.error("Failed to load albums");
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFamilyId]);

  useEffect(() => {
    if (authLoaded && userId) {
      fetchFamilies();
    }
  }, [authLoaded, userId, fetchFamilies]);

  useEffect(() => {
    if (selectedFamilyId) {
      fetchAlbums();
    }
  }, [selectedFamilyId, fetchAlbums]);

  async function handleDeleteAlbum(albumId: string) {
    setDeletingId(albumId);
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete album");
        return;
      }
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      toast.success("Album deleted successfully");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete album");
    } finally {
      setDeletingId(null);
    }
  }

  if (!authLoaded || (authLoaded && !userId)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground" data-testid="albums-auth-prompt">
          Please sign in to view your albums.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8" data-testid="albums-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8" data-testid="albums-header">
        <div>
          <h1
            className="font-heading text-3xl font-bold text-[#1e1a17] dark:text-[#faf8f5]"
            data-testid="albums-title"
          >
            Albums
          </h1>
          {selectedFamilyId && families.length > 0 && (
            <p
              className="text-sm text-muted-foreground mt-1"
              data-testid="albums-family-label"
            >
              {families.find((f) => f.id === selectedFamilyId)?.name ?? "Family"}
            </p>
          )}
        </div>
        <Link href="/albums/new" data-testid="albums-create-link">
          <Button
            className="bg-[#7c2d2d] hover:bg-[#6b2626] text-white dark:bg-[#7c2d2d] dark:hover:bg-[#6b2626]"
            data-testid="albums-create-button"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Album
          </Button>
        </Link>
      </div>

      {/* Family Selector */}
      {families.length > 1 && (
        <div className="mb-6" data-testid="albums-family-selector">
          <label
            htmlFor="family-select"
            className="text-sm font-medium text-[#1e1a17] dark:text-[#faf8f5] mr-2"
          >
            Family:
          </label>
          <select
            id="family-select"
            value={selectedFamilyId ?? ""}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            className="border border-[#d8d3cc] dark:border-[#444] rounded-md px-3 py-1.5 text-sm bg-background text-[#1e1a17] dark:text-[#faf8f5] dark:bg-[#1a1a1a]"
            data-testid="albums-family-select"
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="albums-loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3" data-testid={`albums-skeleton-${i}`}>
              <Skeleton className="h-48 w-full rounded-md bg-[#e8e4de] dark:bg-[#2a2a2a]" />
              <Skeleton className="h-5 w-3/4 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
              <Skeleton className="h-4 w-1/2 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && albums.length === 0 && selectedFamilyId && (
        <WarmEmptyState
          emoji="📚"
          title="Your family's memories start here"
          description="Create your first album to start organizing your family photos and videos."
          ctaLabel="Create Your First Album"
          ctaHref="/albums/new"
          secondaryLabel="Invite family members →"
          secondaryHref={`/app/family/${selectedFamilyId}/invite`}
        />
      )}

      {/* Albums Grid */}
      {!loading && albums.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="albums-grid"
        >
          {albums.map((album, index) => (
            <div key={album.id} data-testid={`albums-card-wrapper-${index}`}>
              <AlbumCard
                album={album}
                index={index}
                onDelete={(id) => setDeleteConfirmId(id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent
          className="bg-[#faf8f5] dark:bg-[#1a1a1a] border-[#d8d3cc] dark:border-[#333]"
          data-testid="albums-delete-dialog"
        >
          <DialogHeader data-testid="albums-delete-dialog-header">
            <DialogTitle data-testid="albums-delete-dialog-title">Delete Album?</DialogTitle>
            <DialogDescription data-testid="albums-delete-dialog-description">
              Are you sure you want to delete this album? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter data-testid="albums-delete-dialog-footer">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-[#d8d3cc] text-[#1e1a17] hover:bg-[#f0ede8] dark:border-[#444] dark:text-[#faf8f5] dark:hover:bg-[#2a2a2a]"
              data-testid="albums-delete-cancel-button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteAlbum(deleteConfirmId)}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="albums-delete-confirm-button"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
