"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/app/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock ActivityFeed — not used in stat-card mode
vi.mock("@/components/feed/ActivityFeed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Not rendered</div>,
}));

const defaultProps = {
  firstName: "Alex",
  email: "alex@family.com",
  families: [
    { id: "fam-1", name: "The Smiths", memberCount: 4, familyName: "The Smiths" },
  ],
  familyName: "The Smiths",
  familyMembers: [
    { id: "m1", name: "Mom", role: "admin", isOnline: true },
    { id: "m2", name: "Dad", role: "admin", isOnline: false },
    { id: "m3", name: "Alex", role: "member", isOnline: true },
  ],
  stats: { members: 4, postsThisWeek: 3, upcomingEvents: 1 },
  lastActivity: null,
  feedItems: undefined,
  feedCursor: null,
};

describe("DashboardClient — StatCard Warmth (CTM-10)", () => {
  afterEach(cleanup);

  describe("StatCard renders with family warmth tokens", () => {
    it("renders StatCard row with 3 stat cards when feedItems is undefined", () => {
      render(<DashboardClient {...defaultProps} />);

      // Use getAllByText for labels that appear in each card
      const membersLabels = screen.getAllByText("Family members");
      expect(membersLabels.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText("Posts this week")).toBeInTheDocument();
      expect(screen.getByText("Upcoming events")).toBeInTheDocument();
    });

    it("shows warm sublabels for family context", () => {
      render(<DashboardClient {...defaultProps} />);

      // Sublabels use warm family language
      expect(screen.getByText("In your circle")).toBeInTheDocument();
      expect(screen.getByText("Shared moments")).toBeInTheDocument();
      expect(screen.getByText("On the calendar")).toBeInTheDocument();
    });

    it("StatCard values render as numbers in the value element", () => {
      render(<DashboardClient {...defaultProps} />);

      // Values are rendered in text-3xl font-bold style (upgraded from text-2xl)
      const valueElements = document.querySelectorAll('.text-3xl.font-bold');
      // We have 3 stat values: 4, 3, 1
      expect(valueElements.length).toBeGreaterThanOrEqual(3);
    });

    it("StatCard labels are visible", () => {
      render(<DashboardClient {...defaultProps} />);

      // Each stat card has its own label text
      const postsLabels = screen.getAllByText("Posts this week");
      expect(postsLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("StatCard visual warmth — rounded corners, warm label colors", () => {
    it("StatCard containers have rounded corners via Tailwind rounded-xl", () => {
      const { container } = render(<DashboardClient {...defaultProps} />);
      const statContainers = container.querySelectorAll(".rounded-xl");
      expect(statContainers.length).toBeGreaterThan(0);
    });

    it("warm sublabel text uses family warmth language", () => {
      render(<DashboardClient {...defaultProps} />);
      const sublabel = screen.getByText("In your circle");
      expect(sublabel).toBeInTheDocument();
    });
  });

  describe("StatCard family-contextual labels", () => {
    it("members stat uses warm family language — 'In your circle' not cold enterprise label", () => {
      render(<DashboardClient {...defaultProps} />);
      expect(screen.getByText("In your circle")).toBeInTheDocument();
      // Should NOT use cold enterprise labels like "Total members"
      expect(screen.queryByText("Total members")).not.toBeInTheDocument();
    });

    it("posts stat uses warm language — 'Shared moments'", () => {
      render(<DashboardClient {...defaultProps} />);
      expect(screen.getByText("Shared moments")).toBeInTheDocument();
    });

    it("events stat uses warm language — 'On the calendar'", () => {
      render(<DashboardClient {...defaultProps} />);
      expect(screen.getByText("On the calendar")).toBeInTheDocument();
    });
  });

  describe("StatCard does NOT look like enterprise analytics", () => {
    it("does not render with clinical cold metrics labels", () => {
      render(<DashboardClient {...defaultProps} />);
      // Enterprise analytics would say "Total Users" or "DAU" or "MAU"
      expect(screen.queryByText("Total users")).not.toBeInTheDocument();
      expect(screen.queryByText("DAU")).not.toBeInTheDocument();
      expect(screen.queryByText("MAU")).not.toBeInTheDocument();
    });

    it("sublabels provide family context not cold data labels", () => {
      render(<DashboardClient {...defaultProps} />);
      // Family context labels vs. analytics speak
      expect(screen.queryByText("Active sessions")).not.toBeInTheDocument();
      expect(screen.queryByText("Retention")).not.toBeInTheDocument();
    });
  });
});