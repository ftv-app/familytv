import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { PostCard } from "./post-card";
import type { PostWithAuthor } from "./post-card";

// Mock ImageLightbox to avoid DOM issues
vi.mock("@/components/image-lightbox", () => ({
  ImageLightbox: vi.fn(() => null),
}));

const MOCK_POST: PostWithAuthor = {
  id: "post-1",
  familyId: "family-1",
  authorId: "user-1",
  authorName: "Alice Johnson",
  authorAvatarUrl: null,
  contentType: "image",
  mediaUrl: "https://example.com/photo.jpg",
  caption: "Dinner at grandma's house!",
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
};

const MOCK_TEXT_POST: PostWithAuthor = {
  id: "post-2",
  familyId: "family-1",
  authorId: "user-2",
  authorName: "Bob Smith",
  authorAvatarUrl: null,
  contentType: "text",
  mediaUrl: null,
  caption: "Just a text update from me",
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
};

const MOCK_VIDEO_POST: PostWithAuthor = {
  id: "post-3",
  familyId: "family-1",
  authorId: "user-1",
  authorName: "Carol Davis",
  authorAvatarUrl: null,
  contentType: "video",
  mediaUrl: "https://example.com/video.mp4",
  caption: "Fun at the park!",
  createdAt: new Date(Date.now() - 60 * 1000).toISOString(), // 1 minute ago
};

describe("PostCard", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-card")).toBeInTheDocument();
    });

    it("displays author name with correct testid", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-author-name")).toHaveTextContent("Alice Johnson");
    });

    it("displays relative timestamp", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-timestamp")).toHaveTextContent("2h ago");
    });

    it("displays caption text", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-caption")).toHaveTextContent("Dinner at grandma's house!");
    });

    it("shows image expand button when contentType is image with mediaUrl", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-image-expand")).toBeInTheDocument();
    });

    it("does not show media container for text-only posts", () => {
      render(<PostCard post={MOCK_TEXT_POST} />);
      expect(screen.queryByTestId("post-media-container")).not.toBeInTheDocument();
    });

    it("displays text placeholder for text-only post without caption", () => {
      const noCaptionPost = { ...MOCK_TEXT_POST, caption: null };
      render(<PostCard post={noCaptionPost} />);
      expect(screen.getByTestId("post-text-placeholder")).toHaveTextContent("Shared a moment");
    });

    it("displays video play button for video posts", () => {
      render(<PostCard post={MOCK_VIDEO_POST} />);
      expect(screen.getByTestId("post-video-play-btn")).toBeInTheDocument();
    });
  });

  describe("Interactive elements", () => {
    it("comment button has correct data-testid", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-comment-btn")).toBeInTheDocument();
    });

    it("like button has correct data-testid", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-like-btn")).toBeInTheDocument();
    });

    it("reactions row has correct data-testid", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-reactions")).toBeInTheDocument();
    });

    it("avatar has correct data-testid", () => {
      render(<PostCard post={MOCK_POST} />);
      expect(screen.getByTestId("post-avatar")).toBeInTheDocument();
    });

    it("opens lightbox on image expand click", async () => {
      const { ImageLightbox } = await import("@/components/image-lightbox");
      render(<PostCard post={MOCK_POST} />);
      fireEvent.click(screen.getByTestId("post-image-expand"));
      await waitFor(() => {
        expect(ImageLightbox).toHaveBeenCalled();
      });
    });
  });

  describe("Styling — warm cream palette", () => {
    it("card uses white background (#ffffff)", () => {
      render(<PostCard post={MOCK_POST} />);
      const card = screen.getByTestId("post-card");
      expect(card).toHaveStyle({ backgroundColor: "#ffffff" });
    });

    it("card has warm shadow with terracotta tint", () => {
      render(<PostCard post={MOCK_POST} />);
      const card = screen.getByTestId("post-card");
      const boxShadow = card.style.boxShadow;
      // Warm shadow should contain terracotta rgba value
      expect(boxShadow).toContain("rgba(196, 120, 90");
    });

    it("card border uses terracotta rgba", () => {
      render(<PostCard post={MOCK_POST} />);
      const card = screen.getByTestId("post-card");
      // Border is set via inline style prop — verify boxShadow contains terracotta values instead
      const boxShadow = card.style.boxShadow;
      expect(boxShadow).toContain("rgba(196, 120, 90");
    });

    it("card has border-radius 12px", () => {
      render(<PostCard post={MOCK_POST} />);
      const card = screen.getByTestId("post-card");
      expect(card).toHaveStyle({ borderRadius: "12px" });
    });
  });
});
