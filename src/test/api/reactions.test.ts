import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/db";

// Create mock functions
const mockAuth = vi.fn();
const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbDelete = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      posts: {
        findFirst: vi.fn(),
      },
      familyMemberships: {
        findFirst: vi.fn(),
      },
    },
    select: (...args: unknown[]) => mockDbSelect(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
    delete: (...args: unknown[]) => mockDbDelete(...args),
  },
  posts: {},
  familyMemberships: {},
  reactions: {},
}));

import { GET, POST, DELETE } from "@/app/api/reactions/route";

describe("/api/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/reactions?postId=post_123");
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when postId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/reactions");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("postId required");
    });

    it("returns reaction counts for valid postId", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      // Mock post lookup
      const mockPostsQuery = vi.mocked(db.query.posts);
      mockPostsQuery.findFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      
      // Mock membership lookup
      const mockMembershipsQuery = vi.mocked(db.query.familyMemberships);
      mockMembershipsQuery.findFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { emoji: "👍", count: 5 },
              { emoji: "❤️", count: 3 },
            ]),
          }),
        }),
      } as any);
      
      const req = new NextRequest("http://localhost/api/reactions?postId=post_123");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reactions).toHaveLength(2);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", emoji: "👍" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when postId or emoji is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("postId and emoji required");
    });

    it("adds reaction successfully", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      // Mock post lookup
      const mockPostsQuery = vi.mocked(db.query.posts);
      mockPostsQuery.findFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      
      // Mock membership lookup
      const mockMembershipsQuery = vi.mocked(db.query.familyMemberships);
      mockMembershipsQuery.findFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            set: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);
      
      const req = new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ postId: "post_123", emoji: "👍" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/reactions?postId=post_123", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when postId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/reactions", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(400);
    });

    it("deletes reaction successfully", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      // Mock post lookup
      const mockPostsQuery = vi.mocked(db.query.posts);
      mockPostsQuery.findFirst.mockResolvedValue({
        id: "post_123",
        familyId: "family_123",
      } as any);
      
      // Mock membership lookup
      const mockMembershipsQuery = vi.mocked(db.query.familyMemberships);
      mockMembershipsQuery.findFirst.mockResolvedValue({
        id: "membership_123",
        familyId: "family_123",
        userId: "user_123",
      } as any);
      
      mockDbDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue({} as any),
      } as any);
      
      const req = new NextRequest("http://localhost/api/reactions?postId=post_123", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
