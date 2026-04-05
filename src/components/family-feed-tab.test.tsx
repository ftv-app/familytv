import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FamilyFeedTab } from "./family-feed-tab";

// Mock the CreatePost component
vi.mock("@/components/create-post", () => ({
  CreatePost: vi.fn(({ familyId, onPostCreated }) => (
    <div data-testid="create-post" data-family-id={familyId}>
      <button onClick={() => onPostCreated({ id: "new-post", familyId, authorId: "user-1", authorName: "Test User", contentType: "text" })}>
        Create Post
      </button>
    </div>
  )),
}));

// Mock ImageLightbox for PostCard
vi.mock("@/components/image-lightbox", () => ({
  ImageLightbox: vi.fn(() => null),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_ACTIVITY = [
  {
    id: "post-1",
    type: "post" as const,
    actor: { name: "Mom", avatar: null },
    content: { contentType: "photo", caption: "Dinner at grandma's" },
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "comment-1",
    type: "comment" as const,
    actor: { name: "Dad", avatar: null },
    content: { postId: "post-1", content: "Looks delicious!" },
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
];

describe("FamilyFeedTab", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders CreatePost at the top of the feed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
    });

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      expect(screen.getByTestId("create-post")).toBeInTheDocument();
    });
    expect(screen.getByTestId("create-post")).toHaveAttribute("data-family-id", "family-1");
  });

  it("renders activity feed cards", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
    });

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      const cards = screen.getAllByTestId("feed-card");
      expect(cards.length).toBe(2);
    });

    expect(screen.getByText("Mom")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
  });

  it("shows end of feed message when no more items", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: MOCK_ACTIVITY, nextCursor: null, familyName: "The Smiths" }),
    });

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-end")).toBeInTheDocument();
    });
    expect(screen.getByText(/You're all caught up/i)).toBeInTheDocument();
  });

  it("shows empty state when no activity", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      expect(screen.getByText(/Your family feed is quiet/i)).toBeInTheDocument();
    });
  });

  it("shows error state with retry on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      expect(screen.getByTestId("feed-error")).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId("feed-retry");
    expect(retryBtn).toBeInTheDocument();
  });

  it("loads more items when load more button is clicked", async () => {
    const cursorDate = new Date(Date.now() - 3600 * 1000).toISOString();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [MOCK_ACTIVITY[0]], nextCursor: cursorDate, familyName: "The Smiths" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [MOCK_ACTIVITY[1]], nextCursor: null, familyName: "The Smiths" }),
      });

    render(<FamilyFeedTab familyId="family-1" familyName="The Smiths" />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card").length).toBe(1);
    });

    const loadMoreBtn = screen.getByTestId("feed-load-more");
    await userEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card").length).toBe(2);
    });
  });
});
