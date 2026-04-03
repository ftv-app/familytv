"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error server-side only
    if (typeof window === "undefined") {
      console.error("[AppShell Error]", error.message);
    }
  }, [error]);

  // If auth-related, redirect to sign-in instead of showing error
  useEffect(() => {
    if (
      typeof error.message === "string" &&
      (error.message.includes("Clerk") ||
        error.message.includes("auth") ||
        error.message.includes("session") ||
        error.digest?.includes("clerk"))
    ) {
      router.replace("/sign-in");
    }
  }, [error, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#E8E8EC" }}>
        Something went wrong
      </h1>
      <p className="text-sm mb-6" style={{ color: "#A8A8B0" }}>
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
