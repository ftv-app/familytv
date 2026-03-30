"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Copy, Check, Link2, Mail } from "lucide-react";

// Progress dots component - step 3
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

export default function OnboardingInvitePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = searchParams.get("familyId");

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  // Redirect if not signed in or no familyId
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, router]);

  // Create invite on mount
  useEffect(() => {
    if (!familyId || !isLoaded) return;

    const createInvite = async () => {
      try {
        const res = await fetch(`/api/families/${familyId}/invites`, {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          setInviteLink(data.inviteLink);
        }
      } catch (err) {
        console.error("Failed to create invite:", err);
      } finally {
        setInviteLoading(false);
      }
    };

    createInvite();
  }, [familyId, isLoaded]);

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      toast.error("Could not copy automatically");
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !inviteLink) return;

    setEmailLoading(true);

    try {
      // Use mailto: link as fallback since we don't have an email API set up yet
      const subject = encodeURIComponent("You're invited to join our family on FamilyTV!");
      const body = encodeURIComponent(
        `You're invited to join our family on FamilyTV!\n\nClick this link to join: ${inviteLink}\n\nSee you there!`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      setEmailSent(email);
      setEmail("");
      setTimeout(() => setEmailSent(null), 3000);
    } catch (err) {
      toast.error("Failed to open email app");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/app");
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
        onClick={() => router.push("/onboarding/create-family")}
        className="absolute top-4 left-4 flex items-center gap-2 text-secondary hover:text-foreground transition-colors"
        style={{ minWidth: "44px", minHeight: "44px" }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        <ProgressDots currentStep={3} />

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-4xl mb-4">👋</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-2 leading-tight">
            Almost there!
          </h1>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
            Invite someone special
          </h2>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
            to see your family photos
          </h2>
        </div>

        <p className="text-muted-foreground text-base text-center mb-8">
          Your family can&apos;t wait to see your photos and videos.
        </p>

        {/* Primary action - Copy invite link */}
        <div className="space-y-4 mb-6">
          {inviteLoading ? (
            <button
              disabled
              className="w-full bg-secondary text-secondary-foreground font-medium rounded-lg flex items-center justify-center gap-2 opacity-50"
              style={{ height: "52px", fontSize: "16px" }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating invite...
            </button>
          ) : inviteLink ? (
            <button
              onClick={handleCopy}
              className="w-full bg-secondary text-secondary-foreground font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
              style={{ height: "52px", fontSize: "16px" }}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy invite link
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-secondary text-secondary-foreground font-medium rounded-lg flex items-center justify-center gap-2 opacity-50"
              style={{ height: "52px", fontSize: "16px" }}
            >
              Could not create invite
            </button>
          )}

          {copyError && inviteLink && (
            <div className="text-sm text-muted-foreground text-center">
              <p>Could not copy automatically. Here&apos;s your link:</p>
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full mt-2 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-foreground"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email invite */}
        <form onSubmit={handleSendEmail} className="space-y-3">
          <div>
            <label htmlFor="invite-email" className="sr-only">
              Their email address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Their email address"
              autoComplete="email"
              className="w-full bg-card border border-border rounded-lg px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              style={{ height: "52px", fontSize: "16px" }}
            />
          </div>

          <button
            type="submit"
            disabled={!email || emailLoading || !inviteLink}
            className="w-full bg-card border-2 border-secondary text-secondary font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: "48px", fontSize: "16px" }}
          >
            {emailLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send invite
                <Mail className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Email sent confirmation */}
        {emailSent && (
          <p className="text-sm text-secondary font-medium text-center mt-3">
            Invite sent to {emailSent} ✓
          </p>
        )}

        {/* Skip */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSkip}
            className="text-primary font-medium hover:underline"
            style={{ fontSize: "16px" }}
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
