import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import React from "react";
import { TagInput } from "./tag-input";

vi.mock("@/components/tag-chip", () => ({
  TagChip: vi.fn(({ tag, onRemove }) => (
    <span data-testid={`mock-tag-chip-${tag.id}`}>
      {tag.name}
      {onRemove && (
        <button data-testid={`mock-tag-remove-${tag.id}`} onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  )),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const POST_ID = "post-1";
const FAMILY_ID = "family-1";

function renderTagInput(overrides?: Partial<React.ComponentProps<typeof TagInput>>) {
  return render(
    <TagInput
      postId={POST_ID}
      familyId={FAMILY_ID}
      tags={[
        { id: "tag-1", name: "Holidays", color: "#6366f1" },
        { id: "tag-2", name: "Beach", color: "#f59e0b" },
      ]}
      onTagsChange={vi.fn()}
      {...overrides}
    />
  );
}

describe("TagInput", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tags: [] }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("renders with existing tags", () => {
      renderTagInput();
      expect(screen.getByTestId("tag-input-container")).toBeInTheDocument();
      expect(screen.getByTestId("tag-input-applied-tags")).toBeInTheDocument();
    });

    it("renders input field", () => {
      renderTagInput();
      expect(screen.getByTestId("tag-input-field")).toBeInTheDocument();
    });

    it("does not render suggestions dropdown by default", () => {
      renderTagInput();
      expect(screen.queryByTestId("tag-input-suggestions")).not.toBeInTheDocument();
    });

    it("renders with empty tags array", () => {
      renderTagInput({ tags: [] });
      expect(screen.getByTestId("tag-input-field")).toBeInTheDocument();
      expect(screen.queryByTestId("tag-input-applied-tags")).not.toBeInTheDocument();
    });
  });

  describe("Autocomplete", () => {
    it("fetches suggestions from autocomplete API when user types", async () => {
      // Spy on fetch to intercept the autocomplete call
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [] }),
      } as unknown as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "Hal" } });
        // Let debounce fire and autocomplete resolve
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/tags/autocomplete?familyId=${FAMILY_ID}&q=Hal`,
        expect.any(Object)
      );

      fetchSpy.mockRestore();
    });

    it("shows suggestions dropdown after autocomplete resolves", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tags: [
            { id: "tag-3", name: "Halloween", color: "#f97316" },
            { id: "tag-4", name: "Hiking", color: "#10b981" },
          ],
        }),
      } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "Ha" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(screen.getByTestId("tag-input-suggestions")).toBeInTheDocument();
    });

    it("filters out already-applied tags from suggestions", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tags: [
            { id: "tag-1", name: "Holidays", color: "#6366f1" },
            { id: "tag-3", name: "Halloween", color: "#f97316" },
          ],
        }),
      } as Response);

      renderTagInput({ tags: [{ id: "tag-1", name: "Holidays", color: "#6366f1" }] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "H" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      const suggestions = screen.getByTestId("tag-input-suggestions");
      expect(suggestions.textContent).not.toContain("Holidays");
      expect(suggestions.textContent).toContain("Halloween");
    });
  });

  describe("Apply existing tag", () => {
    it("calls POST /api/media/:postId/tags when suggestion is clicked", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            tags: [{ id: "tag-3", name: "Halloween", color: "#f97316" }],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "Hal" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tag-input-suggestion-0"));
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/media/${POST_ID}/tags`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("clears input after applying tag from suggestion", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            tags: [{ id: "tag-3", name: "Halloween", color: "#f97316" }],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "Hal" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tag-input-suggestion-0"));
        await new Promise((r) => setTimeout(r, 100));
      });

      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  describe("Create new tag", () => {
    it("shows create option when no autocomplete match exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tags: [] }),
      } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "XYZUniqueTag" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(screen.getByTestId("tag-input-create-option")).toBeInTheDocument();
      expect(screen.getByTestId("tag-input-create-option").textContent).toContain("XYZUniqueTag");
    });

    it("calls POST /api/media/:postId/tags when create option is clicked", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "XYZNewTag" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("tag-input-create-option"));
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/media/${POST_ID}/tags`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("creates tag on Enter key when no suggestion highlighted", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: [] }),
        } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "XYZEnterTag" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/media/${POST_ID}/tags`,
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("Remove tag", () => {
    it("calls DELETE /api/media/:postId/tags/:tagId when remove is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ removed: true }),
      } as Response);

      renderTagInput();

      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-tag-remove-tag-1"));
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/media/${POST_ID}/tags/tag-1`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("Keyboard navigation", () => {
    it("highlights suggestion on ArrowDown", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tags: [
            { id: "tag-3", name: "Halloween", color: "#f97316" },
            { id: "tag-4", name: "Hiking", color: "#10b981" },
          ],
        }),
      } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "H" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(screen.getByTestId("tag-input-suggestion-0")).toHaveAttribute("aria-selected", "true");
    });

    it("closes dropdown on Escape", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tags: [{ id: "tag-3", name: "Halloween", color: "#f97316" }],
        }),
      } as Response);

      renderTagInput({ tags: [] });
      const input = screen.getByTestId("tag-input-field");

      await act(async () => {
        fireEvent.change(input, { target: { value: "Ha" } });
        await new Promise((r) => setTimeout(r, 300));
      });

      expect(screen.getByTestId("tag-input-suggestions")).toBeInTheDocument();

      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
      });

      expect(screen.queryByTestId("tag-input-suggestions")).not.toBeInTheDocument();
    });
  });
});
