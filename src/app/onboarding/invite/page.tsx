"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Copy, Check, Mail } from "lucide-react";

// Progress dots component - step 3
function ProgressDots({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [1, 2, 3];
  return (
    <div className="flex items-center justify-center gap-3 mb-12" aria-label={`Step ${currentStep} of 3`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
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
            data-testid={`auth-progress-step-${step}`}
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

  // Announce copy status for screen readers
  const [liveMessage, setLiveMessage] = useState("");

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
      setLiveMessage("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setLiveMessage(""), 2000);
    } catch {
      setCopyError(true);
      setLiveMessage("Could not copy automatically");
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
      setLiveMessage(`Invite sent to ${email}`);
      setTimeout(() => setEmailSent(null), 3000);
      setTimeout(() => setLiveMessage(""), 3000);
    } catch {
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
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'currentColor' }} aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0D0D0F' }}
      aria-label="Invite family members"
    >
      {/* Skip to main content link - WCAG 2.1 AA */}
      <a 
        href="#invite-main" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2D5A4A] focus:text-[#FDF8F3] focus:outline-none focus:ring-2 focus:ring-[#2D5A4A] focus:ring-offset-2 focus:ring-offset-[#0D0D0F] rounded-lg"
      >
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push("/onboarding/create-family")}
        className="absolute top-4 left-4 flex items-center gap-2 transition-colors"
        style={{ color: 'currentColor', minWidth: "44px", minHeight: "44px" }}
        aria-label="Go back"
        data-testid="auth-back"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only sm:text-sm">Back</span>
      </button>

      <div id="invite-main" className="w-full max-w-md mx-auto" role="main">
        <ProgressDots currentStep={3} />

        {/* Header */}
        <div className="text-center mb-6">
          {/* People icon */}
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)' }}
            role="img"
            aria-label="People icon"
            data-testid="auth-invite-icon"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          
          <h1 
            className="font-heading text-3xl sm:text-4xl font-bold mb-2 leading-tight"
            style={{ color: '#E8E8EC' }}
            data-testid="auth-invite-heading-1"
          >
            Almost there!
          </h1>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: '#E8E8EC' }}
            data-testid="auth-invite-heading-2"
          >
            Invite someone special
          </h2>
          <h2 
            className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: 'currentColor' }}
            data-testid="auth-invite-heading-3"
          >
            to your channel
          </h2>
        </div>

        <p 
          className="text-base text-center mb-8"
          style={{ color: 'currentColor' }}
          data-testid="auth-invite-description"
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
                color: 'currentColor'
              }}
              data-testid="auth-copy-invite-loading"
              aria-busy="true"
            >
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>Creating invite...</span>
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
              aria-label={copied ? "Invite link copied!" : "Copy invite link to clipboard"}
              data-testid="auth-copy-invite-btn"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" aria-hidden="true" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" aria-hidden="true" />
                  <span>Copy invite link</span>
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
                color: 'currentColor'
              }}
              data-testid="auth-copy-invite-error"
              aria-disabled="true"
            >
              Could not create invite
            </button>
          )}

          {copyError && inviteLink && (
            <div 
              className="text-sm text-center"
              style={{ color: 'currentColor' }}
              role="alert"
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
                aria-label="Invite link - click to select"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6" role="separator" aria-orientation="horizontal">
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
        <form onSubmit={handleSendEmail} className="space-y-3" aria-label="Send email invite form">
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
              aria-required="true"
              className="w-full rounded-lg px-4 text-base transition-colors focus:outline-none focus:ring-2 border-0"
              style={{ 
                height: "52px", 
                backgroundColor: '#1A1A1E',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#E8E8EC',
              }}
              data-testid="auth-invite-email-input"
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
              color: 'currentColor'
            }}
            aria-disabled={!email || emailLoading || !inviteLink}
            data-testid="auth-send-invite-btn"
          >
            {emailLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <span>Send invite</span>
                <Mail className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Email sent confirmation */}
        {emailSent && (
          <p 
            className="text-sm font-medium text-center mt-3"
            style={{ color: '#2ECC71' }}
            role="status"
            aria-live="polite"
            data-testid="auth-email-sent-confirmation"
          >
            Invite sent to {emailSent} ✓
          </p>
        )}

        {/* Skip */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSkip}
            className="font-medium hover:underline"
            style={{ fontSize: "16px", color: 'currentColor' }}
            data-testid="auth-skip-invite"
          >
            Skip for now <span aria-hidden="true">→</span>
            <span className="sr-only">and go to your family channel</span>
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
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'currentColor' }} aria-hidden="true" />
      <span className="sr-only">Loading...</span>
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
