import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { WhatsHappeningNow } from "./whats-happening-now";
import type { ActivityResponse, SurfacedItem } from "./whats-happening-now";

// ─── Global afterEach for component cleanup ───────────────────────────────────
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Mock fetch ───────────────────────────────────────────────────────────────
function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(data),
    })
  );
}

// ─── Spec-compliant response factory ──────────────────────────────────────────
function makeSpecResponse(items: SurfacedItem[]): ActivityResponse {
  return {
    familyId: "family-1",
    generatedAt: new Date().toISOString(),
    items,
    meta: {
      totalItems: items.length,
      hasMore: false,
      pollingHint: new Date(Date.now() + 60_000).toISOString(),
      sections: {
        posts: {
          count: items.filter((i) => i.type === "post").length,
          newestAt: items.find((i) => i.type === "post")?.serverTimestamp ?? null,
        },
        comments: {
          count: items.filter((i) => i.type === "comment").length,
          newestAt: items.find((i) => i.type === "comment")?.serverTimestamp ?? null,
        },
        members: {
          count: items.filter((i) => i.type === "member_join").length,
          newestAt: items.find((i) => i.type === "member_join")?.serverTimestamp ?? null,
        },
        birthdays: {
          count: items.filter((i) => i.type === "birthday").length,
          nextBirthdayAt:
            items.find((i) => i.type === "birthday")?.serverTimestamp ?? null,
        },
      },
    },
  };
}

// ─── Spec-compliant post item ──────────────────────────────────────────────────
function makePost(overrides: Partial<SurfacedItem> = {}): SurfacedItem {
  return {
    type: "post",
    id: "post-1",
    score: 85,
    author: {
      id: "user-1",
      name: "Mom Johnson",
      avatarUrl: null,
      initials: "MJ",
    },
    contentType: "photo",
    caption: "Beautiful sunset at the beach!",
    mediaUrl: "https://example.com/sunset.jpg",
    createdAt: new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    reactionCount: 5,
    commentCount: 2,
    ...overrides,
  };
}

