import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockPost,
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
    posts: {
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
  posts: {},
  familyMemberships: {},
}));

// Import route handlers after mocks
async function getHandler() {
  const mod = await import("@/app/api/posts/route");
  return mod;
}

describe("GET /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when familyId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts");
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
    const req = new NextRequest("http://localhost/api/posts?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("returns posts for authenticated family member", async () => {
    const family = createMockFamily();
    const posts = [
      createMockPost({ familyId: family.id }),
      createMockPost({ familyId: family.id }),
    ];

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue(posts);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/posts?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.posts).toHaveLength(2);
    // authorId should be stripped from response
    expect(body.posts[0]).not.toHaveProperty("authorId");
  });
});

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", contentType: "text" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid family ID", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: 123, contentType: "text" }),
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
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ contentType: "text" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid family ID");
  });

  it("returns 400 for invalid contentType", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", contentType: "audio" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("contentType must be 'video', 'image', or 'text'");
  });

  it("returns 400 for image post without mediaUrl", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", contentType: "image" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("mediaUrl is required for video/image posts");
  });

  it("returns 400 for video post without mediaUrl", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", contentType: "video" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("mediaUrl is required for video/image posts");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: "fam_123", contentType: "text" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("creates a text post successfully", async () => {
    const family = createMockFamily();
    const newPost = createMockPost({ familyId: family.id });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({
      userId: TEST_USER_ID,
      user: { fullName: "John Doe" },
    });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newPost]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        contentType: "text",
        caption: "Hello family!",
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.post).toBeDefined();
    expect(body.post.familyId).toBe(family.id);
  });

  it("creates an image post successfully", async () => {
    const family = createMockFamily();
    const newPost = createMockPost({
      familyId: family.id,
      contentType: "image",
      mediaUrl: "https://blob.vercel.com/image.jpg",
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newPost]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        contentType: "image",
        mediaUrl: "https://blob.vercel.com/image.jpg",
        caption: "Family photo",
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.post.mediaUrl).toBe("https://blob.vercel.com/image.jpg");
  });

  it("creates a video post successfully", async () => {
    const family = createMockFamily();
    const newPost = createMockPost({
      familyId: family.id,
      contentType: "video",
      mediaUrl: "https://blob.vercel.com/video.mp4",
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newPost]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        contentType: "video",
        mediaUrl: "https://blob.vercel.com/video.mp4",
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("uses firstName when fullName is not available", async () => {
    const family = createMockFamily();
    const newPost = createMockPost({ familyId: family.id });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({
      userId: TEST_USER_ID,
      user: { firstName: "Jane" },
    });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newPost]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, contentType: "text" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("uses default name when no user name available", async () => {
    const family = createMockFamily();
    const newPost = createMockPost({ familyId: family.id });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newPost]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ familyId: family.id, contentType: "text" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });
});
