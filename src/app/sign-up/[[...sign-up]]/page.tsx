"use client";

import { SignUp } from "@clerk/nextjs";
import { Component, ReactNode } from "react";

interface SignUpBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class SignUpErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  SignUpBoundaryState
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): SignUpBoundaryState {
    return { hasError: true, errorMessage: error.message || "Something went wrong" };
  }

  componentDidCatch(error: Error) {
    console.error("[SignUp] error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-6 rounded-lg border border-destructive/50 bg-destructive/10"
          data-testid="auth-signup-error-boundary"
          role="alert"
        >
          <p className="text-destructive text-sm mb-4 text-center">{this.state.errorMessage}</p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="auth-signup-retry-button"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SignUpPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background px-4"
      aria-label="Create a FamilyTV account"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div id="main-content" className="w-full max-w-md" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="sr-only">Create a FamilyTV account</h2>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4" role="img" aria-label="FamilyTV logo">
            <div
              className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"
              aria-hidden="true"
              data-testid="auth-logo"
            >
              <span className="text-primary-foreground font-heading font-bold text-lg" aria-hidden="true">F</span>
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

        <SignUpErrorBoundary>
          <div data-testid="auth-signup-clerk-component">
            <SignUp fallbackRedirectUrl="/app" />
          </div>
        </SignUpErrorBoundary>

        <p className="text-center text-base text-muted-foreground mt-6 leading-relaxed" data-testid="auth-tagline">
          No ads, no algorithms — just your family, sharing what matters.
        </p>
      </div>
    </main>
  );
}
