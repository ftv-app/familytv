"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteInfo {
  family: {
    id: string;
    name: string;
  };
  email: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invite?inviteId=${encodeURIComponent(inviteId)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid invite link");
        } else {
          setInvite(data);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [inviteId]);

  async function handleAccept() {
    setAccepting(true);
    setError("");

    try {
      const res = await fetch("/api/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        setAccepting(false);
        return;
      }

      router.push("/app/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background" aria-label="Loading invite">
        <a href="#invite-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Skip to main content
        </a>
        <div id="invite-main" className="text-center space-y-4" role="status">
          <div className="w-10 h-10 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground text-base">Loading invite...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4" aria-label="Invite error">
        <a href="#invite-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Skip to main content
        </a>
        <Card className="max-w-md w-full" id="invite-main">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3" role="img" aria-label="Worried face emoji">😕</div>
            <CardTitle className="font-heading text-xl">Invite not available</CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-base text-muted-foreground">
              This invite link may have expired or already been used.
            </p>
            <Link href="/sign-up" className="block">
              <Button className="w-full min-h-[48px] text-base" data-testid="invite-signup-cta">Sign up to get started</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4" aria-label="Accept family invite">
      <a href="#invite-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        Skip to main content
      </a>
      <Card className="max-w-md w-full" id="invite-main">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4" role="img" aria-label="Waving hand emoji">👋</div>
          <CardTitle className="font-heading text-2xl">You&apos;re invited!</CardTitle>
          <CardDescription className="text-base">
            You&apos;ve been invited to join{" "}
            <span className="font-semibold text-foreground">{invite?.family.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-base text-muted-foreground mb-1">Invited email</p>
            <p className="text-base font-medium text-foreground">{invite?.email}</p>
          </div>

          {error && (
            <p className="text-base text-destructive text-center" role="alert" aria-live="assertive">{error}</p>
          )}

          <div className="space-y-3">
            <Button
              className="w-full text-base min-h-[48px]"
              onClick={handleAccept}
              disabled={accepting}
              aria-busy={accepting}
              data-testid="invite-accept-btn"
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" aria-hidden="true" />
                  Accepting...
                </>
              ) : (
                "Accept Invite"
              )}
            </Button>
            <Link href="/sign-up" className="block">
              <Button variant="outline" className="w-full min-h-[48px] text-base" data-testid="invite-signup-alt-btn">
                Sign up with a different account
              </Button>
            </Link>
          </div>

          <p className="text-base text-muted-foreground text-center">
            By accepting, you&apos;ll be able to see photos, videos, and events shared with
            this family.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
