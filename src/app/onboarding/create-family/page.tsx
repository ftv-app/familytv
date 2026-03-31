"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

// Progress dots component - step 2
function ProgressDots({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [1, 2, 3];
  return (
    <div className="flex items-center justify-center gap-3 mb-12" aria-label={`Step ${currentStep} of 3`}>
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div
            key={step}
            className="rounded-full transition-all duration-300"
            style={{
              width: isActive ? "10px" : "8px",
              height: isActive ? "10px" : "8px",
              backgroundColor: isActive ? '#2D5A4A' : isCompleted ? '#3D7A64' : 'transparent',
              border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            }}
            aria-current={isActive ? "step" : undefined}
          />
        );
      })}
    </div>
  );
}

export default function OnboardingCreateFamilyPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, router]);

  // Generate name suggestions from Clerk user metadata
  const suggestions: string[] = [];
  if (user?.lastName) {
    suggestions.push(`The ${user.lastName} Family`);
  }
  if (user?.firstName) {
    const plural = user.firstName.endsWith("s") ? user.firstName : `${user.firstName}s`;
    suggestions.push(`The ${plural}`);
  }
  suggestions.push("Our Family");

  const isValid = familyName.trim().length >= 1 && familyName.length <= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create family");
      }

      const { familyId } = await res.json();
      toast.success("Family created!");
      router.push(`/onboarding/invite?familyId=${familyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      toast.error("Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0D0D0F' }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A8A8B0' }} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0D0D0F' }}
    >
      {/* Back button */}
      <button
        onClick={() => router.push("/onboarding")}
        className="absolute top-4 left-4 flex items-center gap-2 transition-colors"
        style={{ color: '#A8A8B0', minWidth: "44px", minHeight: "44px" }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        <ProgressDots currentStep={2} />

        {/* Header */}
        <div className="text-center mb-8">
          {/* TV icon */}
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          
          <h1 
            className="font-heading text-3xl sm:text-4xl font-bold mb-2 leading-tight"
            style={{ color: '#E8E8EC' }}
          >
            You&apos;re in!
          </h1>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: '#E8E8EC' }}
          >
            What should we call
          </h2>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: '#D4AF37' }}
          >
            your channel?
          </h2>
        </div>

        {/* Name suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6" role="group" aria-label="Suggested family names">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setFamilyName(suggestion)}
                className="px-4 py-3 rounded-lg text-base transition-colors min-h-[48px]"
                style={{ 
                  backgroundColor: '#1A1A1E', 
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#E8E8EC'
                }}
                aria-label={`Use suggested name: ${suggestion}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="family-name" className="sr-only">
              Family name
            </label>
            <input
              id="family-name"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. The Smith Family"
              maxLength={50}
              autoFocus
              className="w-full rounded-lg px-4 text-center transition-colors focus:outline-none focus:ring-2"
              style={{
                height: "60px",
                fontSize: "20px",
                backgroundColor: '#1A1A1E',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#E8E8EC',
                fontFamily: 'var(--font-heading)',
              }}
            />
            <p 
              className="text-xs text-right mt-2"
              style={{ color: '#5A5A62' }}
            >
              {familyName.length}/50
            </p>
          </div>

          {error && (
            <p 
              className="text-sm text-center"
              style={{ color: '#E74C3C' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full font-medium rounded-lg transition-all duration-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-0"
            aria-label={loading ? "Creating family..." : "Continue to invite family members"}
            aria-disabled={!isValid || loading}
            style={{ 
              height: "52px", 
              fontSize: "16px",
              backgroundColor: '#2D5A4A',
              color: '#FDF8F3'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Creating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
