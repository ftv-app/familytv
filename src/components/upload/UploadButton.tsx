"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WarmSpinner } from "@/components/ui/spinner";

export interface UploadButtonProps {
  /** The family to upload to (required). */
  familyId: string;
  /** Associate this upload with an existing album. */
  albumId?: string | null;
  /** Create a new album with this name if albumId is not provided. */
  createAlbum?: string | null;
  /** Called with the returned blob URL on success. */
  onUploadComplete?: (url: string, postId: string) => void;
  /** Additional class name. */
  className?: string;
  /** Button variant passed to shadcn Button. Default: outline. */
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  /** Button size passed to shadcn Button. Default: sm. */
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  /** Accepted MIME types. Default: images + videos. */
  accept?: string;
  /** Children render inside the button. */
  children?: React.ReactNode;
}

type UploadState = "idle" | "uploading" | "success" | "error";

const DEFAULT_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,video/x-msvideo";

export function UploadButton({
  familyId,
  albumId,
  createAlbum,
  onUploadComplete,
  className,
  variant = "outline",
  size = "sm",
  accept = DEFAULT_ACCEPT,
  children,
}: UploadButtonProps) {
  const { userId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
    // Reset input so the same file can be re-selected after success
    e.target.value = "";
  }

  function uploadFile(file: File) {
    if (!userId) {
      toast.error("You must be signed in to upload.");
      return;
    }

    setUploadState("uploading");
    setProgress(0);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setUploadState("success");
          setProgress(100);
          toast.success("Upload complete!");
          onUploadComplete?.(data.url, data.post?.id);
        } catch {
          setUploadState("error");
          toast.error("Upload succeeded but response was invalid.");
        }
      } else {
        setUploadState("error");
        try {
          const data = JSON.parse(xhr.responseText);
          toast.error(data.error || `Upload failed (${xhr.status})`);
        } catch {
          toast.error(`Upload failed (${xhr.status})`);
        }
      }
    });

    xhr.addEventListener("error", () => {
      setUploadState("error");
      toast.error("Network error during upload.");
    });

    xhr.addEventListener("abort", () => {
      setUploadState("idle");
      setProgress(0);
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("contentType", file.type);
    formData.append("familyId", familyId);
    if (albumId) formData.append("albumId", albumId);
    if (createAlbum) formData.append("createAlbum", createAlbum);

    xhr.open("POST", "/api/upload");
    xhr.send(formData);

    setTimeout(() => setUploadState("idle"), 3000);
  }

  const isUploading = uploadState === "uploading";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
        data-testid="upload-button-input"
      />

      <Button
        variant={variant}
        size={size}
        onClick={isUploading ? undefined : handleClick}
        disabled={isUploading}
        className={isUploading ? "cursor-not-allowed" : "cursor-pointer"}
        data-testid="upload-button"
      >
        {isUploading ? (
          <>
            <WarmSpinner size="sm" className="mr-1.5" />
            {progress > 0 ? `${progress}%` : "Uploading…"}
          </>
        ) : (
          children ?? (
            <>
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload
            </>
          )
        )}
      </Button>
    </div>
  );
}
