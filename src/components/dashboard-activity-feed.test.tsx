"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";
import type { ActivityItem } from "@/components/feed/ActivityFeed";

// Mock next/link to avoid router issues
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation for useRouter, usePathname, useSearchParams
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
const mockActivityFeed = vi.fn();
vi.mock("@/components/feed/ActivityFeed", () => ({
  ActivityFeed: (props: {
    familyId: string;
    initialItems?: ActivityItem[];
    initialCursor?: string | null;
    familyName?: string;
  }) => {
    mockActivityFeed(props);
    return (
      <div data-testid="activity-feed-mock" data-family-id={props.familyId}>
        <span data-testid="activity-feed-item-count">{props.initialItems?.length ?? 0}</span>
        {props.initialItems?.map((item) => (
          <div key={item.id} data-testid={`feed-item-${item.id}`}>
            {item.actor.name} - {item.type}
          </div>
        ))}
        {(!props.initialItems || props.initialItems.length === 0) && (
          <div data-testid="activity-feed-empty">No activity yet</div>
        )}
      </div>
    );
  },
}));

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "post-1",
    type: "post",
    actor: { name: "Mom", avatar: null },
    content: { contentType: "photo", caption: "Dinner at grandma's" },
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "event-1",
    type: "event",
    actor: { name: "Dad", avatar: null },
    content: {
      title: "Family BBQ",
      description: "Annual summer BBQ",
      startDate: new Date(Date.now() + 86400 * 1000).toISOString(),
      allDay: true,
    },
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
];

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
};

describe("DashboardClient — Activity Feed Integration", () => {
  beforeEach(() => {
    mockActivityFeed.mockClear();
  });

  afterEach(cleanup);

  it("renders ActivityFeed with feed items and correct item count", () => {
    render(
      <DashboardClient
        {...defaultProps}
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    expect(screen.getByTestId("activity-feed-mock")).toBeInTheDocument();
    expect(screen.getByTestId("activity-feed-item-count")).toHaveTextContent("2");
    expect(screen.getByTestId("feed-item-post-1")).toBeInTheDocument();
    expect(screen.getByTestId("feed-item-event-1")).toBeInTheDocument();
  });

  it("renders ActivityFeed with correct familyId prop", () => {
    render(
      <DashboardClient
        {...defaultProps}
        families={[{ id: "fam-xyz", name: "The Johnsons", memberCount: 3, familyName: "The Johnsons" }]}
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    expect(screen.getByTestId("activity-feed-mock")).toHaveAttribute("data-family-id", "fam-xyz");
    expect(mockActivityFeed).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: "fam-xyz" })
    );
  });

  it("renders warm empty state when no feedItems", () => {
    render(
      <DashboardClient
        {...defaultProps}
        feedItems={[]}
        feedCursor={null}
      />
    );

    expect(screen.getByTestId("activity-feed-mock")).toBeInTheDocument();
    expect(screen.getByTestId("activity-feed-empty")).toBeInTheDocument();
  });

  it("passes familyName to ActivityFeed", () => {
    render(
      <DashboardClient
        {...defaultProps}
        familyName="The Smiths"
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    expect(mockActivityFeed).toHaveBeenCalledWith(
      expect.objectContaining({ familyName: "The Smiths" })
    );
  });

  it("does not render StatCard containers when feedItems are provided", () => {
    // The StatCard grid had class "grid grid-cols-1 sm:grid-cols-3 gap-4"
    // After replacement with ActivityFeed, this grid should not exist
    render(
      <DashboardClient
        {...defaultProps}
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    // The stat cards had specific sublabel text — verify they don't appear
    // as the StatCard labels (In your circle, Shared moments, On the calendar)
    const inYourCircle = screen.queryByText("In your circle");
    const sharedMoments = screen.queryByText("Shared moments");
    const onTheCalendar = screen.queryByText("On the calendar");
    expect(inYourCircle).not.toBeInTheDocument();
    expect(sharedMoments).not.toBeInTheDocument();
    expect(onTheCalendar).not.toBeInTheDocument();
  });

  it("shows family members presence section with feed", () => {
    render(
      <DashboardClient
        {...defaultProps}
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    // Family members section heading
    expect(screen.getByRole("heading", { name: "Family members" })).toBeInTheDocument();
    // Use getAllByText for members since there might be duplicates
    const alexElements = screen.getAllByText("Alex");
    expect(alexElements.length).toBeGreaterThan(0);
  });

  it("welcome message and share CTA still render with feed", () => {
    render(
      <DashboardClient
        {...defaultProps}
        feedItems={MOCK_ACTIVITY}
        feedCursor={null}
      />
    );

    // "Welcome back," is in the DOM; the <span>Alex</span> is inside the same <p>
    expect(screen.getByText("Welcome back,")).toBeInTheDocument();
    // The <span> with "Alex" is inside the welcome <p> tag — check via parent
    const welcomeP = screen.getByText("Welcome back,").closest("p");
    expect(welcomeP?.innerHTML).toContain("Alex");
    expect(screen.getByText("Share a moment")).toBeInTheDocument();
  });
});
