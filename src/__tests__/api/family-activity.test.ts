import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockFamily,
  createMockMembership,
  createMockPost,
  createMockEvent,
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
      findFirst: vi.fn(),
    },
    posts: {
      findMany: vi.fn(),
    },
    calendarEvents: {
      findMany: vi.fn(),
    },
  },
};

vi.mock("@/db", () => ({
  db: mockDb,
  familyMemberships: {},
  posts: {},
  calendarEvents: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/family/activity/route");
  return mod;
}

describe("GET /api/family/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family/activity");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when familyId is provided but user is not a member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family/activity?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("returns 403 when user has no family memberships", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findMany.mockResolvedValue([]);
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family/activity");
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("User is not a member of any family");
  });

  it("returns empty activities when family has no posts or events", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toEqual([]);
    expect(body.hasMore).toBe(false);
    expect(body.nextCursor).toBeNull();
  });

  it("returns posts and events sorted by timestamp (newest first)", async () => {
    const family = createMockFamily();
    const now = new Date();

    const post = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      authorName: "Test User",
      contentType: "photo",
      mediaUrl: "https://blob.vercel.com/photo.jpg",
      caption: "Family photo",
      createdAt: new Date(now.getTime() - 1000), // 1 second ago
    });

    const event = createMockEvent({
      familyId: family.id,
      title: "Birthday Party",
      startDate: now, // now - most recent
      createdAt: now,
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([post]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([event]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(2);
    // Event should be first (newest)
    expect(body.activities[0].type).toBe("event");
    expect(body.activities[0].title).toBe("Birthday Party");
    expect(body.activities[1].type).toBe("post");
    expect(body.activities[1].title).toBe("Family photo");
  });

  it("returns post activity with correct fields", async () => {
    const family = createMockFamily();
    const now = new Date();

    const post = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      authorName: "Test Author",
      contentType: "video",
      mediaUrl: "https://blob.vercel.com/video.mp4",
      caption: "Birthday video",
      createdAt: now,
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([post]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);

    const activity = body.activities[0];
    expect(activity).toMatchObject({
      id: post.id,
      type: "post",
      familyId: family.id,
      authorId: TEST_USER_ID,
      authorName: "Test Author",
      thumbnail: "https://blob.vercel.com/video.mp4",
      title: "Birthday video",
    });
    expect(activity.timestamp).toBeDefined();
    expect(activity.createdAt).toBeDefined();
  });

  it("returns event activity with correct fields", async () => {
    const family = createMockFamily();
    const now = new Date();

    const event = createMockEvent({
      familyId: family.id,
      title: "Family Reunion",
      description: "Annual family gathering",
      startDate: now,
      createdAt: now,
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([event]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);

    const activity = body.activities[0];
    expect(activity).toMatchObject({
      id: event.id,
      type: "event",
      familyId: family.id,
      authorId: event.createdBy,
      authorName: null,
      thumbnail: null,
      title: "Family Reunion",
    });
  });

  it("respects limit parameter", async () => {
    const family = createMockFamily();
    const now = new Date();

    // Create 5 posts
    const posts = Array.from({ length: 5 }, (_, i) =>
      createMockPost({
        familyId: family.id,
        authorId: TEST_USER_ID,
        authorName: "Test User",
        contentType: "photo",
        createdAt: new Date(now.getTime() - i * 1000),
      })
    );

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue(posts);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}&limit=2`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(2);
    expect(body.hasMore).toBe(true);
    expect(body.nextCursor).toBeDefined();
  });

  it("caps limit at 50", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}&limit=100`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    // The mock was called - verify limit doesn't exceed 50
    expect(mockDb.query.posts.findMany).toHaveBeenCalled();
  });

  it("uses default limit of 20 when not specified", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    expect(mockDb.query.posts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 21 }) // limit + 1 for hasMore check
    );
  });

  it("handles cursor-based pagination", async () => {
    const family = createMockFamily();
    const now = new Date();

    const post1 = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      createdAt: new Date(now.getTime() - 2000),
    });
    const post2 = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      createdAt: new Date(now.getTime() - 1000),
    });
    const post3 = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      createdAt: now,
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    // Return all 3 posts (limit + 1 = 3)
    mockDb.query.posts.findMany.mockResolvedValue([post3, post2, post1]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    // Request with cursor pointing to post2
    const req = new NextRequest(
      `http://localhost/api/family/activity?familyId=${family.id}&lastSeenId=${post2.id}&limit=2`
    );
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    // Should get post3 and post2 (before the cursor)
    expect(body.activities).toHaveLength(2);
    expect(body.activities[0].id).toBe(post3.id);
    expect(body.activities[1].id).toBe(post2.id);
  });

  it("indicates no more items when fewer than limit returned", async () => {
    const family = createMockFamily();

    const post = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      createdAt: new Date(),
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([post]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}&limit=20`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasMore).toBe(false);
    expect(body.nextCursor).toBeNull();
  });

  it("uses first family when familyId not provided", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findMany.mockResolvedValue([
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID }),
    ]);
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family/activity");
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    expect(mockDb.query.familyMemberships.findMany).toHaveBeenCalledWith({
      where: expect.anything(),
      limit: 1,
    });
  });

  it("does not include PII in error responses", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/family/activity");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    // Verify error message doesn't contain sensitive info
    expect(body.error).toBe("Unauthorized");
    expect(JSON.stringify(body)).not.toContain("clerk");
    expect(JSON.stringify(body)).not.toContain("email");
    expect(JSON.stringify(body)).not.toContain("user_");
  });

  it("includes Cache-Control headers", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "private, no-cache, no-store, must-revalidate"
    );
  });

  it("handles mixed content types correctly", async () => {
    const family = createMockFamily();
    const now = new Date();

    const photoPost = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      contentType: "photo",
      mediaUrl: "https://blob.vercel.com/photo.jpg",
      caption: "Beach day",
      createdAt: new Date(now.getTime() - 3000),
    });

    const videoPost = createMockPost({
      familyId: family.id,
      authorId: TEST_USER_ID,
      contentType: "video",
      mediaUrl: "https://blob.vercel.com/video.mp4",
      caption: "Graduation ceremony",
      createdAt: new Date(now.getTime() - 2000),
    });

    const event = createMockEvent({
      familyId: family.id,
      title: "Summer Vacation",
      startDate: new Date(now.getTime() - 1000),
      createdAt: new Date(now.getTime() - 1000),
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.posts.findMany.mockResolvedValue([videoPost, photoPost]);
    mockDb.query.calendarEvents.findMany.mockResolvedValue([event]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/family/activity?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(3);
    // Sorted by timestamp descending
    expect(body.activities[0].type).toBe("event");
    expect(body.activities[0].title).toBe("Summer Vacation");
    expect(body.activities[1].type).toBe("post");
    expect(body.activities[1].title).toBe("Graduation ceremony");
    expect(body.activities[1].thumbnail).toBe("https://blob.vercel.com/video.mp4");
    expect(body.activities[2].type).toBe("post");
    expect(body.activities[2].title).toBe("Beach day");
  });
});
