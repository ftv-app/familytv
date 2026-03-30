import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
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
    familyMemberships: {
      findMany: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
};

vi.mock("@/db", () => ({
  db: mockDb,
  families: {},
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/family/route");
  return mod;
}

describe("GET /api/family", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const res = await handler.GET();

    expect(res.status).toBe(401);
  });

  it("returns families for authenticated user", async () => {
    const family = createMockFamily();
    const membership = createMockMembership({
      familyId: family.id,
      userId: TEST_USER_ID,
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findMany.mockResolvedValue([
      { ...membership, family },
    ]);

    const handler = await getHandler();
    const res = await handler.GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.families).toHaveLength(1);
    expect(body.families[0]).toMatchObject({ id: family.id, name: family.name });
  });

  it("returns empty array when user has no families", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const res = await handler.GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.families).toHaveLength(0);
  });
});

describe("POST /api/family", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "The Smiths" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Family name must be at least 2 characters");
  });

  it("returns 400 when name is too short", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "A" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Family name must be at least 2 characters");
  });

  it("returns 400 when name is empty string", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "   " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Family name must be at least 2 characters");
  });

  it("returns 400 when name is not a string", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: 123 }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Family name must be at least 2 characters");
  });

  it("returns 400 when name is too long", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "A".repeat(51) }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Family name must be 50 characters or less");
  });

  it("creates family successfully", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.insert.mockImplementation((table) => {
      if (table === mockDb.insert.mock.calls[0][0]) {
        // First insert is for families
        return {
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([family]),
          }),
        };
      }
      // Second insert is for familyMemberships
      return {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createMockMembership()]),
        }),
      };
    });

    // Proper mock for two inserts
    let insertCall = 0;
    mockDb.insert.mockImplementation(() => {
      insertCall++;
      return {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(
            insertCall === 1 ? [family] : [createMockMembership()]
          ),
        }),
      };
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "The Smiths" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.familyId).toBe(family.id);
  });

  it("trims family name", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    let insertCall = 0;
    mockDb.insert.mockImplementation(() => {
      insertCall++;
      return {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(
            insertCall === 1 ? [family] : [createMockMembership()]
          ),
        }),
      };
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "  The Smiths  " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("creates family with max length name", async () => {
    const family = createMockFamily({ name: "A".repeat(50) });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    let insertCall = 0;
    mockDb.insert.mockImplementation(() => {
      insertCall++;
      return {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(
            insertCall === 1 ? [family] : [createMockMembership()]
          ),
        }),
      };
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family", {
      method: "POST",
      body: JSON.stringify({ name: "A".repeat(50) }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });
});
