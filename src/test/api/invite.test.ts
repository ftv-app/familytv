import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockInvitesFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();

// Mock randomBytes and createHash - must mock the entire crypto module
vi.mock("crypto", () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from("abcd1234abcd1234abcd1234abcd1234", "hex")),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed_token_value"),
    }),
  }),
  default: {
    randomBytes: vi.fn().mockReturnValue(Buffer.from("abcd1234abcd1234abcd1234abcd1234", "hex")),
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue("hashed_token_value"),
      }),
    }),
  },
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
      },
      invites: {
        findFirst: (...args: unknown[]) => mockInvitesFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  invites: {},
  familyMemberships: {},
  families: {},
}));

import { GET, POST, PATCH } from "@/app/api/invite/route";
import { createMockInvite, createMockFamilyMembership, createMockFamily } from "@/test/factories";

describe("/api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST - create invite", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid familyId", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: 123, email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid family ID");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("You are not a member of this family");
    });

    it("returns 400 for invalid email", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(membership);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "invalid-email" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid email address");
    });

    it("returns 400 when user is already a member", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst
        .mockResolvedValueOnce(membership) // membership check
        .mockResolvedValueOnce({} as any); // existing member check
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("This person is already a member of your family");
    });

    it("returns 400 when pending invite already exists", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      const existingInvite = createMockInvite({ familyId: "fam_123", email: "test@example.com", status: "pending" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);
      mockInvitesFindFirst.mockResolvedValue(existingInvite as any);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("An invite has already been sent to this email");
    });

    it("creates invite successfully", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      const createdInvite = { id: "invite_new_123" };
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);
      mockInvitesFindFirst.mockResolvedValue(null);
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdInvite]),
        }),
      } as any);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "POST",
        body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.inviteId).toBe("invite_new_123");
      expect(json.inviteLink).toContain("/invite/");
      expect(json.expiresAt).toBeDefined();
    });
  });

  describe("GET - get invite details", () => {
    it("returns 400 when inviteId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/invite");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("inviteId required");
    });

    it("returns 404 for invalid inviteId", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      mockInvitesFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/invite?inviteId=invalid");
      const res = await GET(req);
      
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Invalid invite");
    });

    it("returns 400 for non-pending invite", async () => {
      const expiredInvite = createMockInvite({ status: "accepted" });
      mockAuth.mockResolvedValue({ userId: null } as any);
      mockInvitesFindFirst.mockResolvedValue(expiredInvite as any);
      
      const req = new NextRequest("http://localhost/api/invite?inviteId=some_invite_id");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("already been used");
    });

    it("returns 400 for expired invite", async () => {
      const expiredInvite = createMockInvite({ 
        status: "pending",
        expiresAt: new Date(Date.now() - 1000) // expired
      });
      mockAuth.mockResolvedValue({ userId: null } as any);
      mockInvitesFindFirst.mockResolvedValue(expiredInvite as any);
      
      const req = new NextRequest("http://localhost/api/invite?inviteId=some_invite_id");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("expired");
    });

    it("returns invite details for valid inviteId", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({ 
        familyId: "fam_123", 
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      mockAuth.mockResolvedValue({ userId: null } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);
      
      const req = new NextRequest("http://localhost/api/invite?inviteId=some_invite_id");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.family.name).toBe("The Smiths");
      expect(json.email).toBe(invite.email);
    });
  });

  describe("PATCH - accept invite", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ token: "some_token" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(401);
    });

    it("accepts invite with only inviteId (UUID-based single-use links)", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({
        familyId: "fam_123",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        id: "invite_123",
        tokenHash: "hashed_token_value",
      });

      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      mockTransaction.mockImplementation(async (cb) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
        return cb(tx);
      });

      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite_123", token: "some_token" }),
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });

    it("accepts invite and creates membership", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({ 
        familyId: "fam_123", 
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        id: "invite_123",
        tokenHash: "hashed_token_value" // matches mock createHash output for "some_token"
      });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      mockTransaction.mockImplementation(async (cb) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          insert: vi.fn().mockReturnValue({ 
            values: vi.fn().mockReturnValue({ 
              returning: vi.fn().mockResolvedValue([]) 
            }) 
          }),
        };
        return cb(tx);
      });
      
      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite_123", token: "some_token" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.family.name).toBe("The Smiths");
    });

    it("returns 400 when invite already used or revoked (PATCH)", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({ 
        familyId: "fam_123", 
        status: "accepted", // not pending
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        id: "invite_123",
        tokenHash: "hashed_token_value",
      });

      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);

      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite_123", token: "some_token" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("This invite has already been used or revoked");
    });

    it("returns 400 when invite is expired (PATCH)", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({ 
        familyId: "fam_123", 
        status: "pending",
        expiresAt: new Date(Date.now() - 1000), // expired
        id: "invite_123",
        tokenHash: "hashed_token_value",
      });

      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);

      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite_123", token: "some_token" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("This invite has expired");
    });

    it("returns 400 when user is already a member of the family (PATCH)", async () => {
      const family = createMockFamily({ id: "fam_123", name: "The Smiths" });
      const invite = createMockInvite({ 
        familyId: "fam_123", 
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        id: "invite_123",
        tokenHash: "hashed_token_value",
      });
      const existingMembership = createMockFamilyMembership({
        familyId: "fam_123",
        userId: "user_123",
      });

      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockInvitesFindFirst.mockResolvedValue({
        ...invite,
        family,
      } as any);
      mockMembershipsFindFirst.mockResolvedValue(existingMembership as any);

      const req = new NextRequest("http://localhost/api/invite", {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite_123", token: "some_token" }),
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("You are already a member of this family");
    });
  });
});
