"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

interface Invite {
  id: string;
  code?: string; // client-side only, not from API
  expiresAt: string;
  createdAt: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
}

export default function FamilyInvitesPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/families/${familyId}/invites`);
      if (!res.ok) throw new Error("Failed to fetch invites");
      const data = await res.json();
      setInvites(data.invites || []);
    } catch {
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Also fetch family name
  useEffect(() => {
    if (!familyId || !userId) return;

    async function fetchFamily() {
      try {
        const res = await fetch("/api/family");
        const data = await res.json();
        const family = data.families?.find((f: { id: string }) => f.id === familyId);
        if (family) setFamilyName(family.name);
      } catch {
        // ignore
      }
    }

    fetchFamily();
    fetchInvites();
  }, [familyId, userId, authLoaded, fetchInvites]);

  async function generateInvite() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/families/${familyId}/invites`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate invite");
        return;
      }

      // Add new invite to list with the plain-text code
      const newInvite: Invite = {
        id: data.id || `temp-${Date.now()}`,
        code: data.inviteId,
        expiresAt: data.expiresAt,
        createdAt: new Date().toISOString(),
        email: "",
        status: "pending",
      };
      setInvites((prev) => [newInvite, ...prev]);
      setNewCode(data.code);
      toast.success("Invite link generated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setRevoking(inviteId);
    try {
      const res = await fetch(`/api/families/${familyId}/invites?inviteId=${inviteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to revoke invite");
        return;
      }

      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === inviteId ? { ...inv, status: "revoked" as const } : inv
        )
      );
      toast.success("Invite revoked");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRevoking(null);
    }
  }

  function copyInviteLink(code: string) {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(code);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (!authLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const pastInvites = invites.filter((i) => i.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href={`/family/${familyId}/settings`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">Manage Invites</h1>
            {familyName && (
              <p className="text-sm text-muted-foreground">{familyName}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* New invite dialog */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Invite members</CardTitle>
            <CardDescription>
              Generate an invite link to share with family members. The link expires in 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger
                onClick={generateInvite}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Generate invite link
                  </>
                )}
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New invite link created!</DialogTitle>
                  <DialogDescription>
                    Share this link with the family member you want to invite. It expires in 7 days.
                  </DialogDescription>
                </DialogHeader>

                {newCode && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${newCode}`}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(newCode)}
                      >
                        {copiedId === newCode ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button onClick={() => setNewCode(null)}>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Active invites */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg">Active invites</CardTitle>
                <CardDescription>
                  {pendingInvites.length === 0
                    ? "No active invites. Generate one above."
                    : `${pendingInvites.length} invite${pendingInvites.length !== 1 ? "s" : ""} waiting`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <svg
                  className="w-10 h-10 mx-auto mb-3 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">No active invites right now.</p>
                <p className="text-xs mt-1">Generate an invite link above to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invite link</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-[120px] truncate block">
                              {invite.id.slice(0, 8)}…
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => copyInviteLink(invite.id)}
                            >
                              {copiedId === invite.id ? (
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8"
                            disabled={revoking === invite.id}
                            onClick={() => revokeInvite(invite.id)}
                          >
                            {revoking === invite.id ? "Revoking…" : "Revoke"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past invites */}
        {pastInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Past invites</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invite</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastInvites.map((invite) => (
                    <TableRow key={invite.id} className="opacity-60">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {invite.id.slice(0, 8)}…
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invite.status === "accepted" ? "default" : "secondary"}
                          className={invite.status === "revoked" ? "bg-orange-100 text-orange-700" : ""}
                        >
                          {invite.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
