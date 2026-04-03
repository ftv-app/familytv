import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockInvite,
  createMockFamily,
  createMockMembership,
  TEST_USER_ID,
} from "../factories";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock db
const mockDb = {
  query: {
    familyMemberships: { findFirst: vi.fn() },
    invites: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
  transaction: vi.fn(),
};

vi.mock("@/db", () => ({
  db: mockDb,
  invites: {},
  familyMemberships: {},
  families: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/invite/route");
  return mod;
}

describe("POST /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when familyId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid family ID");
  });

  it("returns 400 when email is invalid", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", email: "not-an-email" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid email address");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", email: "test@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when invite already exists for email", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.invites.findFirst.mockResolvedValue(createMockInvite({ familyId: family.id }));

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, email: "test@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("An invite has already been sent to this email");
  });

  it("creates invite and returns 201", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.invites.findFirst.mockResolvedValue(null); // no existing invite
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([createMockInvite()]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, email: "newmember@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.inviteLink).toBeDefined();
    expect(body.expiresAt).toBeDefined();
  });
});

describe("GET /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when token is missing", async () => {
    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite");
    const res = await handler.GET(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Token required");
  });

  it("returns 404 for invalid token", async () => {
    mockDb.query.invites.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite?token=invalid");
    const res = await handler.GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 for expired invite", async () => {
    const invite = createMockInvite({
      expiresAt: new Date(Date.now() - 1000),
      status: "pending",
    });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite?token=sometoken");
    const res = await handler.GET(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("This invite has expired");
  });

  it("returns invite details for valid token", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
      family,
    });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite?token=validtoken");
    const res = await handler.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.family.name).toBe(family.name);
    expect(body.email).toBe(invite.email);
  });
});

describe("PATCH /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ token: "sometoken" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when token is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Token required");
  });

  it("returns 404 for invalid token", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.invites.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ token: "invalid" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(404);
  });

  it("accepts invite and creates membership", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
      family,
    });
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null); // not already a member
    mockDb.transaction.mockImplementation(async (fn) => {
      await fn(mockDb);
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ token: "validtoken" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(200);
    expect(mockDb.transaction).toHaveBeenCalled();
  });

  it("returns 400 when already a member", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
      family,
    });
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(createMockMembership());

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ token: "validtoken" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("You are already a member of this family");
  });

  it("returns 400 when invite already used or revoked", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "accepted", // not pending
      expiresAt: new Date(Date.now() + 86400000),
      family,
    });
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ inviteId: invite.id, token: "sometoken" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("This invite has already been used or revoked");
  });

  it("returns 400 when token does not match", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
      tokenHash: "correct_hash",
      family,
    });
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);

    const handler = await getHandler();
    // Use a different token that won't match the stored hash
    const req = new NextRequest("http://localhost/api/invite", {
      method: "PATCH",
      body: JSON.stringify({ inviteId: invite.id, token: "wrong_token" }),
    });
    const res = await handler.PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid token");
  });
});

describe("GET /api/invite - additional branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when invite already used or expired (GET)", async () => {
    const family = createMockFamily();
    const invite = createMockInvite({
      familyId: family.id,
      status: "accepted", // already used
      expiresAt: new Date(Date.now() + 86400000),
      family,
    });
    mockDb.query.invites.findFirst.mockResolvedValue(invite);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/invite?inviteId=${invite.id}`, {
      method: "GET",
    });
    const res = await handler.GET(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("This invite has already been used or expired");
  });
});

describe("POST /api/invite - additional branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when person is already a member of the family", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    // No existing invite, so it would proceed to check membership
    mockDb.query.invites.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, email: "newmember@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("This person is already a member of your family");
  });

  it("returns 403 when user is not a family member (explicit)", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    // Explicitly mock membership as null to ensure 403 is hit
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);
    mockDb.query.invites.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/invite", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, email: "test@example.com" }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(403);
  });
});