function makeComment(overrides: Partial<SurfacedItem> = {}): SurfacedItem {
  return {
    type: "comment",
    id: "comment-1",
    score: 78,
    author: {
      id: "user-2",
      name: "Dad Johnson",
      initials: "DJ",
    },
    postId: "post-1",
    postCaption: "Beautiful sunset at the beach!",
    content: "This is absolutely gorgeous!",
    isOnOwnPost: true,
    createdAt: new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeBirthday(overrides: Partial<SurfacedItem> = {}): SurfacedItem {
  return {
    type: "birthday",
    id: "bday-1",
    score: 92,
    person: {
      id: "user-3",
      name: "Grandma Rose",
      initials: "GR",
    },
    displayName: "Grandma Rose",
    daysUntil: 0,
    isToday: true,
    isTomorrow: false,
    dateLabel: "Today!",
    serverTimestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeMemberJoin(overrides: Partial<SurfacedItem> = {}): SurfacedItem {
  return {
    type: "member_join",
    id: "member-1",
    score: 70,
    actor: {
      id: "user-4",
      name: "Cousin Sam",
      initials: "CS",
    },
    joinedAt: new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    invitedBy: {
      id: "user-1",
      name: "Mom Johnson",
      initials: "MJ",
    },
    ...overrides,
  };
}

describe("WhatsHappeningNow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while fetching", () => {
    mockFetch({ items: [], nextCursor: null, familyName: "The Johnsons" });
    render(<WhatsHappeningNow familyId="family-1" />);

    // The component has aria-busy=true while loading
    expect(screen.getByTestId("whats-happening-now")).toHaveAttribute("aria-busy", "true");
  });

  it("renders empty state when no activity", async () => {
    mockFetch({ items: [], nextCursor: null, familyName: "The Johnsons" });

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-empty")).toBeInTheDocument();
    });
    expect(screen.getByText("Nothing happening yet")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockFetch({ error: "Server error" }, false, 500);

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("whats-happening-retry")).toBeInTheDocument();
  });

  it("renders posts section with spec-compliant API response", async () => {
    const items = [makePost(), makePost({ id: "post-2", caption: "Dinner tonight" })];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getAllByTestId("whats-happening-post")).toHaveLength(2);
    });

    expect(screen.getAllByText("Mom Johnson")).toHaveLength(2);
    expect(screen.getByText("Beautiful sunset at the beach!")).toBeInTheDocument();
    expect(screen.getByText("Dinner tonight")).toBeInTheDocument();
  });

  it("renders comments section", async () => {
    const items = [makeComment()];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-comment")).toBeInTheDocument();
    });

    expect(screen.getByText("Dad Johnson")).toBeInTheDocument();
    expect(screen.getByText("This is absolutely gorgeous!")).toBeInTheDocument();
    expect(screen.getByTestId("whats-happening-comment-badge")).toBeInTheDocument();
  });

  it("renders birthday section with Today badge", async () => {
    const items = [makeBirthday({ isToday: true, daysUntil: 0 })];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-birthday")).toBeInTheDocument();
    });

    expect(screen.getByText("Grandma Rose")).toBeInTheDocument();
    expect(screen.getByTestId("whats-happening-birthday-today-badge")).toBeInTheDocument();
    expect(screen.getByText("Today!")).toBeInTheDocument();
  });

  it("renders birthday section with Tomorrow badge", async () => {
    const items = [makeBirthday({ isToday: false, isTomorrow: true, daysUntil: 1, dateLabel: "Tomorrow" })];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-birthday")).toBeInTheDocument();
    });

    expect(screen.getByTestId("whats-happening-birthday-tomorrow-badge")).toBeInTheDocument();
  });

  it("renders member join section", async () => {
    const items = [makeMemberJoin()];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-member-join")).toBeInTheDocument();
    });

    expect(screen.getByText("Cousin Sam")).toBeInTheDocument();
    expect(screen.getByText("Invited by Mom Johnson")).toBeInTheDocument();
    expect(screen.getByTestId("whats-happening-member-joined-badge")).toBeInTheDocument();
  });

  it("calls onItemClick when a post is tapped", async () => {
    const items = [makePost()];
    mockFetch(makeSpecResponse(items));
    const onItemClick = vi.fn();

    render(
      <WhatsHappeningNow familyId="family-1" onItemClick={onItemClick} />
    );

    const post = await screen.findByTestId("whats-happening-post");
    post.click();

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ type: "post", id: "post-1" })
    );
  });

  it("renders all four section types in one response", async () => {
    const items = [
      makePost(),
      makeComment(),
      makeBirthday(),
      makeMemberJoin(),
    ];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-post")).toBeInTheDocument();
      expect(screen.getByTestId("whats-happening-comment")).toBeInTheDocument();
      expect(screen.getByTestId("whats-happening-birthday")).toBeInTheDocument();
      expect(screen.getByTestId("whats-happening-member-join")).toBeInTheDocument();
    });
  });

  it("handles legacy API response (nextCursor shape)", async () => {
    // Legacy shape from the current API implementation
    mockFetch({
      items: [
        {
          id: "post-legacy-1",
          type: "post",
          actor: { name: "Mom Johnson", avatar: null },
          content: {
            contentType: "photo",
            caption: "Legacy post from current API",
            mediaUrl: null,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: "comment-legacy-1",
          type: "comment",
          actor: { name: "Dad Johnson", avatar: null },
          content: {
            postId: "post-1",
            content: "Legacy comment",
          },
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
      familyName: "The Johnsons",
    });

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      // Should render adapted post card
      expect(screen.getByText("Legacy post from current API")).toBeInTheDocument();
      // Adapted comment card
      expect(screen.getByText("Legacy comment")).toBeInTheDocument();
    });
  });

  it("retry button calls fetchActivity again", async () => {
    mockFetch({ error: "Server error" }, false, 500);

    render(<WhatsHappeningNow familyId="family-1" />);

    // Wait for error state to appear
    await screen.findByTestId("whats-happening-error");

    // Click the retry button
    const retryBtn = await screen.findByTestId("whats-happening-retry");
    retryBtn.click();

    // After retry, fetch should be called again (2nd call)
    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
    });
  });

  it("post card shows reaction and comment counts", async () => {
    const items = [makePost({ reactionCount: 12, commentCount: 5 })];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    const reactions = await screen.findByTestId("whats-happening-post-reactions");
    const comments = await screen.findByTestId("whats-happening-post-comments");

    expect(reactions).toBeInTheDocument();
    expect(comments).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // reactions
    expect(screen.getByText("5")).toBeInTheDocument(); // comments
  });

  it("does not crash when mediaUrl is missing", async () => {
    const items = [makePost({ mediaUrl: undefined, contentType: "text", caption: "No media" })];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    const post = await screen.findByTestId("whats-happening-post");
    expect(post).toBeInTheDocument();
    // Should not have a media container when mediaUrl is absent
    expect(screen.queryByTestId("whats-happening-post-media")).not.toBeInTheDocument();
  });

  it("renders meta footer with generatedAt", async () => {
    const items = [makePost()];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-meta")).toBeInTheDocument();
    });
  });

  it("has correct data-post-id attributes on post cards", async () => {
    const items = [
      makePost({ id: "post-abc" }),
      makePost({ id: "post-xyz" }),
    ];
    mockFetch(makeSpecResponse(items));

    render(<WhatsHappeningNow familyId="family-1" />);

    await waitFor(() => {
      const posts = screen.getAllByTestId("whats-happening-post");
      expect(posts[0]).toHaveAttribute("data-post-id", "post-abc");
      expect(posts[1]).toHaveAttribute("data-post-id", "post-xyz");
    });
  });

  it("onSeeAllClick is called when See all button is clicked", async () => {
    const items = [makePost()];
    mockFetch(makeSpecResponse(items));
    const onSeeAllClick = vi.fn();

    render(
      <WhatsHappeningNow familyId="family-1" onSeeAllClick={onSeeAllClick} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("whats-happening-see-all-recent-posts")).toBeInTheDocument();
    });

    screen.getByTestId("whats-happening-see-all-recent-posts").click();
    expect(onSeeAllClick).toHaveBeenCalledTimes(1);
  });
});
