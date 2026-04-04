"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WarmSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/components/post-card";
import { toast } from "sonner";

interface CreatePostProps {
  familyId: string;
  onPostCreated: (post: PostWithAuthor) => void;
}

export function CreatePost({ familyId, onPostCreated }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function clearMedia() {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaFile && !caption.trim()) {
      toast.error("Add a photo, video, or write something");
      return;
    }

    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;

      if (mediaFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("filename", mediaFile.name);
        formData.append("contentType", mediaFile.type);
        formData.append("familyId", familyId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const data = await res.json();
        mediaUrl = data.url;
        setUploading(false);
      }

      const contentType = mediaFile
        ? mediaFile.type.startsWith("video/")
          ? "video"
          : "image"
        : "text";

      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          contentType,
          mediaUrl,
          caption: caption.trim() || null,
        }),
      });

      if (!postRes.ok) {
        const err = await postRes.json();
        throw new Error(err.error ?? "Failed to create post");
      }

      const { post } = await postRes.json();

      const newPost: PostWithAuthor = {
        ...post,
        authorName: "You",
        createdAt: post.createdAt,
      };

      onPostCreated(newPost);
      setOpen(false);
      setCaption("");
      clearMedia();
      toast.success("Moment shared! 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Trigger card */}
      <Card
        id="create-post"
        className="border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
        data-testid="create-post-trigger"
      >
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">Share a moment</p>
          <p className="text-xs text-muted-foreground mt-1">
            Photo or video
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Share a moment
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-11 h-11 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Caption */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption... (optional)"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Media drop zone */}
              <div
                className={cn(
                  "relative rounded-lg border-2 border-dashed transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : mediaFile
                    ? "border-transparent"
                    : "border-border hover:border-primary/40",
                  "min-h-[140px] flex items-center justify-center"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {mediaPreview ? (
                  <div className="relative w-full">
                    {mediaFile?.type.startsWith("video/") ? (
                      <video
                        src={mediaPreview}
                        className="w-full max-h-48 object-contain rounded-lg"
                        controls
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 mx-auto text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs">
                        Drag & drop or{" "}
                        <span className="text-primary font-medium">browse</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || (!mediaFile && !caption.trim())}
                >
                  {submitting ? (
                    <>
                      <WarmSpinner size="sm" />
                      {uploading ? "Uploading..." : "Sharing..."}
                    </>
                  ) : (
                    "Share"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
