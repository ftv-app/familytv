"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step] = useState<"welcome" | "signin">("welcome");

  // If user is already signed in, redirect to create-family
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      router.push("/onboarding/create-family");
    }
  }, [isLoaded, user, router]);

  // If still loading auth, show nothing (prevent flash)
  if (!isLoaded) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0D0D0F' }}
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A8A8B0' }} aria-hidden="true" />
        <span className="sr-only">Loading FamilyTV...</span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0D0D0F' }}
      aria-label="Welcome to FamilyTV"
    >
      {/* Skip to main content link - WCAG 2.1 AA */}
      <a 
        href="#onboarding-main" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2D5A4A] focus:text-[#FDF8F3] focus:outline-none focus:ring-2 focus:ring-[#2D5A4A] focus:ring-offset-2 focus:ring-offset-[#0D0D0F] rounded-lg"
      >
        Skip to main content
      </a>

      {/* Back to home link */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 transition-colors"
        style={{ color: '#A8A8B0', minWidth: "48px", minHeight: "48px" }}
        aria-label="Go back to home"
        data-testid="auth-back-home"
      >
        <ArrowRight className="w-5 h-5 rotate-180" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only sm:text-base">Back</span>
      </Link>

      <div id="onboarding-main" className="w-full max-w-md mx-auto text-center" role="main">
        {step === "welcome" ? (
          <>
            {/* Logo — TV icon */}
            <div className="flex items-center justify-center gap-2 mb-8" role="img" aria-label="FamilyTV logo - TV icon">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#C41E3A' }}
                data-testid="auth-onboarding-logo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
              </div>
            </div>

            <p 
              className="font-heading text-base tracking-[0.2em] uppercase mb-4"
              style={{ color: '#C8C8CC' }}
              data-testid="auth-onboarding-welcome-label"
            >
              Welcome to
            </p>
            
            <h1 
              className="font-heading text-4xl sm:text-5xl font-bold mb-6 leading-tight glow-gold"
              style={{ color: '#D4AF37' }}
              data-testid="auth-onboarding-brand-name"
            >
              FamilyTV
            </h1>
            
            <p 
              className="text-base mb-10 leading-relaxed max-w-sm mx-auto"
              style={{ color: '#C8C8CC' }}
              data-testid="auth-onboarding-description"
            >
              Your private family channel. Share photos, videos, and live moments only with the people you invite.
            </p>

            <button
              onClick={() => router.push("/sign-in")}
              className="w-full font-medium rounded-lg transition-all duration-100 active:scale-[0.98] border-0"
              aria-label="Get started with FamilyTV"
              data-testid="auth-get-started"
              style={{ 
                height: "52px", 
                fontSize: "16px",
                backgroundColor: '#2D5A4A',
                color: '#FDF8F3'
              }}
            >
              Get started
              <ArrowRight className="inline-block w-5 h-5 ml-2" aria-hidden="true" />
            </button>

            <p 
              className="text-center text-base mt-6"
              style={{ color: '#C8C8CC' }}
              data-testid="auth-signup-prompt"
            >
              New to FamilyTV?{" "}
              <Link 
                href="/sign-up" 
                className="font-medium hover:underline"
                style={{ color: '#D4AF37' }}
                aria-label="Create a new FamilyTV account"
                data-testid="auth-create-account"
              >
                Create an account
              </Link>
            </p>
          </>
        ) : (
          // Redirecting state - should not happen since we redirect in useEffect
          <div className="flex items-center justify-center" aria-live="polite" role="status">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A8A8B0' }} aria-hidden="true" />
            <span className="sr-only">Redirecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
