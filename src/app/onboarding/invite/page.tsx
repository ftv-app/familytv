"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Copy, Check, Mail } from "lucide-react";

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

function OnboardingInviteContent() {
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
        onClick={() => router.push("/onboarding/create-family")}
        className="absolute top-4 left-4 flex items-center gap-2 transition-colors"
        style={{ color: '#A8A8B0', minWidth: "44px", minHeight: "44px" }}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </button>

      <div className="w-full max-w-md mx-auto">
        <ProgressDots currentStep={3} />

        {/* Header */}
        <div className="text-center mb-6">
          {/* Wave icon */}
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          
          <h1 
            className="font-heading text-3xl sm:text-4xl font-bold mb-2 leading-tight"
            style={{ color: '#E8E8EC' }}
          >
            Almost there!
          </h1>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: '#E8E8EC' }}
          >
            Invite someone special
          </h2>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: '#A8A8B0' }}
          >
            to your channel
          </h2>
        </div>

        <p 
          className="text-base text-center mb-8"
          style={{ color: '#A8A8B0' }}
        >
          Your family can&apos;t wait to see your photos and videos.
        </p>

        {/* Primary action - Copy invite link */}
        <div className="space-y-4 mb-6">
          {inviteLoading ? (
            <button
              disabled
              className="w-full font-medium rounded-lg flex items-center justify-center gap-2 opacity-50 border-0"
              style={{ 
                height: "52px", 
                fontSize: "16px",
                backgroundColor: '#1A1A1E',
                color: '#A8A8B0'
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating invite...
            </button>
          ) : inviteLink ? (
            <button
              onClick={handleCopy}
              className="w-full font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] border-0"
              style={{ 
                height: "52px", 
                fontSize: "16px",
                backgroundColor: '#2D5A4A',
                color: '#FDF8F3'
              }}
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
              className="w-full font-medium rounded-lg flex items-center justify-center gap-2 opacity-50 border-0"
              style={{ 
                height: "52px", 
                fontSize: "16px",
                backgroundColor: '#1A1A1E',
                color: '#A8A8B0'
              }}
            >
              Could not create invite
            </button>
          )}

          {copyError && inviteLink && (
            <div 
              className="text-sm text-center"
              style={{ color: '#A8A8B0' }}
            >
              <p>Could not copy automatically. Here&apos;s your link:</p>
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full mt-2 px-3 py-2 rounded-lg text-sm border-0"
                style={{ 
                  backgroundColor: '#252529', 
                  color: '#E8E8EC',
                  fontFamily: 'var(--font-mono)'
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
          <span 
            className="text-sm"
            style={{ color: '#5A5A62' }}
          >
            or
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
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
              className="w-full rounded-lg px-4 text-base transition-colors focus:outline-none focus:ring-2 border-0"
              style={{ 
                height: "52px", 
                backgroundColor: '#1A1A1E',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#E8E8EC',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!email || emailLoading || !inviteLink}
            className="w-full font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              height: "48px", 
              fontSize: "16px",
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#A8A8B0'
            }}
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
          <p 
            className="text-sm font-medium text-center mt-3"
            style={{ color: '#2ECC71' }}
          >
            Invite sent to {emailSent} ✓
          </p>
        )}

        {/* Skip */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSkip}
            className="font-medium hover:underline"
            style={{ fontSize: "16px", color: '#A8A8B0' }}
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitePageLoading() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0D0D0F' }}
    >
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A8A8B0' }} />
    </div>
  );
}

export default function OnboardingInvitePage() {
  return (
    <Suspense fallback={<InvitePageLoading />}>
      <OnboardingInviteContent />
    </Suspense>
  );
}
