"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Play,
  Clock,
} from "lucide-react";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
import type { ActivityItem } from "@/components/feed/ActivityFeed";
import { WarmSpinner } from "@/components/ui/spinner";

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
}

export interface Family {
  id: string;
  name: string;
  memberCount: number;
  familyName?: string;
}

export interface DashboardStats {
  members: number;
  postsThisWeek: number;
  upcomingEvents: number;
}

export interface LastActivity {
  authorName: string;
  timeAgo: string;
  contentType: string;
}

interface DashboardClientProps {
  firstName: string;
  email: string;
  families: Family[];
  familyName?: string;
  familyMembers?: FamilyMember[];
  stats?: DashboardStats;
  lastActivity?: LastActivity | null;
  feedItems?: ActivityItem[];
  feedCursor?: string | null;
}

// ─── Cinema Black Design Tokens ───────────────────────────────────────────────
const CINE_BLACK = "#0D0D0F";
const THEATER_CHARCOAL = "#1A1A1E";
const SHADOW_GRAY = "#252529";
const BROADCAST_GOLD = "#D4AF37";
const FOREST_GREEN = "#2D5A4A";
const FOREST_GREEN_HOVER = "#3D7A64";
const CREAM = "#FDF8F3";
const SILVER_WHITE = "#E8E8EC";
const MUTED_SILVER = "#A8A8B0";

// ─── Stat Card (Family Warmth) ───────────────────────────────────────────────
// Design brief: warm, rounded, family-contextual — not enterprise analytics
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
    <div
      className="flex-1 min-w-[140px] rounded-2xl overflow-hidden"
      style={{
        backgroundColor: THEATER_CHARCOAL,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.06)",
      }}
    >
      <CardContent className="p-5 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 min-w-[48px] min-h-[48px]"
          style={{ backgroundColor: "rgba(212,175,55,0.15)" }}
        >
          <Icon className="w-5 h-5" style={{ color: BROADCAST_GOLD }} />
        </div>
        <div className="min-w-0">
          <p
            className="text-3xl font-bold"
            style={{ color: CREAM, fontFamily: "var(--font-heading, inherit)" }}
          >
            {value}
          </p>
          <p className="text-base font-medium mt-0.5" style={{ color: SILVER_WHITE }}>
            {label}
          </p>
          {sublabel && (
            <p className="text-sm mt-0.5" style={{ color: "rgba(168,168,176,0.7)" }}>
              {sublabel}
            </p>
          )}
        </div>
      </CardContent>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickActionButton({
  href,
  icon: Icon,
  label,
  description,
  testId,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  testId?: string;
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  // App Router: use pathname as proxy for navigation state
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const handleClick = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isNavigating}
      data-testid={testId}
      aria-busy={isNavigating}
      className="block w-full rounded-xl transition-all duration-200 min-h-[60px] text-left focus-visible:outline-2 focus-visible:outline-[#2D5A3D] focus-visible:outline-offset-2"
      style={{
        backgroundColor: THEATER_CHARCOAL,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.04)",
        cursor: isNavigating ? "not-allowed" : "pointer",
        opacity: isNavigating ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-2 w-full p-4">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(212,175,55,0.12)" }}
        >
          {isNavigating ? (
            <WarmSpinner size="sm" />
          ) : (
            <Icon className="w-4 h-4" style={{ color: BROADCAST_GOLD }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium block" style={{ color: SILVER_WHITE }}>
            {label}
          </span>
          <span className="text-base" style={{ color: MUTED_SILVER }}>
            {description}
          </span>
        </div>
        {isNavigating ? (
          <WarmSpinner size="sm" />
        ) : (
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: MUTED_SILVER }} />
        )}
      </div>
    </button>
  );
}

