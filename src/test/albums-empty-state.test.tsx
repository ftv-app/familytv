import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock next/image globally (used by AlbumCard even when not rendered)
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock all external dependencies of albums/page.tsx
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "user-1", isLoaded: true }),
  useUser: () => ({ user: { id: "user-1", fullName: "Alex" }, isLoaded: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock all UI component dependencies at once
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ..._ }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: () => <div data-testid="dialog-description" />,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: () => <div data-testid="dialog-title" />,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock("@/components/album-card", () => ({
  AlbumCard: () => <div data-testid="album-card" />,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="card-footer">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div data-testid="badge">{children}</div>,
}));

// Track WarmEmptyState calls to verify the albums page uses it
const mockWarmEmptyState = vi.fn();
vi.mock("@/components/warm-empty-state", () => ({
  WarmEmptyState: (props: {
    emoji?: string;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  }) => {
    mockWarmEmptyState(props);
    return (
      <div data-testid="warm-empty-state-mock">
        <span data-testid="wes-title">{props.title}</span>
        <span data-testid="wes-description">{props.description}</span>
        {props.ctaLabel && <span data-testid="wes-cta">{props.ctaLabel}</span>}
        {props.secondaryLabel && <span data-testid="wes-secondary">{props.secondaryLabel}</span>}
      </div>
    );
  },
}));

const FAM_ID = "fam-1";

describe("Albums empty state — WarmEmptyState integration", () => {
  beforeEach(() => mockWarmEmptyState.mockClear());

  it("AlbumsPage calls WarmEmptyState when albums array is empty", async () => {
    // Intercept fetch for /api/family and /api/albums
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ families: [{ id: FAM_ID, name: "The Smiths" }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ albums: [] }),
    });

    const { default: AlbumsPage } = await import("../app/albums/page");

    render(<AlbumsPage params={{}} searchParams={{ familyId: FAM_ID }} />);

    // Wait for useEffect to settle
    await new Promise((r) => setTimeout(r, 10));

    expect(mockWarmEmptyState).toHaveBeenCalled();
  });

  it("WarmEmptyState receives warm encouraging copy for albums", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ families: [{ id: FAM_ID, name: "The Smiths" }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ albums: [] }),
    });

    const { default: AlbumsPage } = await import("../app/albums/page");

    render(<AlbumsPage params={{}} searchParams={{ familyId: FAM_ID }} />);
    await new Promise((r) => setTimeout(r, 10));

    const calls = mockWarmEmptyState.mock.calls;
    const albumsCall = calls.find(([p]) => p?.description?.includes("album"));
    expect(albumsCall).toBeDefined();
    const [props] = albumsCall!;
    expect(props.title).toBeTruthy();
    expect(props.description).toBeTruthy();
    // No generic cold copy
    expect(props.title).not.toMatch(/^No |^Nothing |^Empty |^0 /i);
    expect(props.description).not.toMatch(/^No |^Nothing |^Empty/i);
  });

  it("WarmEmptyState includes a CTA linking to album creation", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ families: [{ id: FAM_ID, name: "The Smiths" }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ albums: [] }),
    });

    const { default: AlbumsPage } = await import("../app/albums/page");

    render(<AlbumsPage params={{}} searchParams={{ familyId: FAM_ID }} />);
    await new Promise((r) => setTimeout(r, 10));

    const ctaCall = mockWarmEmptyState.mock.calls.find(
      ([p]) => p?.ctaLabel
    );
    expect(ctaCall).toBeDefined();
    const [props] = ctaCall!;
    expect(props.ctaLabel).toBeTruthy();
    expect(props.ctaHref).toBeTruthy();
  });
});
