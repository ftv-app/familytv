"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error server-side only
    if (typeof window === "undefined") {
      console.error("[AppShell Error]", error.message);
    }
  }, [error]);

  // If auth-related, redirect to sign-in instead of showing error
  if (
    typeof error.message === "string" &&
    (error.message.includes("Clerk") ||
      error.message.includes("auth") ||
      error.message.includes("session") ||
      error.digest?.includes("clerk"))
  ) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#E8E8EC" }}>
        Something went wrong
      </h1>
      <p className="text-sm mb-6" style={{ color: "#8E8E96" }}>
        We encountered an error loading this page.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ backgroundColor: "#2D5A4A", color: "#FDF8F3" }}
      >
        Try again
      </button>
    </div>
  );
}
