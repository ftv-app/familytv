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
            className={`rounded-full transition-all duration-300 ${
              isActive
                ? "w-2.5 h-2.5 bg-primary"
                : isCompleted
                ? "w-2 h-2 bg-secondary"
                : "w-2 h-2 border border-border bg-transparent"
            }`}
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/onboarding")}
        className="absolute top-4 left-4 flex items-center gap-2 text-secondary hover:text-foreground transition-colors"
        style={{ minWidth: "44px", minHeight: "44px" }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        <ProgressDots currentStep={2} />

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-4">🎉</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-2 leading-tight">
            You&apos;re in!
          </h1>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
            What should we call
          </h2>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
            your family?
          </h2>
        </div>

        {/* Name suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setFamilyName(suggestion)}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
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
              className="w-full bg-card border border-border rounded-lg px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-center"
              style={{
                height: "60px",
                fontSize: "20px",
              }}
            />
            <p className="text-xs text-muted-foreground text-right mt-2">
              {familyName.length}/50
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-primary text-primary-foreground font-medium rounded-lg transition-all duration-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ height: "52px", fontSize: "16px" }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
