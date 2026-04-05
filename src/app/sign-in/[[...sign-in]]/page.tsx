"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Sign in to FamilyTV">
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
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-base" data-testid="auth-subheading">
              Your family is waiting for you
            </p>
          </div>
          {/* Loading spinner - shows while Clerk component hydrates */}
          <div className="flex justify-center" data-testid="signin-loading-spinner" role="status" aria-label="Loading">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading sign-in form...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Sign in to FamilyTV">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        Skip to main content
      </a>
      <div id="main-content" className="w-full max-w-md" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="sr-only">Sign in to FamilyTV</h2>
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
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1 text-base" data-testid="auth-subheading">
            Your family is waiting for you
          </p>
        </div>

        <div data-testid="auth-signin-clerk-component">
          <SignIn fallbackRedirectUrl="/app" />
        </div>

        <p className="text-center text-base text-muted-foreground mt-6 leading-relaxed" data-testid="auth-tagline">
          Share photos, plan events, and stay connected with the people who matter most.
        </p>
      </div>
    </main>
  );
}
