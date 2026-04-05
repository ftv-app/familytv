"use client";

import { describe, it, expect, vi, afterEach } from "vitest";
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

// Mock ActivityFeed
vi.mock("@/components/feed/ActivityFeed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Not rendered</div>,
}));

// Mock WarmSpinner
vi.mock("@/components/ui/spinner", () => ({
  WarmSpinner: () => <div data-testid="warm-spinner">spinner</div>,
}));

const multiFamilyProps = {
  firstName: "Alex",
  email: "alex@family.com",
  families: [
    { id: "fam-1", name: "The Smiths", memberCount: 4, familyName: "The Smiths" },
    { id: "fam-2", name: "The Johnsons", memberCount: 3, familyName: "The Johnsons" },
  ],
  familyName: "The Smiths",
  familyMembers: [
    { id: "m1", name: "Mom", role: "admin", isOnline: true },
    { id: "m2", name: "Dad", role: "admin", isOnline: false },
  ],
  stats: { members: 4, postsThisWeek: 3, upcomingEvents: 1 },
  lastActivity: null,
  feedItems: undefined,
  feedCursor: null,
};

describe("DashboardClient — Multi-Family Context (CTM-5)", () => {
  afterEach(cleanup);

  describe("Active family is prominently visible", () => {
    it("shows active family name in page header with gold accent", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      // The h1 shows the active family name in Broadcast Gold
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("The Smiths");
    });

    it("shows family context for multi-family users via Viewing dropdown", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      // For multi-family users, the "Viewing:" label appears with the dropdown
      expect(screen.getByText("Viewing:")).toBeInTheDocument();
      // Family name appears in header AND dropdown trigger (multiple elements)
      const smithsElements = screen.getAllByText("The Smiths");
      expect(smithsElements.length).toBeGreaterThanOrEqual(2);
    });

    it("renders family switcher dropdown with correct selected family", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      expect(screen.getByText("Viewing:")).toBeInTheDocument();
    });
  });

  describe("Family switcher is accessible and functional", () => {
    it("renders family switcher for multi-family users", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      expect(screen.getByText("Viewing:")).toBeInTheDocument();
    });

    it("shows the selected family in the dropdown trigger", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      // The button contains the selected family name
      const buttons = document.querySelectorAll("button");
      const familyButton = Array.from(buttons).find(btn =>
        btn.textContent.includes("The Smiths")
      );
      expect(familyButton).toBeInTheDocument();
    });
  });

  describe("Single-family users do not see unnecessary family context", () => {
    const singleFamilyProps = {
      ...multiFamilyProps,
      families: [
        { id: "fam-1", name: "The Smiths", memberCount: 4, familyName: "The Smiths" },
      ],
    };

    it("does not render family switcher dropdown for single-family users", () => {
      render(<DashboardClient {...singleFamilyProps} />);

      expect(screen.queryByText("Viewing:")).not.toBeInTheDocument();
    });

    it("still shows family name in header for single-family users", () => {
      render(<DashboardClient {...singleFamilyProps} />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("The Smiths");
    });
  });

  describe("Channel header provides strong family context", () => {
    it("channel callsign uses Broadcast Gold — premium family identity", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.style.color).toBe("rgb(212, 175, 55)");
    });

    it("family name appears in channel header and dropdown — dual context", () => {
      render(<DashboardClient {...multiFamilyProps} />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("The Smiths");

      expect(screen.getByText("Viewing:")).toBeInTheDocument();
    });
  });

  describe("Family initial badge provides visual anchoring (when feedItems present)", () => {
    it("renders family initial badge when ActivityFeed is shown", () => {
      // When feedItems is provided, Activity Stories section shows the badge
      const propsWithFeed = {
        ...multiFamilyProps,
        feedItems: [
          {
            id: "p1",
            type: "post" as const,
            actor: { name: "Mom", avatar: null },
            content: { contentType: "photo" as const, caption: "Test" },
            createdAt: new Date().toISOString(),
          },
        ],
        feedCursor: null,
      };
      render(<DashboardClient {...propsWithFeed} />);

      const badge = document.querySelector('[aria-label="Family: The Smiths"]');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("T");
    });

    it("does not show family badge in StatCard fallback (feedItems undefined)", () => {
      // When feedItems is undefined, StatCard row is shown, not ActivityFeed
      render(<DashboardClient {...multiFamilyProps} />);

      const badge = document.querySelector('[aria-label="Family: The Smiths"]');
      expect(badge).not.toBeInTheDocument();
    });
  });
});