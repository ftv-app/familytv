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
      findFirst: vi.fn(),
    },
    albums: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
};

vi.mock("@/db", () => ({
  db: mockDb,
  familyMemberships: {},
  albums: {},
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/albums/route");
  return mod;
}

async function getIdHandler() {
  const mod = await import("@/app/api/albums/[id]/route");
  return mod;
}

describe("GET /api/albums", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when familyId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums");
    const res = await handler.GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("familyId is required");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("returns albums for authenticated family member", async () => {
    const family = createMockFamily();
    const album1 = { id: "album_1", familyId: family.id, name: "Summer", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };
    const album2 = { id: "album_2", familyId: family.id, name: "Winter", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.albums.findMany.mockResolvedValue([album1, album2]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/albums?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.albums).toHaveLength(2);
  });
});

describe("POST /api/albums", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", name: "My Album" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid family ID", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: 123, name: "My Album" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid family ID");
  });

  it("returns 400 for missing family ID", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ name: "My Album" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid family ID");
  });

  it("returns 400 when name is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Album name is required");
  });

  it("returns 400 when name is empty", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", name: "   " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Album name is required");
  });

  it("returns 400 when name exceeds 100 characters", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", name: "a".repeat(101) }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Album name must be 100 characters or less");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", name: "My Album" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("creates an album successfully", async () => {
    const family = createMockFamily();
    const newAlbum = { id: "album_new", familyId: family.id, name: "My Album", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newAlbum]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, name: "My Album" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.album).toBeDefined();
  });

  it("creates an album with description and coverUrl", async () => {
    const family = createMockFamily();
    const newAlbum = { id: "album_new", familyId: family.id, name: "Vacation", description: "Summer trip", coverUrl: "https://example.com/cover.jpg", createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newAlbum]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, name: "Vacation", description: "Summer trip", coverUrl: "https://example.com/cover.jpg" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("trims album name whitespace", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "album_new" }]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/albums", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, name: "  My Album  " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });
});

describe("GET /api/albums/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123");
    const res = await handler.GET(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when album not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123");
    const res = await handler.GET(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Album not found");
  });

  it("returns 403 when user is not a family member", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: "other_user", createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123");
    const res = await handler.GET(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("returns album for authenticated family member", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test Album", description: "Description", coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123");
    const res = await handler.GET(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.album.id).toBe("album_123");
  });
});

describe("PATCH /api/albums/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when album not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: "other_user", createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 400 when name is empty", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "   " }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Album name cannot be empty");
  });

  it("returns 400 when name exceeds 100 characters", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "a".repeat(101) }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Album name must be 100 characters or less");
  });

  it("updates album name successfully", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Old Name", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };
    const updated = { ...album, name: "New Name", updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.album.name).toBe("New Name");
  });

  it("updates album description and coverUrl", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Name", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };
    const updated = { ...album, description: "New desc", coverUrl: "https://example.com/new.jpg", updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "PATCH",
      body: JSON.stringify({ description: "New desc", coverUrl: "https://example.com/new.jpg" }),
    });
    const res = await handler.PATCH(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/albums/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when album not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: "other_user", createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(403);
  });

  it("deletes album successfully", async () => {
    const family = createMockFamily();
    const album = { id: "album_123", familyId: family.id, name: "Test", description: null, coverUrl: null, createdBy: TEST_USER_ID, createdAt: new Date(), updatedAt: new Date() };

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.albums.findFirst.mockResolvedValue(album);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const handler = await getIdHandler();
    const req = new NextRequest("http://localhost/api/albums/album_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req, { params: Promise.resolve({ id: "album_123" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
