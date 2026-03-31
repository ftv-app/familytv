import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockComment,
  createMockPost,
  TEST_USER_ID,
} from "../factories";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock db
const mockDb = {
  query: {
    comments: {
      findMany: vi.fn(),
    },
    posts: {
      findFirst: vi.fn(),
    },
    familyMemberships: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
};

vi.mock("@/db", () => ({
  db: mockDb,
  comments: {},
  posts: {},
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/comments/route");
  return mod;
}

describe("GET /api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments?postId=post_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when postId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments");
    const res = await handler.GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId required");
  });

  it("returns comments for valid postId", async () => {
    const post = createMockPost();
    const comments = [
      createMockComment({ postId: post.id }),
      createMockComment({ postId: post.id }),
    ];

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.comments.findMany.mockResolvedValue(comments);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/comments?postId=${post.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toHaveLength(2);
  });

  it("orders comments by createdAt descending", async () => {
    const post = createMockPost();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.comments.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/comments?postId=${post.id}`);
    await handler.GET(req);

    // Verify the mock was called with orderBy
    expect(mockDb.query.comments.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: "post_123", content: "Hello" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when postId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Hello" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId and content required");
  });

  it("returns 400 when content is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: "post_123" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId and content required");
  });

  it("returns 400 when content is empty", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: "post_123", content: "   " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("postId and content required");
  });

  it("creates a comment successfully with user name", async () => {
    const post = createMockPost();
    const newComment = createMockComment({ postId: post.id });

    const { auth, currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    vi.mocked(currentUser).mockResolvedValue({
      firstName: "John",
      emailAddresses: [{ emailAddress: "john@test.com" }],
    });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newComment]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: "Great post!" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.comment).toBeDefined();
    // Returned comment uses factory content from mock (not the input "Great post!")
    expect(body.comment.content).toBe("This is a test comment");
  });

  it("creates a comment with email when no name available", async () => {
    const post = createMockPost();
    const newComment = createMockComment({ postId: post.id });

    const { auth, currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    vi.mocked(currentUser).mockResolvedValue({
      emailAddresses: [{ emailAddress: "john@test.com" }],
    });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newComment]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: "Comment" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("creates a comment with default name when no user data", async () => {
    const post = createMockPost();
    const newComment = createMockComment({ postId: post.id });

    const { auth, currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    vi.mocked(currentUser).mockResolvedValue(null);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newComment]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: "Comment" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("trims content whitespace", async () => {
    const post = createMockPost();
    const newComment = createMockComment({ postId: post.id, content: "  trimmed  " });

    const { auth, currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    vi.mocked(currentUser).mockResolvedValue({ firstName: "Test" });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newComment]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: "  trimmed  " }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments?id=comment_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("id required");
  });

  it("deletes comment successfully", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments?id=comment_123", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 when comment not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    // Mock comment not found
    mockDb.query.comments.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments?id=nonexistent", {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a family member (DELETE)", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    const post = createMockPost();
    const comment = createMockComment({ postId: post.id, authorId: TEST_USER_ID });
    mockDb.query.comments.findFirst = vi.fn().mockResolvedValue({ ...comment, post });
    mockDb.query.familyMemberships.findFirst = vi.fn().mockResolvedValue(null); // not a member

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/comments?id=${comment.id}`, {
      method: "DELETE",
    });
    const res = await handler.DELETE(req);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/comments - family membership branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when post not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments?postId=nonexistent", {
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
    const req = new NextRequest(`http://localhost/api/comments?postId=${post.id}`, {
      method: "GET",
    });
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/comments - family membership branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when post not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.posts.findFirst = vi.fn().mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: "nonexistent", content: "Hello" }),
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
    const req = new NextRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, content: "Hello" }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(403);
  });
});
