import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockAlbumsFindFirst = vi.fn();
const mockPut = vi.fn();
const mockDbExecute = vi.fn();

// Mock Vercel Blob
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database using factory pattern (same as comments.test.ts)
vi.mock("@/db", () => {
  const mockDb = {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
      },
      albums: {
        findFirst: (...args: unknown[]) => mockAlbumsFindFirst(...args),
      },
    },
    execute: (...args: unknown[]) => mockDbExecute(...args),
  };
  return {
    db: mockDb,
    posts: {},
    familyMemberships: {},
    albums: {},
  };
});

import { POST } from "@/app/api/upload/route";
import { createMockFamily, createMockFamilyMembership, createMockAlbum } from "@/test/factories";

const TEST_USER_ID = "user_test123";

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when file is missing", async () => {
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });

    const formData = new FormData();
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("file");
  });

  it("returns 400 when familyId is missing", async () => {
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("familyId");
  });

  it("returns 403 when user is not a family member", async () => {
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(null);

    const family = createMockFamily();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("uploads file successfully and creates post without album", async () => {
    const family = createMockFamily();
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    mockPut.mockResolvedValueOnce({
      url: "https://example.vercel-storage.com/fam_123/user_123/12345-abc.png",
    });

    // Mock the post INSERT — return value is the rows array from the RETURNING clause
    const serverTimestamp = new Date().toISOString();
    mockDbExecute.mockResolvedValueOnce([
      {
        id: "post_123",
        family_id: family.id,
        author_id: TEST_USER_ID,
        content_type: "image/png",
        media_url: "https://example.vercel-storage.com/fam_123/user_123/12345-abc.png",
        caption: null,
        album_id: null,
        server_timestamp: serverTimestamp,
      },
    ]);

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "photo.png");
    formData.append("filename", "photo.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("https://example.vercel-storage.com/");
    expect(body.post).toBeDefined();
    expect(body.post.id).toBe("post_123");
    expect(body.post.mediaUrl).toContain("https://example.vercel-storage.com/");
    expect(body.post.albumId).toBeNull();
  });

  it("uploads with albumId and creates linked post", async () => {
    const family = createMockFamily();
    const album = createMockAlbum({ familyId: family.id });

    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockAlbumsFindFirst.mockResolvedValueOnce(album);

    mockPut.mockResolvedValueOnce({
      url: "https://example.vercel-storage.com/fam_123/user_123/video.mp4",
    });

    const serverTimestamp = new Date().toISOString();
    mockDbExecute.mockResolvedValueOnce([
      {
        id: "post_456",
        family_id: family.id,
        author_id: TEST_USER_ID,
        content_type: "video/mp4",
        media_url: "https://example.vercel-storage.com/fam_123/user_123/video.mp4",
        caption: "Beach day!",
        album_id: album.id,
        server_timestamp: serverTimestamp,
      },
    ]);

    const formData = new FormData();
    formData.append("file", new Blob(["videodata"], { type: "video/mp4" }), "video.mp4");
    formData.append("filename", "video.mp4");
    formData.append("contentType", "video/mp4");
    formData.append("familyId", family.id);
    formData.append("albumId", album.id);
    formData.append("caption", "Beach day!");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.post.albumId).toBe(album.id);
    expect(body.post.caption).toBe("Beach day!");
  });

  it("returns 400 for disallowed content type", async () => {
    const family = createMockFamily();
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "application/pdf" }), "doc.pdf");
    formData.append("filename", "doc.pdf");
    formData.append("contentType", "application/pdf");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("content type");
  });

  it("returns 404 when albumId belongs to different family", async () => {
    const family = createMockFamily();
    const otherFamily = createMockFamily();
    const album = createMockAlbum({ familyId: otherFamily.id });

    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    // Album exists but belongs to a different family
    mockAlbumsFindFirst.mockResolvedValueOnce(album);

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "photo.png");
    formData.append("filename", "photo.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);
    formData.append("albumId", album.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 500 when blob upload fails", async () => {
    const family = createMockFamily();
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockPut.mockRejectedValueOnce(new Error("Upload failed"));

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "photo.png");
    formData.append("filename", "photo.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to upload file");
  });

  it("accepts video content types", async () => {
    const family = createMockFamily();
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    mockPut.mockResolvedValueOnce({
      url: "https://example.vercel-storage.com/fam_123/user_123/video.mp4",
    });

    const serverTimestamp = new Date().toISOString();
    mockDbExecute.mockResolvedValueOnce([
      {
        id: "post_video",
        family_id: family.id,
        author_id: TEST_USER_ID,
        content_type: "video/mp4",
        media_url: "https://example.vercel-storage.com/fam_123/user_123/video.mp4",
        caption: null,
        album_id: null,
        server_timestamp: serverTimestamp,
      },
    ]);

    const formData = new FormData();
    formData.append("file", new Blob(["videodata"], { type: "video/mp4" }), "video.mp4");
    formData.append("filename", "video.mp4");
    formData.append("contentType", "video/mp4");
    formData.append("familyId", family.id);

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
