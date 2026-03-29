import { describe, it, expect } from "vitest";

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

describe("formatRelativeTime", () => {
  it("returns 'Just now' for very recent dates", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinsAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("returns formatted date for older dates", () => {
    const oldDate = new Date("2026-01-15");
    const result = formatRelativeTime(oldDate);
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it("handles string dates", () => {
    const result = formatRelativeTime("2026-03-28T12:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getInitials", () => {
  it("returns initials from two-word name", () => {
    expect(getInitials("John Smith")).toBe("JS");
  });

  it("returns initials from single name", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("handles three-word names", () => {
    expect(getInitials("John Paul Smith")).toBe("JP");
  });

  it("returns uppercase", () => {
    expect(getInitials("john smith")).toBe("JS");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  John   Smith  ")).toBe("JS");
  });
});
