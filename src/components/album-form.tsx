"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface AlbumFormProps {
  mode: "create" | "edit";
  albumId?: string;
  initialData?: {
    name: string;
    description: string | null;
    coverUrl: string | null;
  };
  familyId: string;
}

export function AlbumForm({ mode, albumId, initialData, familyId }: AlbumFormProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl ?? "");
  const [errors, setErrors] = useState<{ name?: string; coverUrl?: string }>({});

  useEffect(() => {
    if (mode === "edit" && albumId) {
      // Fetch album data for edit mode
      fetch(`/api/albums/${albumId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.album) {
            setName(data.album.name);
            setDescription(data.album.description ?? "");
            setCoverUrl(data.album.coverUrl ?? "");
          }
        })
        .catch(() => {
          toast.error("Failed to load album");
        });
    }
  }, [mode, albumId]);

  function validate(): boolean {
    const newErrors: { name?: string; coverUrl?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Album name is required";
    } else if (name.trim().length > 100) {
      newErrors.name = "Album name must be 100 characters or less";
    }
    if (coverUrl && !isValidUrl(coverUrl)) {
      newErrors.coverUrl = "Please enter a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        familyId,
      };

      let res: Response;
      let data;

      if (mode === "create") {
        res = await fetch("/api/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/albums/${albumId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      data = await res.json();

      if (!res.ok) {
        toast.error(data.error || `Failed to ${mode} album`);
        return;
      }

      toast.success(`Album ${mode === "create" ? "created" : "updated"} successfully`);
      router.push(`/albums/${mode === "create" ? data.album.id : albumId}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-[#d8d3cc] dark:border-[#333]" data-testid="albums-form-card">
      <CardHeader data-testid="albums-form-header">
        <CardTitle className="font-heading text-xl" data-testid="albums-form-title">
          {mode === "create" ? "Create New Album" : "Edit Album"}
        </CardTitle>
        <CardDescription data-testid="albums-form-description">
          {mode === "create"
            ? "Give your album a name and optionally add a description and cover photo."
            : "Update the album details below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="albums-form">
          {/* Album Name */}
          <div className="space-y-2" data-testid="albums-name-field">
            <Label htmlFor="album-name" data-testid="albums-name-label">
              Album Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="album-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g., Summer Vacation 2024"
              maxLength={100}
              className={`border-[#d8d3cc] focus-visible:border-[#7c2d2d] focus-visible:ring-[#7c2d2d] dark:border-[#444] dark:bg-[#1a1a1a] dark:focus-visible:border-[#7c2d2d] dark:focus-visible:ring-[#7c2d2d] ${
                errors.name ? "border-destructive" : ""
              }`}
              data-testid="albums-name-input"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "albums-name-error" : undefined}
            />
            {errors.name && (
              <p id="albums-name-error" className="text-sm text-destructive" data-testid="albums-name-error">
                {errors.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground" data-testid="albums-name-hint">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2" data-testid="albums-description-field">
            <Label htmlFor="album-description" data-testid="albums-description-label">
              Description
            </Label>
            <Textarea
              id="album-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your album..."
              rows={3}
              className="border-[#d8d3cc] focus-visible:border-[#7c2d2d] focus-visible:ring-[#7c2d2d] dark:border-[#444] dark:bg-[#1a1a1a] dark:focus-visible:border-[#7c2d2d] dark:focus-visible:ring-[#7c2d2d] resize-none"
              data-testid="albums-description-input"
            />
          </div>

          {/* Cover URL */}
          <div className="space-y-2" data-testid="albums-cover-url-field">
            <Label htmlFor="album-cover-url" data-testid="albums-cover-url-label">
              Cover Photo URL
            </Label>
            <Input
              id="album-cover-url"
              type="url"
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                if (errors.coverUrl) setErrors((prev) => ({ ...prev, coverUrl: undefined }));
              }}
              placeholder="https://example.com/photo.jpg"
              className={`border-[#d8d3cc] focus-visible:border-[#7c2d2d] focus-visible:ring-[#7c2d2d] dark:border-[#444] dark:bg-[#1a1a1a] dark:focus-visible:border-[#7c2d2d] dark:focus-visible:ring-[#7c2d2d] ${
                errors.coverUrl ? "border-destructive" : ""
              }`}
              data-testid="albums-cover-url-input"
              aria-invalid={!!errors.coverUrl}
              aria-describedby={errors.coverUrl ? "albums-cover-url-error" : undefined}
            />
            {errors.coverUrl && (
              <p id="albums-cover-url-error" className="text-sm text-destructive" data-testid="albums-cover-url-error">
                {errors.coverUrl}
              </p>
            )}
            {coverUrl && isValidUrl(coverUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Cover preview"
                className="mt-2 h-32 w-full object-cover rounded-md border border-[#d8d3cc] dark:border-[#444]"
                data-testid="albums-cover-preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" data-testid="albums-form-actions">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#7c2d2d] hover:bg-[#6b2626] text-white dark:bg-[#7c2d2d] dark:hover:bg-[#6b2626]"
              data-testid="albums-submit-button"
            >
              {loading ? "Saving..." : mode === "create" ? "Create Album" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-[#d8d3cc] text-[#1e1a17] hover:bg-[#f0ede8] dark:border-[#444] dark:text-[#faf8f5] dark:hover:bg-[#2a2a2a]"
              data-testid="albums-cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
