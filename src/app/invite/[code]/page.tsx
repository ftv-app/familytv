"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface InviteInfo {
  family: {
    id: string;
    name: string;
  };
  expiresAt: string;
}

type InviteState = "loading" | "valid" | "expired" | "revoked" | "already_used" | "invalid" | "already_member" | "joining" | "success";

export default function AcceptInvitePage() {
  const { code } = useParams<{ code: string }>();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [state, setState] = useState<InviteState>("loading");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) return;

    async function validateInvite() {
      try {
        const res = await fetch(`/api/families/invites/${code}`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 410) {
            if (data.error?.includes("revoked")) {
              setState("revoked");
            } else if (data.error?.includes("expired")) {
              setState("expired");
            } else {
              setState("already_used");
            }
          } else if (res.status === 404) {
            setState("invalid");
          } else {
            setState("invalid");
          }
          setErrorMsg(data.error || "Invite not found");
          return;
        }

        setInviteInfo(data);
        setState("valid");
      } catch {
        setState("invalid");
        setErrorMsg("Could not validate invite. Please try again.");
      }
    }

    validateInvite();
  }, [code]);

  async function handleJoin() {
    if (!isSignedIn) {
      // Redirect to sign-in with invite code in redirect URL
      router.push(`/sign-in?redirect=/invite/${code}`);
      return;
    }

    setState("joining");

    try {
      const res = await fetch(`/api/families/invites/${code}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/sign-in?redirect=/invite/${code}`);
          return;
        }
        if (data.error?.includes("already a member")) {
          setState("already_member");
        } else {
          toast.error(data.error || "Failed to join family");
          setState("valid");
        }
        return;
      }

      toast.success(`Welcome to ${data.family.name}!`);
      setState("success");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setState("valid");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">F</span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">FamilyTV</span>
          </Link>
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <CardTitle className="font-heading text-2xl">
              {state === "loading" && "Checking invite…"}
              {state === "valid" && inviteInfo && `You've been invited to ${inviteInfo.family.name}`}
              {state === "expired" && "Invite expired"}
              {state === "revoked" && "Invite revoked"}
              {state === "already_used" && "Invite already used"}
              {state === "invalid" && "Invalid invite"}
              {state === "already_member" && "Already a member"}
              {state === "joining" && "Joining family…"}
              {state === "success" && "You're in!"}
            </CardTitle>
            <CardDescription className="mt-2">
              {state === "loading" && "Please wait while we verify your invitation."}
              {state === "valid" && inviteInfo && (
                <>You can join as a member of {inviteInfo.family.name}.</>
              )}
              {state === "expired" && "This invite link has expired. Ask your family member to send a new invite."}
              {state === "revoked" && "This invite has been revoked by the family admin."}
              {state === "already_used" && "This invite has already been used."}
              {state === "invalid" && "This invite link is not valid. Check with your family member for the correct link."}
              {state === "already_member" && "You're already a member of this family. Go to your dashboard."}
              {state === "joining" && "Adding you to the family…"}
              {state === "success" && `You've joined ${inviteInfo?.family.name || "the family"}!`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {state === "valid" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Family</p>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {inviteInfo?.family.name}
                  </p>
                </div>
                {inviteInfo?.expiresAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    This invite expires{" "}
                    {new Date(inviteInfo.expiresAt) < new Date()
                      ? "in the past"
                      : `on ${new Date(inviteInfo.expiresAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}`}
                  </p>
                )}
                <Button
                  onClick={handleJoin}
                  className="w-full text-base"
                  size="lg"
                >
                  {isSignedIn ? "Join this family" : "Sign in to join"}
                </Button>
                {!isSignedIn && (
                  <p className="text-xs text-muted-foreground text-center">
                    You'll be redirected to sign in, then taken to join the family.
                  </p>
                )}
              </div>
            )}

            {(state === "expired" || state === "revoked" || state === "already_used" || state === "invalid" || state === "already_member") && (
              <div className="space-y-4">
                {errorMsg && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                    {errorMsg}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Go to FamilyTV home
                    </Button>
                  </Link>
                  {state === "already_member" && (
                    <Link href="/dashboard">
                      <Button className="w-full">Go to dashboard</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {state === "loading" && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {state === "joining" && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {state === "success" && (
              <div className="space-y-4">
                <div className="flex justify-center py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button className="w-full text-base" size="lg">
                    Go to dashboard
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
