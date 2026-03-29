import { describe, it, expect } from "vitest";

// Test the family event validation logic
describe("Family Event Validation", () => {
  function validateEvent(event: { title?: string; date?: Date; familyId?: string }) {
    const errors: string[] = [];
    if (!event.title?.trim()) errors.push("Title is required");
    if (!event.date) errors.push("Date is required");
    if (!event.familyId) errors.push("Family ID is required");
    if (event.date && event.date < new Date("2020-01-01")) {
      errors.push("Date must be after 2020");
    }
    return errors;
  }

  it("passes for valid event", () => {
    const event = {
      title: "Birthday Party",
      date: new Date(),
      familyId: "fam_123",
    };
    expect(validateEvent(event)).toEqual([]);
  });

  it("fails for missing title", () => {
    const event = { date: new Date(), familyId: "fam_123" };
    expect(validateEvent(event)).toContain("Title is required");
  });

  it("fails for missing date", () => {
    const event = { title: "Party", familyId: "fam_123" };
    expect(validateEvent(event)).toContain("Date is required");
  });

  it("fails for missing familyId", () => {
    const event = { title: "Party", date: new Date() };
    expect(validateEvent(event)).toContain("Family ID is required");
  });

  it("fails for old date", () => {
    const event = {
      title: "Party",
      date: new Date("1999-01-01"),
      familyId: "fam_123",
    };
    expect(validateEvent(event)).toContain("Date must be after 2020");
  });
});

// Test post content validation
describe("Post Validation", () => {
  function validatePost(post: { contentType?: string; mediaUrl?: string | null; caption?: string | null }) {
    const errors: string[] = [];
    if (!["text", "image", "video"].includes(post.contentType ?? "")) {
      errors.push("Content type must be text, image, or video");
    }
    if (post.contentType !== "text" && !post.mediaUrl) {
      errors.push("Media URL is required for image/video posts");
    }
    return errors;
  }

  it("passes for text post", () => {
    expect(validatePost({ contentType: "text", caption: "Hello" })).toEqual([]);
  });

  it("passes for image post with media", () => {
    expect(validatePost({ contentType: "image", mediaUrl: "https://example.com/img.jpg" })).toEqual([]);
  });

  it("passes for video post with media", () => {
    expect(validatePost({ contentType: "video", mediaUrl: "https://example.com/vid.mp4" })).toEqual([]);
  });

  it("fails for invalid content type", () => {
    expect(validatePost({ contentType: "audio" })).toContain("Content type must be text, image, or video");
  });

  it("fails for image post without media", () => {
    const errors = validatePost({ contentType: "image" });
    expect(errors).toContain("Media URL is required for image/video posts");
  });
});

// Test invite token generation
describe("Invite Token", () => {
  function isValidInviteToken(token: string): boolean {
    // Tokens should be at least 20 chars and URL-safe
    return token.length >= 20 && /^[A-Za-z0-9_-]+$/.test(token);
  }

  it("accepts valid tokens", () => {
    expect(isValidInviteToken("abc123xyz_defgh-ijkLMNOPQRSTUVWXYZ")).toBe(true);
  });

  it("rejects short tokens", () => {
    expect(isValidInviteToken("short")).toBe(false);
  });

  it("rejects tokens with invalid characters", () => {
    expect(isValidInviteToken("token with spaces!")).toBe(false);
  });
});