// ─── Presence Dot ─────────────────────────────────────────────────────────────
function PresenceDot({ name, isOnline }: { name: string; isOnline: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: SHADOW_GRAY, color: SILVER_WHITE }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: isOnline ? "#22C55E" : "#4B5563",
            borderColor: THEATER_CHARCOAL,
          }}
        />
      </div>
      <span className="text-sm" style={{ color: SILVER_WHITE }}>
        {name}
      </span>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export function DashboardClient({
  firstName,
  email,
  families,
  familyName,
  familyMembers = [],
  stats,
  lastActivity,
  feedItems,
  feedCursor,
}: DashboardClientProps) {
  const [selectedFamilyId, setSelectedFamilyId] = useState(
    families.length > 0 ? families[0].id : null
  );
  const selectedFamily = families.find((f) => f.id === selectedFamilyId) ?? null;
  const hasMultipleFamilies = families.length > 1;

  // The "channel callsign" — the family name, prominent and gold
  const channelName = familyName || selectedFamily?.familyName || selectedFamily?.name || "Your Family";

  // Stats from server (real DB data)
  const displayStats = stats ?? {
    members: selectedFamily?.memberCount ?? 0,
    postsThisWeek: 0,
    upcomingEvents: 0,
  };

  return (
    <div className="space-y-10">
      {/* ── Family TV Channel Header ───────────────────────────────────────── */}
      <div className="text-center space-y-2">
        {/* Broadcast Gold channel callsign with cinematic glow */}
        <h1
          className="font-heading text-4xl sm:text-5xl font-bold tracking-tight"
          style={{
            color: BROADCAST_GOLD,
            textShadow: "0 0 24px rgba(212,175,55,0.5), 0 0 48px rgba(212,175,55,0.25)",
            letterSpacing: "0.02em",
          }}
        >
          {channelName}
        </h1>
        <p
          className="text-sm uppercase tracking-widest"
          style={{ color: `${MUTED_SILVER}99` }}
        >
          Family Channel
        </p>
      </div>

      {/* ── Welcome Message ────────────────────────────────────────────────── */}
      <div className="text-center">
        <p
          className="text-xl sm:text-2xl font-light"
          style={{ color: SILVER_WHITE, fontFamily: "var(--font-heading, inherit)" }}
        >
          Welcome back,{" "}
          <span className="font-semibold" style={{ color: CREAM }}>
            {firstName}
          </span>
        </p>
        <p className="text-base mt-1" style={{ color: MUTED_SILVER }}>
          Here&apos;s what&apos;s playing on your family channel.
        </p>
      </div>

      {/* ── HERO: Share a Moment ───────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Link
          href={
            selectedFamily
              ? `/app/family/${selectedFamily.id}`
              : "/app/create-family"
          }
          className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{
            backgroundColor: FOREST_GREEN,
            color: CREAM,
            boxShadow: "0 8px 32px rgba(45,90,74,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Subtle pulse ring */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              boxShadow: `0 0 0 0 rgba(45,90,74,0.4)`,
              animation: "sharePulse 2s ease-out infinite",
            }}
          />
          <Play
            className="w-6 h-6"
            style={{ fill: CREAM, color: CREAM }}
          />
          Share a moment
        </Link>
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────────── */}
      {lastActivity ? (
        <div
          className="rounded-xl p-5 text-center"
          style={{
            backgroundColor: THEATER_CHARCOAL,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: BROADCAST_GOLD }} />
            <span className="text-sm uppercase tracking-wider" style={{ color: MUTED_SILVER }}>
              Last broadcast
            </span>
          </div>
          <p className="text-base" style={{ color: SILVER_WHITE }}>
            <span className="font-medium" style={{ color: CREAM }}>
              {lastActivity.authorName}
            </span>{" "}
            <span style={{ color: MUTED_SILVER }}>shared a</span>{" "}
            <span className="font-medium lowercase" style={{ color: BROADCAST_GOLD }}>
              {lastActivity.contentType}
            </span>
          </p>
          <p className="text-sm mt-1" style={{ color: MUTED_SILVER }}>
            {lastActivity.timeAgo}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl p-5 text-center"
          style={{
            backgroundColor: THEATER_CHARCOAL,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <p className="text-base" style={{ color: MUTED_SILVER }}>
            No moments shared yet. Be the first to share something!
          </p>
        </div>
      )}

      <Separator style={{ borderColor: "rgba(255,255,255,0.06)" }} />

      {/* ── Activity Stories Feed ───────────────────────────────────────────── */}
      {feedItems !== undefined ? (
        <div>
          {/* Stats Row: family initial avatar for multi-family anchoring (CTM-5) */}
          <div className="flex items-center gap-3 mb-4">
            <h2
              className="font-heading text-lg font-semibold"
              style={{ color: SILVER_WHITE }}
            >
              Activity Stories
            </h2>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ backgroundColor: "rgba(212,175,55,0.15)", color: BROADCAST_GOLD }}
              aria-label={`Family: ${channelName}`}
            >
              {channelName.charAt(0).toUpperCase()}
            </div>
          </div>
          {selectedFamily && (
            <ActivityFeed
              familyId={selectedFamily.id}
              initialItems={feedItems}
              initialCursor={feedCursor ?? null}
              familyName={familyName}
            />
          )}
        </div>
      ) : (
        /* ── Stats Row (fallback when no feedItems) ──────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Family members"
            value={displayStats.members}
            sublabel="In your circle"
          />
          <StatCard
            icon={Image}
            label="Posts this week"
            value={displayStats.postsThisWeek}
            sublabel="Shared moments"
          />
          <StatCard
            icon={Calendar}
            label="Upcoming events"
            value={displayStats.upcomingEvents}
            sublabel="On the calendar"
          />
        </div>
      )}

      <Separator style={{ borderColor: "rgba(255,255,255,0.06)" }} />

      {/* ── Family Members Presence ────────────────────────────────────────── */}
      {familyMembers.length > 0 && (
        <>
          <div>
            <h2
              className="font-heading text-lg font-semibold mb-4"
              style={{ color: SILVER_WHITE }}
            >
              Family members
            </h2>
            <div
              className="rounded-xl p-4 flex flex-wrap gap-4"
              style={{
                backgroundColor: THEATER_CHARCOAL,
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              {familyMembers.slice(0, 8).map((member) => (
                <PresenceDot
                  key={member.id}
                  name={member.name}
                  isOnline={member.isOnline ?? false}
                />
              ))}
              {familyMembers.length > 8 && (
                <div className="flex items-center">
                  <span className="text-sm" style={{ color: MUTED_SILVER }}>
                    +{familyMembers.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </div>
          <Separator style={{ borderColor: "rgba(255,255,255,0.06)" }} />
        </>
      )}

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <div>
        <h2
          className="font-heading text-lg font-semibold mb-4"
          style={{ color: SILVER_WHITE }}
        >
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}/events`
                : "/app/create-family"
            }
            icon={Calendar}
            label="Add an event"
            description="Birthday, gathering, trip"
            testId="quick-action-add-event"
          />
          <QuickActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}/invite`
                : "/app/create-family"
            }
            icon={Users}
            label="Invite a member"
            description="Share a link with family"
            testId="quick-action-invite-member"
          />
          <QuickActionButton
            href={
              selectedFamily
                ? `/app/family/${selectedFamily.id}`
                : "/app/create-family"
            }
            icon={Image}
            label="View feed"
            description="Recent photos and videos"
            testId="quick-action-view-feed"
          />
        </div>
      </div>

      {/* ── Family Selector (when multiple families) ───────────────────────── */}
      {hasMultipleFamilies && (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="text-sm" style={{ color: MUTED_SILVER }}>
            Viewing:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="outline"
                className="gap-2"
                style={{
                  backgroundColor: THEATER_CHARCOAL,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: SILVER_WHITE,
                }}
              >
                <Home className="w-4 h-4" style={{ color: BROADCAST_GOLD }} />
                <span className="font-medium">
                  {selectedFamily?.name ?? "Select family"}
                </span>
                <ChevronDown className="w-4 h-4" style={{ color: MUTED_SILVER }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{ backgroundColor: THEATER_CHARCOAL, borderColor: "rgba(255,255,255,0.08)" }}
            >
              {families.map((fam) => (
                <DropdownMenuItem
                  key={fam.id}
                  className="gap-2 cursor-pointer"
                  style={{ color: SILVER_WHITE }}
                  onClick={() => setSelectedFamilyId(fam.id)}
                >
                  <Home className="w-4 h-4" style={{ color: MUTED_SILVER }} />
                  {fam.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator style={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                style={{ color: FOREST_GREEN_HOVER }}
                onSelect={() => {
                  window.location.href = "/app/create-family";
                }}
              >
                <Plus className="w-4 h-4" />
                Create new family
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── No Family CTA ──────────────────────────────────────────────────── */}
      {families.length === 0 && (
        <Card
          className="border-dashed border-2"
          style={{
            backgroundColor: THEATER_CHARCOAL,
            borderColor: "rgba(255,255,255,0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <CardHeader>
            <CardTitle
              className="font-heading"
              style={{ color: SILVER_WHITE }}
            >
              No family yet
            </CardTitle>
            <CardDescription style={{ color: MUTED_SILVER }}>
              Create your first family group to start sharing moments with the
              people you love.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/create-family" className="inline-flex">
              <Button
                className="gap-2"
                style={{
                  backgroundColor: FOREST_GREEN,
                  color: CREAM,
                }}
              >
                <Plus className="w-4 h-4" />
                Create your family
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Signed-in context ──────────────────────────────────────────────── */}
      <p className="text-sm text-center" style={{ color: `${MUTED_SILVER}66` }}>
        Signed in as {email}
      </p>

      {/* ── Pulse animation keyframe (injected via style tag) ───────────────── */}
      <style>{`
        @keyframes sharePulse {
          0% { box-shadow: 0 0 0 0 rgba(45,90,74,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(45,90,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(45,90,74,0); }
        }
      `}</style>
    </div>
  );
}
