import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockMembershipsFindMany = vi.fn();

// Mock Node.js built-in modules
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i * 17 % 256;
    }
    return arr;
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i * 17 % 256;
      }
      return arr;
    }),
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
    },
  },
  familyMemberships: {},
}));

// Import after mocks are set up
import { GET } from "@/app/api/family/presence/route";
import { createMockFamilyMembership, createMockFamily } from "@/test/factories";

describe("/api/family/presence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = new NextRequest("http://localhost/api/family/presence");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("Authorization", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 403 when user is not a family member (with familyId param)", async () => {
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/family/presence?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });

    it("returns 403 when user has no family memberships (no familyId param)", async () => {
      mockMembershipsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/presence");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });
  });

  describe("Successful Response", () => {
    const mockFamily = createMockFamily({ id: "family_123", name: "The Smiths" });
    const mockMembership = createMockFamilyMembership({
      familyId: "family_123",
      userId: "user_123",
    });

    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns correct response shape", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const req = new NextRequest("http://localhost/api/family/presence?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("onlineMembers");
      expect(json).toHaveProperty("timestamp");
      expect(Array.isArray(json.onlineMembers)).toBe(true);
    });

    it("returns empty onlineMembers when no one is online", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const req = new NextRequest("http://localhost/api/family/presence?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.onlineMembers).toEqual([]);
    });

    it("uses first family when familyId not provided", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindMany.mockResolvedValue([membershipWithFamily]);
      mockMembershipsFindFirst.mockResolvedValue(null); // Not called with familyId

      const req = new NextRequest("http://localhost/api/family/presence");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });
});
