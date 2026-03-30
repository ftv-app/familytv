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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">😕</div>
            <CardTitle className="font-heading text-xl">Invite not available</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This invite link may have expired or already been used.
            </p>
            <Link href="/sign-up">
              <Button className="w-full">Sign up to get started</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <CardTitle className="font-heading text-2xl">You&apos;re invited!</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <span className="font-semibold text-foreground">{invite?.family.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Invited email</p>
            <p className="text-sm font-medium text-foreground">{invite?.email}</p>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="space-y-3">
            <Button
              className="w-full text-base h-12"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? "Accepting..." : "Accept Invite"}
            </Button>
            <Link href="/sign-up" className="block">
              <Button variant="outline" className="w-full">
                Sign up with a different account
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you&apos;ll be able to see photos, videos, and events shared with
            this family.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
