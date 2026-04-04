"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WarmEmptyState } from "@/components/warm-empty-state";

interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  allDay: boolean;
  createdBy: string;
  color?: "primary" | "secondary" | "accent" | "muted";
}

// Placeholder events — replace with API call when events table is ready
const PLACEHOLDER_EVENTS: FamilyEvent[] = [
  {
    id: "1",
    title: "Sarah's Birthday",
    description: "Don't forget the chocolate cake!",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    allDay: true,
    createdBy: "Mike",
    color: "primary",
  },
  {
    id: "2",
    title: "Family BBQ",
    description: "At grandma's place, 2pm. Bringing burgers.",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 60 * 5),
    allDay: false,
    createdBy: "Dad",
    color: "accent",
  },
  {
    id: "3",
    title: "Cousin Reunion",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    allDay: true,
    createdBy: "Emma",
    color: "secondary",
  },
  {
    id: "4",
    title: "Movie Night",
    description: "Picking a classic — bring snacks!",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    allDay: false,
    createdBy: "Kids",
    color: "muted",
  },
];

function formatEventDate(date: Date, allDay: boolean, endDate?: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) {
    if (allDay) return "Today";
    if (endDate) return `Today, ${timeStr} – ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    if (allDay) return "Tomorrow";
    return `Tomorrow at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (allDay) return dateStr;
  return `${dateStr} at ${timeStr}`;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getEventEmoji(color?: string): string {
  switch (color) {
    case "primary": return "🎂";
    case "secondary": return "🌿";
    case "accent": return "🎉";
    default: return "📅";
  }
}

interface EventCardProps {
  event: FamilyEvent;
}

function EventCard({ event }: EventCardProps) {
  const daysUntil = getDaysUntil(event.date);
  const isUrgent = daysUntil >= 0 && daysUntil <= 2;

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="text-2xl w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
        {getEventEmoji(event.color)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">
            {event.title}
          </p>
          {isUrgent && (
            <Badge variant={daysUntil === 0 ? "default" : "secondary"} className="shrink-0 text-xs">
              {daysUntil === 0 ? "Today" : "Tomorrow"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatEventDate(event.date, event.allDay, event.endDate)}
        </p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {event.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          Added by {event.createdBy}
        </p>
      </div>
    </div>
  );
}

interface UpcomingEventsProps {
  events: FamilyEvent[];
  maxItems?: number;
}

function UpcomingEvents({ events, maxItems }: UpcomingEventsProps) {
  const now = new Date();
  const upcoming = events
    .filter((e) => e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxItems);

  if (upcoming.length === 0) {
    return (
      <WarmEmptyState
        emoji="📅"
        title="No upcoming events"
        description="Add birthdays, gatherings, or trips so the whole family can see what&apos;s coming up."
        ctaLabel="Add first event"
        onCtaClick={() => {
          // Scroll to / focus the Add event button at the top of the calendar section
          const btn = document.querySelector('[data-calendar-add-event]') as HTMLButtonElement | null;
          btn?.scrollIntoView({ behavior: "smooth", block: "center" });
          btn?.focus();
        }}
      />
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {upcoming.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

interface FamilyCalendarProps {
  familyId: string;
  events?: FamilyEvent[];
}

export function FamilyCalendar({ familyId: _familyId, events: initialEvents }: FamilyCalendarProps) {
  const events = initialEvents ?? PLACEHOLDER_EVENTS;
  const now = new Date();
  const upcomingCount = events.filter((e) => e.date >= now).length;
  const todayCount = events.filter(
    (e) => e.date.toDateString() === now.toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="border-0"
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(45,90,74,0.3)",
            borderRadius: "8px",
          }}
        >
          <CardContent className="p-4 text-center">
            <p className="font-heading text-2xl font-semibold text-foreground">
              {upcomingCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upcoming event{upcomingCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-0"
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "8px",
          }}
        >
          <CardContent className="p-4 text-center">
            <p className="font-heading text-2xl font-semibold text-foreground">
              {todayCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Happening today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add event CTA */}
      <Button
        variant="outline"
        data-calendar-add-event
        className="w-full gap-2 min-h-[44px] transition-all duration-150 border-0"
        style={{
          backgroundColor: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#A8A8B0",
          borderRadius: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2D5A4A";
          e.currentTarget.style.borderColor = "#2D5A4A";
          e.currentTarget.style.color = "#FDF8F3";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,90,74,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "#A8A8B0";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add event
      </Button>

      <Separator />

      {/* Events list */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Coming up
        </h3>
        <UpcomingEvents events={events} />
      </div>
    </div>
  );
}

export type { FamilyEvent };
