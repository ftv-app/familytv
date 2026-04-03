"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface AlbumCardProps {
  album: Album;
  index: number;
  onDelete?: (id: string) => void;
}

export function AlbumCard({ album, index, onDelete }: AlbumCardProps) {
  const formattedDate = new Date(album.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className="group overflow-hidden transition-all duration-200 hover:shadow-lg border-[#d8d3cc] dark:border-[#333]"
      data-testid={`albums-card-${index}`}
    >
      {/* Cover Image */}
      <Link href={`/albums/${album.id}`} className="block" data-testid={`albums-card-link-${index}`}>
        <div className="relative h-48 w-full bg-[#f0ede8] dark:bg-[#2a2a2a] overflow-hidden">
          {album.coverUrl ? (
            <Image
              src={album.coverUrl}
              alt={album.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              data-testid={`albums-card-cover-${index}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" data-testid={`albums-card-cover-placeholder-${index}`}>
              <svg
                className="h-16 w-16 text-[#a89a8c] dark:text-[#555]"
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
            </div>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <CardHeader className="p-4 pb-2">
        <Link href={`/albums/${album.id}`} className="hover:underline" data-testid={`albums-card-title-link-${index}`}>
          <h3
            className="font-heading text-lg font-semibold text-[#1e1a17] dark:text-[#faf8f5] truncate"
            data-testid={`albums-card-name-${index}`}
          >
            {album.name}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {album.description && (
          <p
            className="text-sm text-[#6b635a] dark:text-[#a89a8c] line-clamp-2"
            data-testid={`albums-card-description-${index}`}
          >
            {album.description}
          </p>
        )}
        <p
          className="text-xs text-[#a89a8c] dark:text-[#777] mt-2"
          data-testid={`albums-card-date-${index}`}
        >
          {formattedDate}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/albums/${album.id}`} data-testid={`albums-card-view-button-${index}`}>
          <Button variant="outline" size="sm" className="border-[#7c2d2d] text-[#7c2d2d] hover:bg-[#7c2d2d] hover:text-white dark:border-[#7c2d2d] dark:text-[#faf8f5] dark:hover:bg-[#7c2d2d]">
            View
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(album.id)}
            className="text-[#c44] hover:text-[#a33] hover:bg-red-50 dark:text-[#c44] dark:hover:bg-red-950"
            data-testid={`albums-card-delete-button-${index}`}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
