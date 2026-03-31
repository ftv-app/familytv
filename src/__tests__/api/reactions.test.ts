import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockReaction,
  createMockPost,
  TEST_USER_ID,
} from "../factories";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock db
const mockDb = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
  query: {
    posts: {
      findFirst: vi.fn(),
    },
    familyMemberships: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn(),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
};

vi.mock("@/db", () => ({
  db: mockDb,
  reactions: {},
  posts: {},
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/reactions/route");
  return mod;
}

describe("GET /api/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions?postId=post_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when postId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions");
    const res = await handler.GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId required");
  });

  it("returns grouped reactions for valid postId", async () => {
    const post = createMockPost();
    const reactions = [
      { emoji: "👍", count: 5 },
      { emoji: "❤️", count: 3 },
    ];

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    
    // Setup the chain
    const mockWhere = vi.fn().mockReturnValue({
      groupBy: vi.fn().mockResolvedValue(reactions),
    });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    mockDb.select.mockReturnValue(mockSelect);
    // Also set up top-level chain (used before mockReturnValue is called)
    mockDb.select.mockImplementation(() => ({ from: mockFrom }));

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/reactions?postId=${post.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reactions).toBeDefined();
  });
});

describe("POST /api/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: "post_123", emoji: "👍" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when postId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ emoji: "👍" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId and emoji required");
  });

  it("returns 400 when emoji is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: "post_123" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId and emoji required");
  });

  it("upserts reaction successfully", async () => {
    const post = createMockPost();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn(),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, emoji: "👍" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("upserts reaction with different emoji", async () => {
    const post = createMockPost();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn(),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, emoji: "❤️" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions?postId=post_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when postId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId required");
  });

  it("deletes reaction successfully", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions?postId=post_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("GET /api/reactions - family membership branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when post not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions?postId=nonexistent", {
      method: "GET",
    });
    const res = await handler.GET(req);

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member (GET)", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    const post = createMockPost();
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(post);
    mockDb.query.familyMemberships.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/reactions?postId=${post.id}`, {
      method: "GET",
    });
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/reactions - family membership branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when post not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: "nonexistent", emoji: "👍" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member (POST)", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    const post = createMockPost();
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(post);
    mockDb.query.familyMemberships.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, emoji: "👍" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/reactions - family membership branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when post not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/reactions?postId=nonexistent", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member (DELETE)", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    const post = createMockPost();
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(post);
    mockDb.query.familyMemberships.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/reactions?postId=${post.id}`, {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(403);
  });
});
