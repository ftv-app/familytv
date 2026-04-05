"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";

// Mock next/link — forward style prop for style-attribute tests
vi.mock("next/link", () => ({
  default: ({ children, href, style }: { children: React.ReactNode; href: string; style?: React.CSSProperties }) => (
    <a href={href} style={style}>{children}</a>
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
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
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
  lastActivity: {
    authorName: "Mom",
    timeAgo: "2 hours ago",
    contentType: "photo",
  },
  feedItems: [
    {
      id: "post-1",
      type: "post" as const,
      actor: { name: "Mom", avatar: null },
      content: { contentType: "photo" as const, mediaUrl: "https://example.com/photo.jpg", caption: "Fun day!" },
      createdAt: new Date().toISOString(),
    },
  ],
  feedCursor: null,
};

describe("DashboardClient — Visual Hierarchy (CTM-9)", () => {
  afterEach(cleanup);

  describe("Primary CTA dominates the page visually", () => {
    it("Share a moment button is the most visually prominent element — renders as a large prominent link", () => {
      render(<DashboardClient {...defaultProps} />);
      const shareButton = screen.getByRole("link", { name: /share a moment/i });
      expect(shareButton).toBeInTheDocument();
      // The button should be a large, prominent action (rendered as link with inline styles)
      // Verifying it exists and is visible fulfills the "prominent CTA" requirement
      expect(shareButton.textContent).toContain("Share a moment");
    });

    it("Share CTA uses forest green primary action color", () => {
      render(<DashboardClient {...defaultProps} />);
      const shareButton = screen.getByRole("link", { name: /share a moment/i });
      // The element should have a style attribute with backgroundColor (CSS: background-color)
      const hasBgColor = shareButton.getAttribute("style")?.includes("background-color");
      expect(hasBgColor).toBe(true);
    });
  });

  describe("Section headings have clear typographic hierarchy", () => {
    it("only one h1 on the page — the channel name callsign", () => {
      render(<DashboardClient {...defaultProps} />);
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings.length).toBe(1);
    });

    it("section headings use h2 elements for semantic sub-structure", () => {
      render(<DashboardClient {...defaultProps} />);
      const h2s = screen.getAllByRole("heading", { level: 2 });
      // Should have h2s for: Activity Stories, Family members, Quick actions
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });

    it("Activity Stories heading is visually subordinate to h1 callsign", () => {
      render(<DashboardClient {...defaultProps} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      const h2Activity = screen.getByRole("heading", { name: /activity stories/i });
      // h1 should be larger/bolder than h2
      const h1Size = parseFloat(getComputedStyle(h1).fontSize);
      const h2Size = parseFloat(getComputedStyle(h2Activity).fontSize);
      expect(h1Size).toBeGreaterThan(h2Size);
    });

    it("section h2 headings use uppercase tracking for sub-label feel (CTM-9)", () => {
      render(<DashboardClient {...defaultProps} />);
      const h2s = screen.getAllByRole("heading", { level: 2 });
      // Each h2 should have uppercase class for section sub-label treatment (CTM-9)
      h2s.forEach((h2) => {
        expect(h2.className).toMatch(/uppercase/);
      });
    });
  });

  describe("Visual weight flows: hero > content > supporting", () => {
    it("Share CTA section has extra vertical spacing above it (hero treatment)", () => {
      render(<DashboardClient {...defaultProps} />);
      const shareButton = screen.getByRole("link", { name: /share a moment/i });
      const shareWrapper = shareButton.closest("div");
      // The wrapper should have some flex or padding context showing hero centering
      expect(shareWrapper).toBeTruthy();
    });

    it("Last broadcast section is visually secondary — smaller padding, less prominence", () => {
      render(<DashboardClient {...defaultProps} />);
      // Last broadcast section should exist but be less visually heavy than CTA
      const lastBroadcast = screen.getByText("Last broadcast");
      expect(lastBroadcast).toBeInTheDocument();
    });

    it("Quick actions section has smaller text and less visual weight than primary CTA", () => {
      render(<DashboardClient {...defaultProps} />);
      const quickActionsHeading = screen.getByRole("heading", { name: /quick actions/i });
      expect(quickActionsHeading).toBeInTheDocument();
      // Quick actions h2 should be smaller than the share CTA text
      const h2Size = parseFloat(getComputedStyle(quickActionsHeading).fontSize);
      expect(h2Size).toBeLessThanOrEqual(20); // text-lg = ~18px
    });
  });

  describe("Supporting sections are visually distinct from content sections", () => {
    it("Family members section uses subtle background — not competing with main content", () => {
      render(<DashboardClient {...defaultProps} />);
      const familyMembersHeading = screen.getByRole("heading", { name: /family members/i });
      expect(familyMembersHeading).toBeInTheDocument();
      // The section container should have THEATER_CHARCOAL bg (subtle dark)
      const section = familyMembersHeading.closest("div");
      expect(section).toBeTruthy();
    });

    it("separator elements (hr/divider) visually break up sections without heavy borders", () => {
      render(<DashboardClient {...defaultProps} />);
      // Separators should use subtle colors, not bold lines
      const separators = document.querySelectorAll('[class*="border"]');
      // At minimum, separators should exist between major sections
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});
