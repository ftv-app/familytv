"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlbumForm } from "@/components/album-form";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface Photo {
  id: string;
  url: string;
  caption?: string;
}

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const fetchAlbum = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/albums/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load album");
        router.push("/albums");
        return;
      }
      setAlbum(data.album);
    } catch {
      toast.error("Failed to load album");
      router.push("/albums");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authLoaded && userId && id) {
      fetchAlbum();
    }
  }, [authLoaded, userId, id, fetchAlbum]);

  async function handleDeleteAlbum() {
    if (!album) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete album");
        return;
      }
      toast.success("Album deleted successfully");
      router.push("/albums");
      router.refresh();
    } catch {
      toast.error("Failed to delete album");
    } finally {
      setDeleting(false);
    }
  }

  if (!authLoaded || (authLoaded && !userId)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground" data-testid="albums-detail-auth-prompt">
          Please sign in to view this album.
        </p>
      </div>
    );
  }

  const formattedCreatedAt = album
    ? new Date(album.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const formattedUpdatedAt = album
    ? new Date(album.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8" data-testid="albums-detail-page">
      {/* Back Link */}
      <Link
        href="/albums"
        className="inline-flex items-center text-sm text-[#7c2d2d] hover:underline mb-6 dark:text-[#a84a4a]"
        data-testid="albums-detail-back-link"
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

      {/* Loading State */}
      {loading && (
        <div className="space-y-6" data-testid="albums-detail-loading">
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/2 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
            <Skeleton className="h-5 w-1/3 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
            <Skeleton className="h-5 w-1/4 bg-[#e8e4de] dark:bg-[#2a2a2a]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="h-48 w-full rounded-md bg-[#e8e4de] dark:bg-[#2a2a2a]"
                data-testid={`albums-detail-photo-skeleton-${i}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Album Content */}
      {!loading && album && (
        <>
          {/* Album Header */}
          <div className="mb-8" data-testid="albums-detail-header">
            {/* Cover Image */}
            {album.coverUrl && (
              <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden" data-testid="albums-detail-cover">
                <Image
                  src={album.coverUrl}
                  alt={album.name}
                  fill
                  className="object-cover"
                  data-testid="albums-detail-cover-image"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="font-heading text-3xl font-bold text-[#1e1a17] dark:text-[#faf8f5]"
                  data-testid="albums-detail-name"
                >
                  {album.name}
                </h1>
                {album.description && (
                  <p
                    className="text-muted-foreground mt-2 max-w-2xl"
                    data-testid="albums-detail-description"
                  >
                    {album.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground" data-testid="albums-detail-meta">
                  <span data-testid="albums-detail-created">
                    Created {formattedCreatedAt}
                  </span>
                  {formattedUpdatedAt !== formattedCreatedAt && (
                    <span data-testid="albums-detail-updated">
                      Updated {formattedUpdatedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2" data-testid="albums-detail-actions">
                {/* Edit */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#d8d3cc] text-[#1e1a17] hover:bg-[#f0ede8] dark:border-[#444] dark:text-[#faf8f5] dark:hover:bg-[#2a2a2a]"
                      data-testid="albums-detail-edit-button"
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="bg-[#faf8f5] dark:bg-[#1a1a1a] border-[#d8d3cc] dark:border-[#333] max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    data-testid="albums-detail-edit-dialog"
                  >
                    <AlbumForm
                      mode="edit"
                      albumId={album.id}
                      initialData={{
                        name: album.name,
                        description: album.description,
                        coverUrl: album.coverUrl,
                      }}
                      familyId={album.familyId}
                    />
                  </DialogContent>
                </Dialog>

                {/* Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAlbum}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="albums-detail-delete-button"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div data-testid="albums-detail-photos-section">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-heading text-xl font-semibold text-[#1e1a17] dark:text-[#faf8f5]"
                data-testid="albums-detail-photos-title"
              >
                Photos
              </h2>
              <span
                className="text-sm text-muted-foreground"
                data-testid="albums-detail-photos-count"
              >
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </span>
            </div>

            {photos.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#d8d3cc] dark:border-[#444] rounded-lg"
                data-testid="albums-detail-photos-empty"
              >
                <svg
                  className="h-12 w-12 text-[#c4b8ad] dark:text-[#555] mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-muted-foreground text-sm" data-testid="albums-detail-photos-empty-text">
                  No photos in this album yet.
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Photo uploads coming soon.
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                data-testid="albums-detail-photos-grid"
              >
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    className="relative h-48 overflow-hidden rounded-md cursor-pointer group"
                    data-testid={`albums-detail-photo-${index}`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? `Photo ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      data-testid={`albums-detail-photo-image-${index}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox */}
          {lightboxPhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
              onClick={() => setLightboxPhoto(null)}
              data-testid="albums-detail-lightbox"
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={() => setLightboxPhoto(null)}
                data-testid="albums-detail-lightbox-close"
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption ?? "Photo"}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                data-testid="albums-detail-lightbox-image"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
