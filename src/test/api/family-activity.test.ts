import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockMembershipsFindMany = vi.fn();
const mockPostsFindMany = vi.fn();
const mockEventsFindMany = vi.fn();
const mockCommentsFindMany = vi.fn();
const mockReactionsFindMany = vi.fn();
const mockCheckRateLimit = vi.fn();

// Mock Node.js built-in modules
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed"),
    }),
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
  },
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed"),
    }),
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
  },
}));

// Mock @neondatabase/serverless
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn().mockReturnValue(vi.fn()),
}));

// Mock drizzle-orm/neon-http
vi.mock("drizzle-orm/neon-http", () => ({
  drizzle: vi.fn().mockReturnValue({}),
}));

// Mock rate-limiter
vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
        findMany: (...args: unknown[]) => mockMembershipsFindMany(...args),
      },
      posts: {
        findMany: (...args: unknown[]) => mockPostsFindMany(...args),
      },
      calendarEvents: {
        findMany: (...args: unknown[]) => mockEventsFindMany(...args),
      },
      comments: {
        findMany: (...args: unknown[]) => mockCommentsFindMany(...args),
      },
      reactions: {
        findMany: (...args: unknown[]) => mockReactionsFindMany(...args),
      },
    },
  },
  posts: {},
  comments: {},
  reactions: {},
  calendarEvents: {},
  families: {},
  familyMemberships: {},
}));

import { GET } from "@/app/api/family/activity/route";
import { createMockFamilyMembership, createMockFamily, createMockPost, createMockComment, createMockReaction, createMockCalendarEvent } from "@/test/factories";

describe("/api/family/activity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default rate limit to allowed
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = new NextRequest("http://localhost/api/family/activity");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("Rate Limiting", () => {
    it("returns 429 when rate limit exceeded", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockCheckRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 30000,
      });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toBe("Rate limit exceeded");
      expect(json.retryAfterMs).toBeDefined();
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 400 when limit is invalid (NaN)", async () => {
      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=abc");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when limit is less than 1", async () => {
      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=0");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when limit is greater than 50", async () => {
      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=100");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when cursor is invalid date", async () => {
      const family = createMockFamily({ id: "family_123", name: "The Smiths" });
      const membership = createMockFamilyMembership({ familyId: "family_123", userId: "user_123" });
      
      mockMembershipsFindFirst.mockResolvedValue({ ...membership, family });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&cursor=invalid-date");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid cursor format");
    });
  });

  describe("Authorization", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 403 when user is not a family member (with familyId param)", async () => {
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });

    it("returns 403 when user has no family memberships (no familyId param)", async () => {
      mockMembershipsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });
  });

  describe("Successful Response", () => {
    const mockFamily = createMockFamily({ id: "family_123", name: "The Smiths" });
    const mockMembership = createMockFamilyMembership({ familyId: "family_123", userId: "user_123" });

    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns correct response shape with posts", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const mockPost = createMockPost({
        familyId: "family_123",
        authorName: "John Doe",
        contentType: "image",
        caption: "Family photo",
      });

      mockPostsFindMany.mockResolvedValue([mockPost]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("items");
      expect(json).toHaveProperty("nextCursor");
      expect(json).toHaveProperty("familyName");
      expect(json.familyName).toBe("The Smiths");
      expect(json.items).toHaveLength(1);
      expect(json.items[0].type).toBe("post");
      expect(json.items[0].actor.name).toBe("John Doe");
    });

    it("returns empty items when no activity", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toEqual([]);
      expect(json.nextCursor).toBeNull();
    });

    it("uses default limit of 20 when not specified", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("includes comments in activity feed", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const mockPost = createMockPost({ id: "post_123", familyId: "family_123" });
      const mockComment = createMockComment({
        postId: "post_123",
        authorName: "Jane Doe",
        content: "Great photo!",
      });

      mockPostsFindMany.mockResolvedValue([mockPost]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([mockComment]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      const commentActivity = json.items.find((item: { type: string }) => item.type === "comment");
      expect(commentActivity).toBeDefined();
      expect(commentActivity.actor.name).toBe("Jane Doe");
      expect(commentActivity.content.content).toBe("Great photo!");
    });

    it("includes reactions in activity feed", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const mockPost = createMockPost({ id: "post_123", familyId: "family_123" });
      const mockReaction = createMockReaction({
        postId: "post_123",
        userId: "user_456",
        emoji: "👍",
      });

      mockPostsFindMany.mockResolvedValue([mockPost]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([mockReaction]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      const reactionActivity = json.items.find((item: { type: string }) => item.type === "reaction");
      expect(reactionActivity).toBeDefined();
      expect(reactionActivity.actor.name).toBe("user_456");
      expect(reactionActivity.content.emoji).toBe("👍");
    });

    it("includes events in activity feed", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const mockEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Family BBQ",
        description: "Annual barbecue",
      });

      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([mockEvent]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      const eventActivity = json.items.find((item: { type: string }) => item.type === "event");
      expect(eventActivity).toBeDefined();
      expect(eventActivity.content.title).toBe("Family BBQ");
    });

    it("sorts activities by createdAt descending", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const now = new Date();
      const olderPost = createMockPost({
        familyId: "family_123",
        id: "post_older",
        createdAt: new Date(now.getTime() - 10000),
      });
      const newerPost = createMockPost({
        familyId: "family_123",
        id: "post_newer",
        createdAt: new Date(now.getTime()),
      });

      mockPostsFindMany.mockResolvedValue([olderPost, newerPost]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items[0].id).toBe("post_newer"); // newer post should be first
      expect(json.items[1].id).toBe("post_older");
    });

    it("handles cursor-based pagination", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const cursorDate = "2026-03-15T10:00:00Z";
      const mockPost = createMockPost({
        familyId: "family_123",
        createdAt: new Date(cursorDate),
      });

      mockPostsFindMany.mockResolvedValue([mockPost]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        `http://localhost/api/family/activity?familyId=family_123&cursor=${encodeURIComponent(cursorDate)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("returns nextCursor when there are more items than limit", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      // Create 25 posts (more than limit of 20)
      const posts = Array.from({ length: 25 }, (_, i) =>
        createMockPost({
          familyId: "family_123",
          id: `post_${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        })
      );

      mockPostsFindMany.mockResolvedValue(posts);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=20");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toHaveLength(20);
      expect(json.nextCursor).toBeDefined();
    });

    it("uses first family membership when no familyId provided", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindMany.mockResolvedValue([membershipWithFamily]);

      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockMembershipsFindMany).toHaveBeenCalled();
    });

    it("does not query comments/reactions when no posts exist", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      // These should NOT be called when postIds is empty
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Comments and reactions should NOT be called when there are no posts
      expect(mockCommentsFindMany).not.toHaveBeenCalled();
      expect(mockReactionsFindMany).not.toHaveBeenCalled();
    });

    it("returns 500 on internal error", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockRejectedValue(new Error("Database connection failed"));

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Internal server error");
    });

    it("does not include stack trace in error response", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockRejectedValue(new Error("Database connection failed"));

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      const json = await res.json();
      expect(json.error).not.toContain("stack");
      expect(json.error).not.toContain("Error:");
    });
  });
});
