"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  Calendar,
  Users,
  Image,
  ArrowRight,
  Home,
} from "lucide-react";

interface Family {
  id: string;
  name: string;
  memberCount: number;
}

interface DashboardClientProps {
  firstName: string;
  email: string;
  families: Family[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-heading font-semibold text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground/70">{sublabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-2 w-full p-4">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-foreground block">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

export function DashboardClient({
  firstName,
  email,
  families,
}: DashboardClientProps) {
  const [selectedFamilyId, setSelectedFamilyId] = useState(
    families.length > 0 ? families[0].id : null
  );
  const selectedFamily = families.find((f) => f.id === selectedFamilyId) ?? null;
  const hasMultipleFamilies = families.length > 1;

  // Placeholder stats — wire up to real API when DB is ready
  const stats = {
    members: selectedFamily?.memberCount ?? 0,
    postsThisWeek: 3,
    upcomingEvents: 1,
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Good evening, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your family.
          </p>
        </div>

        {/* Family selector */}
        {hasMultipleFamilies ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="font-medium">
                  {selectedFamily?.name ?? "Select family"}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {families.map((fam) => (
                <DropdownMenuItem
                  key={fam.id}
                  className="gap-2 cursor-pointer"
                  onClick={() => setSelectedFamilyId(fam.id)}
                >
                  <Home className="w-4 h-4 text-muted-foreground" />
                  {fam.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onSelect={() => { window.location.href = "/app/create-family"; }}
              >
                <Plus className="w-4 h-4" />
                Create new family
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : selectedFamily ? (
          <Badge variant="secondary" className="text-sm px-3 py-1.5 gap-1.5">
            <Home className="w-3.5 h-3.5" />
            {selectedFamily.name}
          </Badge>
        ) : null}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Family members"
          value={stats.members}
          sublabel="Active in your circle"
        />
        <StatCard
          icon={Image}
          label="Posts this week"
          value={stats.postsThisWeek}
          sublabel="Shared moments"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming events"
          value={stats.upcomingEvents}
          sublabel="On the family calendar"
        />
      </div>

      <Separator />

      {/* Quick actions */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}`
                : "/app/create-family"
            }
            icon={Image}
            label="Share a moment"
            description="Post a photo or video"
          />
          <ActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}/events`
                : "/app/create-family"
            }
            icon={Calendar}
            label="Add an event"
            description="Birthday, gathering, trip"
          />
          <ActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}/invite`
                : "/app/create-family"
            }
            icon={Users}
            label="Invite a member"
            description="Share a link with family"
          />
        </div>
      </div>

      <Separator />

      {/* Family feed link */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Family feed
          </h2>
          <p className="text-sm text-muted-foreground">
            Recent photos, videos, and updates from your family.
          </p>
        </div>
        {selectedFamily && (
          <Link href={`/app/family/${selectedFamily.id}`} className="shrink-0">
            <Button className="gap-2">
              View feed
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* No family yet CTA */}
      {families.length === 0 && (
        <Card className="border-dashed border-2 border-border/60">
          <CardHeader>
            <CardTitle className="font-heading">No family yet</CardTitle>
            <CardDescription>
              Create your first family group to start sharing moments with the
              people you love.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/create-family" className="inline-flex">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create your family
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Signed-in context */}
      <p className="text-xs text-muted-foreground/60 text-center">
        Signed in as {email}
      </p>
    </div>
  );
}
