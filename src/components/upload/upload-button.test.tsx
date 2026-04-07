import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { UploadButton } from "./UploadButton";

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(() => ({ userId: "user-123" })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("UploadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function makeMockFile(name = "photo.jpg", type = "image/jpeg") {
    return new File(["fake image content"], name, { type });
  }

  function triggerFileInput(el: HTMLInputElement, file: File) {
    Object.defineProperty(el, "files", { value: [file], writable: false });
    fireEvent.change(el);
  }

  // ─── XHR Mock Factory ─────────────────────────────────────────────────────
  // Returns a factory that produces XHR instances whose methods are all vi.fn() spies.
  // The returned class can be used with vi.stubGlobal("XMLHttpRequest", ...).

  function makeXHRClass({
    status = 200,
    responseJSON = { url: "https://blob.example.com/test.jpg", post: { id: "post-1" } },
  } = {}) {
    return class MockXHR {
      static open = vi.fn();
      static send = vi.fn();
      static addEventListener = vi.fn();

      upload = {
        addEventListener: vi.fn((event: string, handler: (e: unknown) => void) => {
          (this as Record<string, unknown>).progressHandler = { event, handler };
        }),
      };

      onload: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onabort: ((e: unknown) => void) | null = null;
      status = status;
      response = JSON.stringify(responseJSON);

      open = MockXHR.open;
      send = MockXHR.send;
      addEventListener = MockXHR.addEventListener;

      constructor() {
        // Fire progress then load asynchronously after construction
        setTimeout(() => {
          // Progress
          (this as Record<string, unknown>).progressHandler?.handler({
            loaded: 100,
            total: 100,
            lengthComputable: true,
          });
          // Load
          this.onload?.({});
        }, 50);
      }
    };
  }

  // ─── Tests ─────────────────────────────────────────────────────────────────

  it("renders upload button with hidden file input", () => {
    render(<UploadButton familyId="family-1" />);
    expect(screen.getByTestId("upload-button")).toBeInTheDocument();
    expect(screen.getByTestId("upload-button-input")).toBeInTheDocument();
  });

  it("renders custom children inside button", () => {
    render(
      <UploadButton familyId="family-1">
        <span>Upload Photo</span>
      </UploadButton>
    );
    expect(screen.getByText("Upload Photo")).toBeInTheDocument();
  });

  it("file input has correct accept attribute", () => {
    render(<UploadButton familyId="family-1" />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toBe(
      "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,video/x-msvideo"
    );
  });

  it("disables button while uploading", async () => {
    const MockXHR = makeXHRClass();
    // Never fires onload — but send is called synchronously so just check the button disables
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(<UploadButton familyId="family-1" />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile());

    await waitFor(() => {
      const btn = screen.getByTestId("upload-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    }, { timeout: 500 });
  });

  it("calls POST /api/upload", async () => {
    const MockXHR = makeXHRClass();
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(<UploadButton familyId="family-1" albumId="album-789" />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile("photo.jpg", "image/jpeg"));

    // Advance fake timers so async setTimeout in XHR constructor fires
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(MockXHR.open).toHaveBeenCalledWith("POST", "/api/upload");
  });

  it("sends correct fields in FormData", async () => {
    const fields: Record<string, unknown> = {};

    class TestXHR extends makeXHRClass() {
      send = vi.fn((formData: FormData) => {
        fields.filename = formData.get("filename");
        fields.contentType = formData.get("contentType");
        fields.familyId = formData.get("familyId");
        fields.albumId = formData.get("albumId");
        fields.hasFile = formData.get("file") instanceof File;
        // Still fire onload via parent send
        super.send(formData);
      });
    }

    vi.stubGlobal("XMLHttpRequest", TestXHR);

    render(<UploadButton familyId="family-1" albumId="album-789" />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile("photo.jpg", "image/jpeg"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(fields.filename).toBe("photo.jpg");
    expect(fields.contentType).toBe("image/jpeg");
    expect(fields.familyId).toBe("family-1");
    expect(fields.albumId).toBe("album-789");
    expect(fields.hasFile).toBe(true);
  });

  it("shows success toast and calls onUploadComplete on 200", async () => {
    const onComplete = vi.fn();
    const { toast } = await import("sonner");

    const MockXHR = makeXHRClass({
      status: 200,
      responseJSON: {
        url: "https://blob.example.com/f1/u1/123.jpg",
        post: { id: "post-456", familyId: "family-1", mediaUrl: "https://blob.example.com/f1/u1/123.jpg", caption: "Test", albumId: "album-789", serverTimestamp: "2026-04-07T00:00:00Z" },
      },
    });
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(<UploadButton familyId="family-1" onUploadComplete={onComplete} />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(toast.success).toHaveBeenCalledWith("Upload complete!");
    expect(onComplete).toHaveBeenCalledWith("https://blob.example.com/f1/u1/123.jpg", "post-456");
  });

  it("shows error toast on non-2xx response", async () => {
    const { toast } = await import("sonner");

    const MockXHR = makeXHRClass({
      status: 400,
      responseJSON: { error: "Invalid content type" },
    });
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(<UploadButton familyId="family-1" />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile("test.exe", "application/octet-stream"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(toast.error).toHaveBeenCalledWith("Invalid content type");
  });

  it("calls onUploadComplete with fileUrl and postId", async () => {
    const onComplete = vi.fn();
    const { toast } = await import("sonner");

    const MockXHR = makeXHRClass({
      status: 200,
      responseJSON: {
        url: "https://blob.example.com/fam/user/file.jpg",
        post: { id: "post-abc", familyId: "fam-1", mediaUrl: "https://blob.example.com/fam/user/file.jpg", caption: "Nice!", albumId: "album-1", serverTimestamp: "2026-04-07T00:00:00Z" },
      },
    });
    vi.stubGlobal("XMLHttpRequest", MockXHR);

    render(<UploadButton familyId="family-1" onUploadComplete={onComplete} />);
    const input = screen.getByTestId("upload-button-input") as HTMLInputElement;
    triggerFileInput(input, makeMockFile());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("https://blob.example.com/fam/user/file.jpg", "post-abc");
    expect(toast.success).toHaveBeenCalledWith("Upload complete!");
  });
});
