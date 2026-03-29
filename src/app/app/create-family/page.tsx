"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateFamilyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create family");
      }

      const { familyId } = await res.json();
      router.push(`/app/family/${familyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          Name your family
        </h1>
        <p className="text-muted-foreground">
          This is the name your family will see — you can always change it later.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="family-name">Family name</Label>
              <Input
                id="family-name"
                placeholder="The Smiths, The Conway Family..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                className="text-base h-12"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right">
                {name.length}/50
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full text-base h-12"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create family"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        As the creator, you&apos;ll be the owner. You can invite family members after
        creating the group.
      </p>
    </div>
  );
}
