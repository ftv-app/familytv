"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invite");
      }

      const { inviteLink: link } = await res.json();
      setInviteLink(link);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-8 sm:py-12 px-4">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">✉️</div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground">
                Invite sent!
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                We sent an invite to <strong>{email}</strong>
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-left">
              <p className="text-xs text-muted-foreground mb-1">
                Invite link (for testing)
              </p>
              <code className="text-xs break-all text-foreground">
                {inviteLink}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                In production, this link is sent via email automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
              >
                Send another
              </Button>
              <Link href={`/app/family/${familyId}`} className="flex-1">
                <Button className="w-full">Done</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 sm:py-12 px-4">
      <div className="mb-6">
        <Link
          href={`/app/family/${familyId}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-h-[44px] py-2"
        >
          ← Back to family
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-2">
          Invite family members
        </h1>
        <p className="text-muted-foreground">
          Enter their email address and we&apos;ll send them an invite.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleInvite} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="grandma@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base h-12"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full text-base h-12"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Invites expire after 7 days. You can revoke them at any time.
      </p>
    </div>
  );
}
