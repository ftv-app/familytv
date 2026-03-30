"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "signin">("welcome");

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Back to home link */}
      <a
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        style={{ minWidth: "44px", minHeight: "44px" }}
      >
        <ArrowRight className="w-5 h-5 rotate-180" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </a>

      <div className="w-full max-w-md mx-auto text-center">
        {step === "welcome" ? (
          <>
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xl">F</span>
              </div>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-4 leading-tight">
              Your family&apos;s private place
            </h1>
            <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-sm mx-auto">
              Share photos, videos, and calendars only with the people you invite. No ads, no algorithms.
            </p>

            <button
              onClick={() => router.push("/sign-in")}
              className="w-full bg-primary text-primary-foreground font-medium rounded-lg transition-all duration-100 active:scale-[0.98]"
              style={{ height: "52px", fontSize: "16px" }}
            >
              Get started
              <ArrowRight className="inline-block w-5 h-5 ml-2" />
            </button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              New to FamilyTV?{" "}
              <Link href="/sign-up" className="text-secondary font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </>
        ) : (
          // Redirecting state - should not happen since we redirect in useEffect
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
