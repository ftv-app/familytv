"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Mail } from "lucide-react";
import Link from "next/link";

function SignUpErrorFallback() {
  return (
    <div
      data-testid="signup-error-fallback"
      className="w-full max-w-md mx-auto p-6 bg-card rounded-lg border border-border shadow-sm"
    >
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Mail className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Something went wrong loading the sign-up form.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please try again or contact support.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="mailto:support@familytv.com"
            data-testid="signup-support-link"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[min(var(--radius-md,0.5rem),12px)] px-2.5 text-[0.8rem] text-foreground transition-all"
          >
            Contact Support
          </a>
          <Link
            href="/app"
            className="inline-flex shrink-0 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground h-7 gap-1 rounded-[min(var(--radius-md,0.5rem),12px)] px-2.5 text-[0.8rem] text-foreground transition-all"
          >
            Go to App
          </Link>
        </div>
      </div>
    </div>
  );
}

function SignUpLoadingSkeleton() {
  return (
    <div
      data-testid="signup-loading-skeleton"
      className="w-full max-w-md mx-auto p-6 bg-card rounded-lg border border-border shadow-sm animate-pulse"
      aria-label="Loading sign-up form"
    >
      <div className="space-y-4">
        {/* Email field skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded-md" />
        </div>
        {/* Password field skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded-md" />
        </div>
        {/* Submit button skeleton */}
        <div className="h-10 w-full bg-muted rounded-md mt-6" />
        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-muted" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-muted" />
        </div>
        {/* Social button skeleton */}
        <div className="h-10 w-full bg-muted rounded-md" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Simulate Clerk component loading time
    const timer = setTimeout(() => {
      setSignUpLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Create a FamilyTV account">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Skip to main content
        </a>
        <div id="main-content" className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4" role="img" aria-label="FamilyTV logo">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true" data-testid="auth-logo">
                <span aria-hidden="true" className="text-primary-foreground font-heading font-bold text-lg">
                  F
                </span>
              </div>
              <span className="font-heading text-xl font-semibold text-foreground" data-testid="auth-brand-name">
                FamilyTV
              </span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground" data-testid="auth-heading">
              Join your family on FamilyTV
            </h1>
            <p className="text-muted-foreground mt-1 text-base" data-testid="auth-subheading">
              The private place for your closest people
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Create a FamilyTV account">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        Skip to main content
      </a>
      <div id="main-content" className="w-full max-w-md" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="sr-only">Create a FamilyTV account</h2>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4" role="img" aria-label="FamilyTV logo">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true" data-testid="auth-logo">
              <span aria-hidden="true" className="text-primary-foreground font-heading font-bold text-lg">
                F
              </span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground" data-testid="auth-brand-name">
              FamilyTV
            </span>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground" data-testid="auth-heading">
            Join your family on FamilyTV
          </h1>
          <p className="text-muted-foreground mt-1 text-base" data-testid="auth-subheading">
            The private place for your closest people
          </p>
        </div>

        {signUpLoading ? (
          <SignUpLoadingSkeleton />
        ) : (
          <ErrorBoundary fallback={<SignUpErrorFallback />}>
            <div data-testid="auth-signup-clerk-component">
              <SignUp fallbackRedirectUrl="/app" />
            </div>
          </ErrorBoundary>
        )}

        <p className="text-center text-base text-muted-foreground mt-6 leading-relaxed" data-testid="auth-tagline">
          No ads, no algorithms — just your family, sharing what matters.
        </p>
      </div>
    </main>
  );
}
