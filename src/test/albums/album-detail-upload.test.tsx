import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import React from "react";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: "album_abc" }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "user-123", isLoaded: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, "data-testid": dt, ..._ }: { children: React.ReactNode; "data-testid"?: string }) => (
    <button data-testid={dt}>{children}</button>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ "data-testid": dt }: { "data-testid"?: string }) => <div data-testid={dt} />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/album-form", () => ({
  AlbumForm: () => <div data-testid="album-form" />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
  DialogTitle: () => <div data-testid="dialog-title" />,
  DialogDescription: () => <div data-testid="dialog-description" />,
  DialogClose: () => <div data-testid="dialog-close" />,
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

vi.mock("@/components/upload/UploadButton", () => ({
  UploadButton: ({ familyId, albumId, "data-testid": dt }: {
    familyId: string; albumId?: string; "data-testid"?: string;
  }) => (
    <div data-testid={dt ?? "upload-button-wrapper"}>
      <input data-testid="albums-detail-upload-input" type="file" style={{ display: "none" }} onChange={() => {}} />
      <button data-testid="albums-detail-upload-button">Upload</button>
      <span data-testid="upload-family-id">{familyId}</span>
      <span data-testid="upload-album-id">{albumId ?? "none"}</span>
    </div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockFile(name = "photo.jpg", type = "image/jpeg") {
  return new File(["fake image content"], name, { type });
}

function triggerFileInput(el: HTMLInputElement, file: File) {
  Object.defineProperty(el, "files", { value: [file], writable: false });
  fireEvent.change(el);
}

function makeXHRClass({
  status = 200,
  responseJSON = {
    url: "https://blob.example.com/f1/u1/photo.jpg",
    post: { id: "post-new", familyId: "fam_abc", mediaUrl: "https://blob.example.com/f1/u1/photo.jpg", caption: null, albumId: "album_abc", serverTimestamp: "2026-04-07T00:00:00Z" },
  },
} = {}) {
  return class MockXHR {
    static open = vi.fn();
    static send = vi.fn();
    static addEventListener = vi.fn();

    upload = {
      addEventListener: vi.fn((_event: string, handler: (e: unknown) => void) => {
        Object.defineProperty(this, "progressHandler", { value: handler, writable: true });
      }),
    };

    onload: ((e: unknown) => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    status = status;
    response = JSON.stringify(responseJSON);

    open = MockXHR.open;
    send = MockXHR.send;
    addEventListener = MockXHR.addEventListener;

    constructor() {
      setTimeout(() => {
        const ph = (this as Record<string, unknown>).progressHandler as (e: unknown) => void;
        ph?.({ loaded: 100, total: 100, lengthComputable: true });
        this.onload?.({});
      }, 50);
    }
  };
}

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { AlbumDetailPage } from "@/app/albums/[id]/page";

// ─── Test Data ───────────────────────────────────────────────────────────────
const TEST_ALBUM_ID = "album_abc";
const TEST_FAMILY_ID = "fam_abc";

const mockAlbum = {
  id: TEST_ALBUM_ID,
  name: "Summer 2025",
  description: "Beach trips and more",
  coverUrl: null,
  createdAt: "2025-06-01T00:00:00Z",
  updatedAt: "2025-06-15T00:00:00Z",
  createdBy: "user-123",
  familyId: TEST_FAMILY_ID,
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("AlbumDetailPage — Upload Integration", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    vi.stubGlobal("XMLHttpRequest", makeXHRClass());
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(cleanup);

  async function waitForPageLoad() {
    await waitFor(() => {
      expect(screen.queryByTestId("albums-detail-loading")).not.toBeInTheDocument();
    }, { timeout: 3000 });
  }

  // ─── Album metadata ───────────────────────────────────────────────────────

  it("renders the album name and description", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ album: mockAlbum }) });

    render(<AlbumDetailPage />);
    await waitForPageLoad();

    expect(screen.getByTestId("albums-detail-name")).toHaveTextContent("Summer 2025");
    expect(screen.getByTestId("albums-detail-description")).toHaveTextContent("Beach trips and more");
  });

  // ─── Upload button ────────────────────────────────────────────────────────

  it("shows upload button with correct familyId and albumId props", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ album: mockAlbum }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media: [] }) });

    render(<AlbumDetailPage />);
    await waitForPageLoad();

    expect(screen.getByTestId("albums-detail-upload-button")).toBeInTheDocument();
    expect(screen.getByTestId("upload-family-id")).toHaveTextContent(TEST_FAMILY_ID);
    expect(screen.getByTestId("upload-album-id")).toHaveTextContent(TEST_ALBUM_ID);
  });

  // ─── Empty / populated states ─────────────────────────────────────────────

  it("shows empty state when album has no media", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ album: mockAlbum }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media: [] }) });

    render(<AlbumDetailPage />);
    await waitForPageLoad();

    expect(screen.getByTestId("albums-detail-photos-empty")).toBeInTheDocument();
    expect(screen.getByTestId("albums-detail-photos-empty-text")).toHaveTextContent("No photos in this album yet.");
  });

  it("displays existing media items in the grid", async () => {
    const mediaItems = [
      { id: "post_1", mediaUrl: "https://blob.example.com/photo1.jpg", caption: "Beach!", serverTimestamp: "2026-04-06T12:00:00Z", authorName: "Dad" },
      { id: "post_2", mediaUrl: "https://blob.example.com/photo2.jpg", caption: null, serverTimestamp: "2026-04-06T13:00:00Z", authorName: "Mom" },
    ];
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ album: mockAlbum }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media: mediaItems }) });

    render(<AlbumDetailPage />);
    await waitForPageLoad();

    expect(screen.getByTestId("albums-detail-photo-0")).toBeInTheDocument();
    expect(screen.getByTestId("albums-detail-photo-1")).toBeInTheDocument();
    expect(screen.getByTestId("albums-detail-photos-count")).toHaveTextContent("2 photos");
  });

  // ─── Upload flow ──────────────────────────────────────────────────────────

  it("adds newly uploaded photo to the grid without needing a refetch", async () => {
    const MockXHR = makeXHRClass({
      status: 200,
      responseJSON: {
        url: "https://blob.example.com/new-photo.jpg",
        post: { id: "post_new", familyId: TEST_FAMILY_ID, mediaUrl: "https://blob.example.com/new-photo.jpg", caption: null, albumId: TEST_ALBUM_ID, serverTimestamp: "2026-04-07T00:00:00Z" },
      },
    });
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ album: mockAlbum }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media: [] }) });

    render(<AlbumDetailPage />);
    await waitForPageLoad();

    // Confirm empty state before upload
    expect(screen.getByTestId("albums-detail-photos-empty")).toBeInTheDocument();

    // Trigger file input change to simulate upload
    const input = screen.getByTestId("albums-detail-upload-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile("beach.jpg", "image/jpeg"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // After upload, empty state should be gone and photo should appear
    expect(screen.queryByTestId("albums-detail-photos-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("albums-detail-photo-0")).toBeInTheDocument();
    expect(screen.getByTestId("albums-detail-photos-count")).toHaveTextContent("1 photo");
  });
});
