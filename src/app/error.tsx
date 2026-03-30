"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Next.js App Router error boundary — catches errors within a route segment.
 * This complements the root ErrorBoundary component above it.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log structured error for monitoring
    console.error(
      JSON.stringify(
        {
          type: "ROUTE_ERROR",
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#c4785a]/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#c4785a]" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1
            className="font-heading text-2xl font-semibold text-[oklch(0.18_0.015_50)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Something went wrong
          </h1>
          <p className="text-[oklch(0.45_0.015_50)] text-sm leading-relaxed">
            We hit a snag loading this page. Your family moments are safe — this
            is just a temporary issue on our end.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="gap-2 bg-[#c4785a] hover:bg-[#b06a4d] text-white border-0"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Link href="/app">
            <Button
              variant="outline"
              className="gap-2 border-[#c4785a] text-[#c4785a] hover:bg-[#c4785a]/10"
            >
              <Home className="w-4 h-4" />
              Go home
            </Button>
          </Link>
        </div>

        {/* Decorative footer note */}
        <p className="text-xs text-[oklch(0.45_0.015_50)]/60 pt-2">
          If this keeps happening, let us know and we&apos;ll fix it right away.
        </p>
      </div>
    </div>
  );
}
