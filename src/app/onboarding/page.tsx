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
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8E8E96' }} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0D0D0F' }}
    >
      {/* Back to home link */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 transition-colors"
        style={{ color: '#8E8E96', minWidth: "44px", minHeight: "44px" }}
      >
        <ArrowRight className="w-5 h-5 rotate-180" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </Link>

      <div className="w-full max-w-md mx-auto text-center">
        {step === "welcome" ? (
          <>
            {/* Logo — TV icon */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#C41E3A' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDF8F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
              </div>
            </div>

            <p 
              className="font-heading text-sm tracking-[0.2em] uppercase mb-4"
              style={{ color: '#8E8E96' }}
            >
              Welcome to
            </p>
            
            <h1 
              className="font-heading text-4xl sm:text-5xl font-bold mb-6 leading-tight glow-gold"
              style={{ color: '#D4AF37' }}
            >
              FamilyTV
            </h1>
            
            <p 
              className="text-base mb-10 leading-relaxed max-w-sm mx-auto"
              style={{ color: '#8E8E96' }}
            >
              Your private family channel. Share photos, videos, and live moments only with the people you invite.
            </p>

            <button
              onClick={() => router.push("/sign-in")}
              className="w-full font-medium rounded-lg transition-all duration-100 active:scale-[0.98] border-0"
              style={{ 
                height: "52px", 
                fontSize: "16px",
                backgroundColor: '#2D5A4A',
                color: '#FDF8F3'
              }}
            >
              Get started
              <ArrowRight className="inline-block w-5 h-5 ml-2" />
            </button>

            <p 
              className="text-center text-sm mt-6"
              style={{ color: '#8E8E96' }}
            >
              New to FamilyTV?{" "}
              <Link 
                href="/sign-up" 
                className="font-medium hover:underline"
                style={{ color: '#D4AF37' }}
              >
                Create an account
              </Link>
            </p>
          </>
        ) : (
          // Redirecting state - should not happen since we redirect in useEffect
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8E8E96' }} />
          </div>
        )}
      </div>
    </div>
  );
}
