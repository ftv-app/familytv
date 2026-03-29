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
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockInsert = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      posts: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
    update: vi.fn(),
    delete: vi.fn(),
  },
  posts: {},
  familyMemberships: {},
  families: {},
}));

import { GET, POST } from "@/app/api/posts/route";
import { createMockPost, createMockFamilyMembership } from "@/test/factories";

describe("/api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/posts?familyId=123");
      const res = await GET(req);
      
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 when familyId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/posts");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("familyId is required");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/posts?familyId=family_123");
      const res = await GET(req);
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });

    it("returns posts when user is a member", async () => {
      const membership = createMockFamilyMembership({ userId: "user_123", familyId: "family_123" });
      const posts = [createMockPost({ familyId: "family_123" })];
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockFindFirst.mockResolvedValue(membership);
      mockFindMany.mockResolvedValue(posts as any);
      
      const req = new NextRequest("http://localhost/api/posts?familyId=family_123");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.posts).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", contentType: "text" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid familyId", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: 123, contentType: "text" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid family ID");
    });

    it("returns 400 for invalid contentType", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", contentType: "invalid" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("contentType must be");
    });

    it("returns 400 for media post without mediaUrl", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", contentType: "video" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("mediaUrl is required");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", contentType: "text" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(403);
    });

    it("creates a text post successfully", async () => {
      const membership = createMockFamilyMembership({ userId: "user_123", familyId: "fam_123" });
      const post = createMockPost({ familyId: "fam_123", authorId: "user_123" });
      
      mockAuth.mockResolvedValue({ userId: "user_123", user: { fullName: "John" } } as any);
      mockFindFirst.mockResolvedValue(membership);
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([post]),
        }),
      } as any);
      
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", contentType: "text" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.post).toBeDefined();
    });
  });
});
