import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Node.js built-in modules that cause issues in jsdom environment
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

// Create mock functions
const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();
const mockCommentsFindMany = vi.fn();
const mockCommentsFindFirst = vi.fn();
const mockCommentsInsert = vi.fn();
const mockCommentsDelete = vi.fn();
const mockPostsFindFirst = vi.fn();
const mockMembershipsFindFirst = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  currentUser: (...args: unknown[]) => mockCurrentUser(...args),
}));

// Mock database - define mockDb inside factory to avoid hoisting issues
vi.mock("@/db", () => {
  const mockDb = {
    query: {
      posts: {
        findFirst: (...args: unknown[]) => mockPostsFindFirst(...args),
      },
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
      },
      comments: {
        findMany: (...args: unknown[]) => mockCommentsFindMany(...args),
        findFirst: (...args: unknown[]) => mockCommentsFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockCommentsInsert(...args),
    delete: (...args: unknown[]) => mockCommentsDelete(...args),
  };
  return {
    db: mockDb,
    posts: {},
    familyMemberships: {},
    comments: {},
  };
});

import { GET, POST, DELETE } from "@/app/api/comments/route";
import { createMockComment } from "@/test/factories";

describe("/api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/comments?postId=post_123");
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when postId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/comments");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("postId required");
    });

    it("returns comments for valid postId", async () => {
      const comments = [createMockComment({ postId: "post_123" })];
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      // Mock post lookup
      mockPostsFindFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      
      // Mock membership lookup
      mockMembershipsFindFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockCommentsFindMany.mockResolvedValue(comments as any);
      
      const req = new NextRequest("http://localhost/api/comments?postId=post_123");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.comments).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", content: "Great post!" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when postId or content is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("postId and content required");
    });

    it("returns 400 when content is empty", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", content: "   " }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    it("creates a comment successfully", async () => {
      const comment = createMockComment({ postId: "post_123", authorId: "user_123" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockCurrentUser.mockResolvedValue({ 
        firstName: "John", 
        emailAddresses: [] 
      } as any);
      
      // Mock post lookup
      mockPostsFindFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      
      // Mock membership lookup
      mockMembershipsFindFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockCommentsInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([comment]),
        }),
      } as any);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", content: "Great post!" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.comment).toBeDefined();
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/comments?id=comment_123", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when id is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("id required");
    });

    it("deletes comment successfully", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      // Mock comment lookup with post relation
      mockCommentsFindFirst.mockResolvedValue({
        id: "comment_123",
        postId: "post_123",
        authorId: "user_123",
        post: {
          id: "post_123",
          familyId: "family_123",
        },
      } as any);
      
      // Mock membership lookup
      mockMembershipsFindFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockCommentsDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue({} as any),
      } as any);
      
      const req = new NextRequest("http://localhost/api/comments?id=comment_123", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns 404 when comment not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockCommentsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments?id=nonexistent", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not a family member (DELETE)", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      mockCommentsFindFirst.mockResolvedValue({
        id: "comment_123",
        postId: "post_123",
        authorId: "user_123",
        post: {
          id: "post_123",
          familyId: "family_123",
        },
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments?id=comment_123", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(403);
    });
  });

  describe("GET - error branches", () => {
    it("returns 404 when post not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockPostsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments?postId=nonexistent");
      const res = await GET(req);
      
      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not a family member (GET)", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockPostsFindFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments?postId=post_123");
      const res = await GET(req);
      
      expect(res.status).toBe(403);
    });
  });

  describe("POST - error branches", () => {
    it("returns 404 when post not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockPostsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "nonexistent", content: "Hello" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not a family member (POST)", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockPostsFindFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", content: "Hello" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(403);
    });
  });
});
