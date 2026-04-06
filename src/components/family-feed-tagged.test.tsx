import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import React from "react";

// Mocks must be declared before imports
vi.mock("@/components/create-post", () => ({
  CreatePost: vi.fn(({ familyId, onPostCreated }) => (
    <div data-testid="create-post" data-family-id={familyId}>
      <button onClick={() => onPostCreated({ id: "new-post", familyId, authorId: "user-1", authorName: "Test User", contentType: "text" })}>
        Create Post
      </button>
    </div>
  )),
}));

vi.mock("@/components/post-card", () => ({
  PostCard: vi.fn(({ post }) => (
    <div data-testid={`post-card-${post.id}`} className="post-card">
      <span data-testid={`post-author-${post.id}`}>{post.authorName}</span>
      <span data-testid={`post-caption-${post.id}`}>{post.caption}</span>
    </div>
  )),
}));

vi.mock("@/components/warm-empty-state", () => ({
  WarmEmptyState: vi.fn(({ title }) => <div data-testid="warm-empty-state">{title}</div>),
}));

vi.mock("@/components/search", () => ({
  SearchBar: vi.fn(() => <div data-testid="search-bar" />),
  SearchResults: vi.fn(() => <div data-testid="search-results" />),
}));

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/app/family/fam-1/feed",
  useSearchParams: () => new URLSearchParams(),
}));

const MOCK_POSTS = [
  {
    id: "post-1",
    familyId: "fam-1",
    authorId: "user-1",
    authorName: "Mom",
    contentType: "image" as const,
    mediaUrl: "https://example.com/img.jpg",
    caption: "Beach day!",
    tags: [{ id: "tag-1", name: "Beach", color: "#0ea5e9" }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "post-2",
    familyId: "fam-1",
    authorId: "user-2",
    authorName: "Dad",
    contentType: "text" as const,
    mediaUrl: null,
    caption: "Hiking trip",
    tags: [{ id: "tag-1", name: "Beach", color: "#0ea5e9" }],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_TAG = { id: "tag-1", name: "Beach", color: "#0ea5e9" };

describe("FamilyFeedTaggedClient", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders filter banner when tagId is provided", async () => {
    const { FamilyFeedTaggedClient } = await import("./family-feed-tagged-client");

    render(
      <FamilyFeedTaggedClient
        initialPosts={MOCK_POSTS}
        familyId="fam-1"
        nextCursor={null}
        activeTag={MOCK_TAG}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("tag-filter-banner")).toBeInTheDocument();
    });
  });

  it("shows tag name in filter banner", async () => {
    const { FamilyFeedTaggedClient } = await import("./family-feed-tagged-client");

    render(
      <FamilyFeedTaggedClient
        initialPosts={MOCK_POSTS}
        familyId="fam-1"
        nextCursor={null}
        activeTag={MOCK_TAG}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("tag-filter-name")).toHaveTextContent("Beach");
    });
  });

  it("renders posts when they exist", async () => {
    const { FamilyFeedTaggedClient } = await import("./family-feed-tagged-client");

    render(
      <FamilyFeedTaggedClient
        initialPosts={MOCK_POSTS}
        familyId="fam-1"
        nextCursor={null}
        activeTag={MOCK_TAG}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("post-card-post-1")).toBeInTheDocument();
      expect(screen.getByTestId("post-card-post-2")).toBeInTheDocument();
    });
  });

  it("shows all-caught-up message when posts exist and no more to load", async () => {
    const { FamilyFeedTaggedClient } = await import("./family-feed-tagged-client");

    render(
      <FamilyFeedTaggedClient
        initialPosts={MOCK_POSTS}
        familyId="fam-1"
        nextCursor={null}
        activeTag={MOCK_TAG}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-all-caught-up")).toBeInTheDocument();
    });
  });

  it("clear filter button is present in banner", async () => {
    const { FamilyFeedTaggedClient } = await import("./family-feed-tagged-client");

    render(
      <FamilyFeedTaggedClient
        initialPosts={MOCK_POSTS}
        familyId="fam-1"
        nextCursor={null}
        activeTag={MOCK_TAG}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("clear-tag-filter")).toBeInTheDocument();
    });
  });
});
