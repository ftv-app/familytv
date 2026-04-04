import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActivityFeed } from "./ActivityFeed";
import type { ActivityItem } from "./ActivityFeed";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "post-1",
    type: "post",
    actor: { name: "Mom", avatar: null },
    content: { contentType: "photo", caption: "Dinner at grandma's" },
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "comment-1",
    type: "comment",
    actor: { name: "Dad", avatar: null },
    content: { postId: "post-1", content: "Looks delicious!" },
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
  {
    id: "reaction-1",
    type: "reaction",
    actor: { name: "Sam", avatar: null },
    content: { postId: "post-1", emoji: "❤️" },
    createdAt: new Date(Date.now() - 10800 * 1000).toISOString(),
  },
  {
    id: "event-1",
    type: "event",
    actor: { name: "Mom", avatar: null },
    content: {
      title: "Family BBQ",
      description: "Annual summer BBQ",
      startDate: new Date(Date.now() + 86400 * 1000).toISOString(),
      allDay: true,
    },
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
  },
];

describe("ActivityFeed", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders loading skeletons when loading", () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );
    render(
      <ActivityFeed
        familyId="family-1"
        initialItems={[]}
      />
    );

    // Should show skeletons
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no items", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });
    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-container")).toBeInTheDocument();
    });
    expect(screen.getByText(/Your family feed is quiet/i)).toBeInTheDocument();
  });

  it("renders activity cards when items exist", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
    });
    render(<ActivityFeed familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("feed-card");
      expect(cards.length).toBe(MOCK_ACTIVITY.length);
    });

    // Check actor names
    expect(screen.getByText("Mom")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("shows load more button when cursor exists", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: MOCK_ACTIVITY.slice(0, 2),
          nextCursor: new Date().toISOString(),
          familyName: "The Smiths",
        }),
    });
    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-load-more")).toBeInTheDocument();
    });
  });

  it("shows end of feed when no cursor", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
    });
    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-end")).toBeInTheDocument();
      expect(screen.getByText(/You're all caught up/i)).toBeInTheDocument();
    });
  });

  it("shows error state and retry button on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-error")).toBeInTheDocument();
    });
    const retryBtn = screen.getByTestId("feed-retry");
    expect(retryBtn).toBeInTheDocument();
  });

  it("retry button re-fetches on click", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
      });
    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-error")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("feed-retry"));

    await waitFor(() => {
      const cards = screen.getAllByTestId("feed-card");
      expect(cards.length).toBe(MOCK_ACTIVITY.length);
    });
  });

  it("load more appends items to existing list", async () => {
    const cursorDate = new Date(Date.now() - 3600 * 1000).toISOString();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: MOCK_ACTIVITY.slice(0, 2),
            nextCursor: cursorDate,
            familyName: "The Smiths",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: MOCK_ACTIVITY.slice(2),
            nextCursor: null,
            familyName: "The Smiths",
          }),
      });

    render(<ActivityFeed familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card").length).toBe(2);
    });

    fireEvent.click(screen.getByTestId("feed-load-more"));

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card").length).toBe(4);
    });
  });
});
