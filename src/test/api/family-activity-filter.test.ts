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
vi.mock("@neontdatabase/serverless", () => ({
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
import {
  createMockFamilyMembership,
  createMockFamily,
  createMockPost,
  createMockComment,
  createMockReaction,
  createMockCalendarEvent,
} from "@/test/factories";

describe("/api/family/activity - filtering", () => {
  const mockFamily = createMockFamily({ id: "family_123", name: "The Smiths" });
  const mockMembership = createMockFamilyMembership({
    familyId: "family_123",
    userId: "user_123",
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });

    const membershipWithFamily = { ...mockMembership, family: mockFamily };
    mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);
  });

  describe("timeRange parameter", () => {
    it("returns 400 for invalid timeRange", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&timeRange=invalid"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid timeRange");
    });

    it("accepts timeRange=24h", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&timeRange=24h"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts timeRange=7d", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&timeRange=7d"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts timeRange=all", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&timeRange=all"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("defaults to all when timeRange not specified", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe("types parameter", () => {
    it("returns 400 for invalid activity type", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=invalid"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid activity type");
    });

    it("accepts single type=post", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=post"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts multiple types=post,comment", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=post,comment"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts all valid types", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=post,comment,reaction,event"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("returns 400 for mixed valid/invalid types", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=post,invalid"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
    });
  });

  describe("members parameter", () => {
    it("accepts single member ID", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&members=user_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("accepts multiple member IDs", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&members=user_123,user_456"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("filters activities by member IDs", async () => {
      const post = createMockPost({
        id: "post_1",
        familyId: "family_123",
        authorId: "user_123",
        authorName: "Mom",
      });

      mockPostsFindMany.mockResolvedValue([post]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      // Filter for different user
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&members=user_456"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      // Post by Mom (user_123) should be filtered out
      expect(json.items).toEqual([]);
    });

    it("returns activities for matching member", async () => {
      const post = createMockPost({
        id: "post_1",
        familyId: "family_123",
        authorId: "user_123",
        authorName: "Mom",
      });

      mockPostsFindMany.mockResolvedValue([post]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      // Filter for same user
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&members=user_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toHaveLength(1);
      expect(json.items[0].actor.id).toBe("user_123");
    });
  });

  describe("combined filtering", () => {
    it("accepts all filter parameters together", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&timeRange=7d&types=post,comment&members=user_123,user_456&limit=10"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("filters by type and member together", async () => {
      const post = createMockPost({
        id: "post_1",
        familyId: "family_123",
        authorId: "user_123",
        authorName: "Mom",
      });

      const comment = createMockComment({
        id: "comment_1",
        postId: "post_1",
        authorId: "user_456", // Different user
        authorName: "Dad",
      });

      mockPostsFindMany.mockResolvedValue([post]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([comment]);
      mockReactionsFindMany.mockResolvedValue([]);

      // Filter for posts only, by user_123
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&types=post&members=user_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toHaveLength(1);
      expect(json.items[0].type).toBe("post");
      expect(json.items[0].actor.id).toBe("user_123");
    });
  });

  describe("validation edge cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 400 for limit=51", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&limit=51"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("limit must be between 1 and 50");
    });

    it("returns 400 for limit=abc", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&limit=abc"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid cursor", async () => {
      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&cursor=not-a-date"
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid cursor format");
    });

    it("accepts valid ISO cursor", async () => {
      mockPostsFindMany.mockResolvedValue([]);
      mockEventsFindMany.mockResolvedValue([]);
      mockCommentsFindMany.mockResolvedValue([]);
      mockReactionsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/family/activity?familyId=family_123&cursor=2026-04-01T12:00:00Z"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });
});
