import { describe, it, expect } from "vitest";

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

describe("formatEventDate", () => {
  it("returns 'Today' for today all-day events", () => {
    const today = new Date();
    expect(formatEventDate(today, true)).toBe("Today");
  });

  it("returns 'Tomorrow' for tomorrow all-day events", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(formatEventDate(tomorrow, true)).toBe("Tomorrow");
  });

  it("returns date string for future events", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const result = formatEventDate(future, true);
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it("includes time for non-all-day events", () => {
    const today = new Date();
    const result = formatEventDate(today, false);
    expect(result).toContain("Today at");
  });
});

describe("getDaysUntil", () => {
  it("returns 0 for today", () => {
    const today = new Date();
    expect(getDaysUntil(today)).toBe(0);
  });

  it("returns 1 for tomorrow", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(getDaysUntil(tomorrow)).toBe(1);
  });

  it("returns negative for past dates", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(getDaysUntil(yesterday)).toBe(-1);
  });
});

describe("getEventEmoji", () => {
  it("returns cake for primary", () => {
    expect(getEventEmoji("primary")).toBe("🎂");
  });

  it("returns leaf for secondary", () => {
    expect(getEventEmoji("secondary")).toBe("🌿");
  });

  it("returns party for accent", () => {
    expect(getEventEmoji("accent")).toBe("🎉");
  });

  it("returns calendar for unknown/muted", () => {
    expect(getEventEmoji("muted")).toBe("📅");
    expect(getEventEmoji(undefined)).toBe("📅");
  });
});
