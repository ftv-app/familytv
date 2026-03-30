"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches unexpected errors in the component tree.
 * Displays a friendly fallback UI instead of raw error messages.
 * Logs errors to console with full stack trace for debugging.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Structured error log for debugging
    console.error(
      JSON.stringify(
        {
          type: "UNCAUGHT_ERROR",
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ onReset }: { onReset: () => void }) {
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
            We ran into an unexpected issue. Your family moments are safe — this
            is just a temporary hiccup on our end.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onReset}
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

export default ErrorBoundary;
