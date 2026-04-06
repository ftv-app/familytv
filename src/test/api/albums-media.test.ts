import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockAlbumsFindFirst = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockExecute = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      albums: {
        findFirst: (...args: unknown[]) => mockAlbumsFindFirst(...args),
      },
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
      },
    },
    execute: (...args: unknown[]) => mockExecute(...args),
  },
  albums: {},
  familyMemberships: {},
  posts: {},
}));

import { GET } from "@/app/api/albums/[id]/media/route";
import { createMockAlbum, createMockFamily, createMockFamilyMembership } from "@/test/factories";

const TEST_USER_ID = "user_test123";

describe("GET /api/albums/[id]/media", { testTimeout: 30000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });

    const req = new NextRequest("http://localhost/api/albums/album_123/media");
    const res = await GET(req, { params: Promise.resolve({ id: "album_123" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when album does not exist", async () => {
    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockAlbumsFindFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/albums/album_123/media");
    const res = await GET(req, { params: Promise.resolve({ id: "album_123" }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member", async () => {
    const family = createMockFamily();
    const album = createMockAlbum({ familyId: family.id });

    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockAlbumsFindFirst.mockResolvedValueOnce(album);
    mockMembershipsFindFirst.mockResolvedValueOnce(null);

    const req = new NextRequest(`http://localhost/api/albums/${album.id}/media`);
    const res = await GET(req, { params: Promise.resolve({ id: album.id }) });
    expect(res.status).toBe(403);
  });

  it("returns media items for valid album and member", async () => {
    const family = createMockFamily();
    const album = createMockAlbum({ familyId: family.id });

    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockAlbumsFindFirst.mockResolvedValueOnce(album);
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );

    const serverTimestamp = new Date().toISOString();
    mockExecute.mockResolvedValueOnce([
      {
        id: "post_1",
        media_url: "https://example.vercel-storage.com/fam_123/user_123/photo1.jpg",
        caption: "Beach day!",
        server_timestamp: serverTimestamp,
        author_name: "Dad",
      },
      {
        id: "post_2",
        media_url: "https://example.vercel-storage.com/fam_123/user_123/photo2.jpg",
        caption: null,
        server_timestamp: serverTimestamp,
        author_name: "Mom",
      },
    ]);

    const req = new NextRequest(`http://localhost/api/albums/${album.id}/media`);
    const res = await GET(req, { params: Promise.resolve({ id: album.id }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.media).toHaveLength(2);
    expect(body.media[0].id).toBe("post_1");
    expect(body.media[0].mediaUrl).toContain("vercel-storage.com");
    expect(body.media[0].caption).toBe("Beach day!");
    expect(body.media[0].authorName).toBe("Dad");
  });

  it("returns empty array when album has no media", async () => {
    const family = createMockFamily();
    const album = createMockAlbum({ familyId: family.id });

    mockAuth.mockResolvedValueOnce({ userId: TEST_USER_ID });
    mockAlbumsFindFirst.mockResolvedValueOnce(album);
    mockMembershipsFindFirst.mockResolvedValueOnce(
      createMockFamilyMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockExecute.mockResolvedValueOnce([]);

    const req = new NextRequest(`http://localhost/api/albums/${album.id}/media`);
    const res = await GET(req, { params: Promise.resolve({ id: album.id }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.media).toHaveLength(0);
  });
});
