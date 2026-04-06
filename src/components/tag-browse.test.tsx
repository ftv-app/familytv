"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { TagBrowseClient } from "@/components/tag-browse-client";

const mockTags = [
  { id: "tag-1", familyId: "fam-1", name: "Holidays", color: "#e11d48", postCount: 12, createdAt: "2025-01-01T00:00:00Z" },
  { id: "tag-2", familyId: "fam-1", name: "Beach", color: "#0ea5e9", postCount: 5, createdAt: "2025-01-02T00:00:00Z" },
  { id: "tag-3", familyId: "fam-1", name: "Birthdays", color: "#f59e0b", postCount: 3, createdAt: "2025-01-03T00:00:00Z" },
];

// Shared push mock so we can assert on it across renders
const pushMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/app/family/fam-1/tags",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  vi.restoreAllMocks();
});

describe("TagBrowseClient", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders loading state initially", async () => {
    global.fetch = vi.fn().mockReturnValue(
      new Promise(() => {}) as unknown as Response
    );
    render(<TagBrowseClient familyId="fam-1" />);
    expect(screen.getByTestId("tag-browse-loading")).toBeInTheDocument();
  });

  it("renders tag grid when tags exist", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-browse-grid")).toBeInTheDocument();
    });
  });

  it("renders correct number of tag cards", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-card-tag-1")).toBeInTheDocument();
      expect(screen.getByTestId("tag-card-tag-2")).toBeInTheDocument();
      expect(screen.getByTestId("tag-card-tag-3")).toBeInTheDocument();
    });
  });

  it("renders tag name and post count on each card", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-name-tag-1").textContent).toBe("Holidays");
      expect(screen.getByTestId("tag-count-tag-1").textContent).toBe("12 posts");
    });
  });

  it("navigates to feed with tagId on click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-card-tag-1")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("tag-card-tag-1"));
    expect(pushMock).toHaveBeenCalledWith("/app/family/fam-1/feed?tagId=tag-1");
  });

  it("renders empty state when no tags", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: [] }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-browse-empty")).toBeInTheDocument();
    });
  });

  it("shows singular post when count is 1", async () => {
    const singlePostTag = [{ ...mockTags[0], id: "tag-solo", name: "Solo", color: "#888", postCount: 1 }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: singlePostTag }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-count-tag-solo").textContent).toBe("1 post");
    });
  });

  it("clicking different tag navigates with correct tagId", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tags: mockTags }),
    } as Response);
    render(<TagBrowseClient familyId="fam-1" />);
    await waitFor(() => {
      expect(screen.getByTestId("tag-card-tag-2")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("tag-card-tag-3"));
    expect(pushMock).toHaveBeenCalledWith("/app/family/fam-1/feed?tagId=tag-3");
  });
});
