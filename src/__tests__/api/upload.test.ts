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

// Mock Vercel Blob
vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

// Mock db
const mockDb = {
  query: {
    familyMemberships: { findFirst: vi.fn() },
  },
};

vi.mock("@/db", () => ({
  db: mockDb,
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/upload/route");
  return mod;
}

describe("POST /api/upload", { testTimeout: 30000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when file is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("file");
  });

  it("returns 400 when familyId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("familyId");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(403);
  });

  it("uploads file successfully and returns URL", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const { put } = await import("@vercel/blob");
    vi.mocked(put).mockResolvedValue({
      url: "https://example.vercel-storage.com/fam_123/user_123/12345-abc.png",
    });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "photo.png");
    formData.append("filename", "photo.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("https://example.vercel-storage.com/");
  });

  it("returns 500 when blob upload fails", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const { put } = await import("@vercel/blob");
    vi.mocked(put).mockRejectedValue(new Error("Upload failed"));

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "photo.png");
    formData.append("filename", "photo.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to upload file");
  });

  it("uploads video content type", async () => {
    const family = createMockFamily();
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const { put } = await import("@vercel/blob");
    vi.mocked(put).mockResolvedValue({
      url: "https://example.vercel-storage.com/fam_123/user_123/video.mp4",
    });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["videodata"], { type: "video/mp4" }), "video.mp4");
    formData.append("filename", "video.mp4");
    formData.append("contentType", "video/mp4");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(200);
  });
});
