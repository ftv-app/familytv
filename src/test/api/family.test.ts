import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindMany = vi.fn();
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
        findMany: (...args: unknown[]) => mockMembershipsFindMany(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
  families: {},
  familyMemberships: {},
}));

import { GET, POST } from "@/app/api/family/route";
import { createMockFamily, createMockFamilyMembership } from "@/test/factories";

describe("/api/family", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const res = await GET();
      
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns user's families", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindMany.mockResolvedValue([
        { ...membership, family } as any,
      ]);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.families).toHaveLength(1);
      expect(json.families[0].name).toBe("The Smiths");
    });

    it("returns empty array when user has no families", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindMany.mockResolvedValue([]);
      
      const res = await GET();
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.families).toHaveLength(0);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({ name: "The Johnsons" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when name is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Family name must be at least 2 characters");
    });

    it("returns 400 when name is too short", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({ name: "A" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Family name must be at least 2 characters");
    });

    it("returns 400 when name is too long", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({ name: "A".repeat(51) }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Family name must be 50 characters or less");
    });

    it("creates family successfully", async () => {
      const family = createMockFamily({ name: "The Johnsons" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInsert
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([family]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        });
      
      const req = new NextRequest("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({ name: "The Johnsons" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.familyId).toBe(family.id);
    });
  });
});
