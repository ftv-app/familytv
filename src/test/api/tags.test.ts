import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---- Module-level mock refs ----
const mockMembershipsFindFirst = vi.fn();
const mockTagsFindMany = vi.fn();
const mockTagsFindFirst = vi.fn();
const mockTagsCreate = vi.fn();
const mockTagsDelete = vi.fn();
const mockMediaTagsFindMany = vi.fn();
const mockMediaTagsCreate = vi.fn();
const mockMediaTagsDelete = vi.fn();
const mockMediaTagsFindFirst = vi.fn();
const mockDbExecute = vi.fn();
const mockPostsFindFirst = vi.fn();

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = i * 17 % 256;
    return arr;
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i * 17 % 256;
      return arr;
    }),
  },
}));

// ---- Mock database ----
vi.mock("@/db", () => ({
  db: {
    query: {
      tags: {
        findMany: vi.fn((...args: unknown[]) => mockTagsFindMany(...args)),
        findFirst: vi.fn((...args: unknown[]) => mockTagsFindFirst(...args)),
      },
      mediaTags: {
        findMany: vi.fn((...args: unknown[]) => mockMediaTagsFindMany(...args)),
        findFirst: vi.fn((...args: unknown[]) => mockMediaTagsFindFirst(...args)),
      },
      posts: {
        findFirst: vi.fn((...args: unknown[]) => mockPostsFindFirst(...args)),
      },
      familyMemberships: {
        findFirst: vi.fn((...args: unknown[]) => mockMembershipsFindFirst(...args)),
      },
    },
    insert: vi.fn(() => {
      let capturedValues: { familyId?: string; name?: string; color?: string; createdBy?: string } = {};
      return {
        values: vi.fn((v: unknown) => {
          capturedValues = (v || {}) as { familyId?: string; name?: string; color?: string; createdBy?: string };
          return {
            returning: vi.fn(() => Promise.resolve([{
              id: TAG_ID,
              familyId: capturedValues.familyId || FAMILY_ID,
              name: capturedValues.name || "Holidays",
              color: capturedValues.color || "#6366f1",
              createdBy: capturedValues.createdBy || USER_ID,
              createdAt: new Date(),
            }])),
          };
        }),
      };
    }),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue({ id: TAG_ID }),
    })),
    sql: (strings: TemplateStringsArray, ..._values: unknown[]) => ({ strings }),
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
  tags: {},
  mediaTags: {},
  posts: {},
  familyMemberships: {},
}));

// ---- Mock Clerk auth ----
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// ---- Import route under test ----
import { GET as listTags, POST as createTag } from "@/app/api/tags/route";
import { DELETE as deleteTag } from "@/app/api/tags/[id]/route";
import { POST as applyTagsToPost } from "@/app/api/media/[postId]/tags/route";
import { DELETE as removeTagFromPost } from "@/app/api/media/[postId]/tags/[tagId]/route";
import { GET as autocompleteTags } from "@/app/api/tags/autocomplete/route";

const FAMILY_ID = "family-xyz-456";
const USER_ID = "user_123";
const TAG_ID = "tag-abc-789";
const POST_ID = "post-def-101";

function authAs(userId: string, familyId = FAMILY_ID) {
  mockAuth.mockResolvedValue({ userId, familyId });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: USER_ID, familyId: FAMILY_ID });
  // Default membership mock — override in specific tests
  mockMembershipsFindFirst.mockResolvedValue({ id: "membership-1", familyId: FAMILY_ID, userId: USER_ID });
});

/* ============================================================
   GET /api/tags?familyId=xxx
   ============================================================ */
describe("GET /api/tags", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/tags?familyId=" + FAMILY_ID);
    const res = await listTags(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when familyId is missing", async () => {
    authAs(USER_ID);
    const req = new NextRequest("http://localhost/api/tags");
    const res = await listTags(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("returns tags for a family member", async () => {
    authAs(USER_ID);
    mockTagsFindMany.mockResolvedValue([
      {
        id: TAG_ID,
        familyId: FAMILY_ID,
        name: "Holidays",
        color: "#6366f1",
        createdBy: USER_ID,
        createdAt: new Date("2026-04-01"),
      },
    ]);
    mockDbExecute.mockResolvedValue([{ count: 5 }]);

    const req = new NextRequest("http://localhost/api/tags?familyId=" + FAMILY_ID);
    const res = await listTags(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toHaveLength(1);
    expect(body.tags[0].name).toBe("Holidays");
    expect(body.tags[0].postCount).toBe(5);
  });

  it("returns empty array when no tags exist", async () => {
    authAs(USER_ID);
    mockTagsFindMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/tags?familyId=" + FAMILY_ID);
    const res = await listTags(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toEqual([]);
  });
});

/* ============================================================
   POST /api/tags
   ============================================================ */
describe("POST /api/tags", () => {
  it("creates a new tag with valid input", async () => {
    authAs(USER_ID);
    mockTagsFindFirst.mockResolvedValue(null);
    mockTagsCreate.mockResolvedValue({
      id: TAG_ID,
      familyId: FAMILY_ID,
      name: "Holidays",
      color: "#6366f1",
      createdBy: USER_ID,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ familyId: FAMILY_ID, name: "Holidays" }),
    });
    const res = await createTag(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tag.name).toBe("Holidays");
  });

  it("rejects duplicate tag name (case-insensitive)", async () => {
    authAs(USER_ID);
    mockTagsFindFirst.mockResolvedValue({ id: TAG_ID, name: "Holidays" });

    const req = new NextRequest("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ familyId: FAMILY_ID, name: "Holidays" }),
    });
    const res = await createTag(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already exists");
  });

  it("rejects tag name over 64 characters", async () => {
    authAs(USER_ID);
    const longName = "a".repeat(65);

    const req = new NextRequest("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ familyId: FAMILY_ID, name: longName }),
    });
    const res = await createTag(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });

  it("rejects invalid hex color", async () => {
    authAs(USER_ID);

    const req = new NextRequest("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ familyId: FAMILY_ID, name: "Test", color: "not-a-color" }),
    });
    const res = await createTag(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });

  it("accepts valid custom color", async () => {
    authAs(USER_ID);
    mockTagsFindFirst.mockResolvedValue(null);
    mockTagsCreate.mockResolvedValue({
      id: TAG_ID,
      familyId: FAMILY_ID,
      name: "Beach",
      color: "#f59e0b",
      createdBy: USER_ID,
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost/api/tags", {
      method: "POST",
      body: JSON.stringify({ familyId: FAMILY_ID, name: "Beach", color: "#f59e0b" }),
    });
    const res = await createTag(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tag.color).toBe("#f59e0b");
  });
});

/* ============================================================
   DELETE /api/tags/:id
   ============================================================ */
describe("DELETE /api/tags/:id", () => {
  it("deletes an existing tag", async () => {
    authAs(USER_ID);
    mockTagsFindFirst.mockResolvedValue({
      id: TAG_ID,
      familyId: FAMILY_ID,
      name: "Holidays",
      color: "#6366f1",
    });
    mockTagsDelete.mockResolvedValue({ id: TAG_ID });

    const req = new NextRequest("http://localhost/api/tags/" + TAG_ID, {
      method: "DELETE",
    });
    const res = await deleteTag(req, { params: Promise.resolve({ id: TAG_ID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("returns 404 when tag not found", async () => {
    authAs(USER_ID);
    mockTagsFindFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/tags/" + TAG_ID, {
      method: "DELETE",
    });
    const res = await deleteTag(req, { params: Promise.resolve({ id: TAG_ID }) });

    expect(res.status).toBe(404);
  });
});

/* ============================================================
   POST /api/media/:postId/tags — apply tags to a post
   ============================================================ */
describe("POST /api/media/:postId/tags", () => {
  it("applies tags to an existing post", async () => {
    authAs(USER_ID);
    mockPostsFindFirst.mockResolvedValue({
      id: POST_ID,
      familyId: FAMILY_ID,
      authorId: USER_ID,
    });
    mockTagsFindFirst.mockResolvedValue(null); // tag doesn't exist yet
    mockTagsCreate.mockResolvedValue({
      id: TAG_ID,
      familyId: FAMILY_ID,
      name: "Holidays",
      color: "#6366f1",
      createdBy: USER_ID,
      createdAt: new Date(),
    });
    mockMediaTagsCreate.mockResolvedValue({
      id: "mt-1",
      postId: POST_ID,
      tagId: TAG_ID,
    });
    mockMediaTagsFindMany.mockResolvedValue([
      { id: "mt-1", tagId: TAG_ID, tag: { id: TAG_ID, name: "Holidays", color: "#6366f1" } },
    ]);

    const req = new NextRequest("http://localhost/api/media/" + POST_ID + "/tags", {
      method: "POST",
      body: JSON.stringify({ tags: [{ name: "Holidays" }] }),
    });
    const res = await applyTagsToPost(req, { params: Promise.resolve({ postId: POST_ID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toHaveLength(1);
    expect(body.tags[0].name).toBe("Holidays");
  });

  it("reuses existing tag instead of creating duplicate", async () => {
    authAs(USER_ID);
    mockPostsFindFirst.mockResolvedValue({
      id: POST_ID,
      familyId: FAMILY_ID,
      authorId: USER_ID,
    });
    // Tag already exists
    mockTagsFindFirst.mockResolvedValue({
      id: TAG_ID,
      familyId: FAMILY_ID,
      name: "Holidays",
      color: "#6366f1",
    });
    mockMediaTagsFindMany.mockResolvedValue([
      { id: "mt-1", tagId: TAG_ID, tag: { id: TAG_ID, name: "Holidays", color: "#6366f1" } },
    ]);

    const req = new NextRequest("http://localhost/api/media/" + POST_ID + "/tags", {
      method: "POST",
      body: JSON.stringify({ tags: [{ name: "Holidays" }] }),
    });
    const res = await applyTagsToPost(req, { params: Promise.resolve({ postId: POST_ID }) });

    expect(res.status).toBe(200);
    // Should NOT have called create — it reused existing tag
    expect(mockTagsCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when post not found", async () => {
    authAs(USER_ID);
    mockPostsFindFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/media/" + POST_ID + "/tags", {
      method: "POST",
      body: JSON.stringify({ tags: [{ name: "Holidays" }] }),
    });
    const res = await applyTagsToPost(req, { params: Promise.resolve({ postId: POST_ID }) });

    expect(res.status).toBe(404);
  });
});

/* ============================================================
   DELETE /api/media/:postId/tags/:tagId — remove tag from post
   ============================================================ */
describe("DELETE /api/media/:postId/tags/:tagId", () => {
  it("removes a tag from a post", async () => {
    authAs(USER_ID);
    mockPostsFindFirst.mockResolvedValue({
      id: POST_ID,
      familyId: FAMILY_ID,
      authorId: USER_ID,
    });
    mockMediaTagsFindFirst.mockResolvedValue({
      id: "mt-1",
      postId: POST_ID,
      tagId: TAG_ID,
    });
    mockMediaTagsDelete.mockResolvedValue({ id: "mt-1" });

    const req = new NextRequest("http://localhost/api/media/" + POST_ID + "/tags/" + TAG_ID, {
      method: "DELETE",
    });
    const res = await removeTagFromPost(req, {
      params: Promise.resolve({ postId: POST_ID, tagId: TAG_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
  });

  it("returns 404 when association not found", async () => {
    authAs(USER_ID);
    mockPostsFindFirst.mockResolvedValue({
      id: POST_ID,
      familyId: FAMILY_ID,
      authorId: USER_ID,
    });
    mockMediaTagsFindFirst.mockResolvedValue(null); // no association

    const req = new NextRequest("http://localhost/api/media/" + POST_ID + "/tags/" + TAG_ID, {
      method: "DELETE",
    });
    const res = await removeTagFromPost(req, {
      params: Promise.resolve({ postId: POST_ID, tagId: TAG_ID }),
    });

    expect(res.status).toBe(404);
  });
});

/* ============================================================
   GET /api/tags/autocomplete?familyId=xxx&q=xxx
   ============================================================ */
describe("GET /api/tags/autocomplete", () => {
  it("returns matching tags for prefix query", async () => {
    authAs(USER_ID);
    mockTagsFindMany.mockResolvedValue([
      { id: TAG_ID, name: "Holidays", color: "#6366f1" },
      { id: "tag-2", name: "Halloween", color: "#f97316" },
    ]);

    const req = new NextRequest(
      "http://localhost/api/tags/autocomplete?familyId=" + FAMILY_ID + "&q=hol"
    );
    const res = await autocompleteTags(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toHaveLength(2);
    expect(body.tags[0].name).toBe("Holidays");
  });

  it("returns empty array for no matches", async () => {
    authAs(USER_ID);
    mockTagsFindMany.mockResolvedValue([]);

    const req = new NextRequest(
      "http://localhost/api/tags/autocomplete?familyId=" + FAMILY_ID + "&q=xyz"
    );
    const res = await autocompleteTags(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toEqual([]);
  });

  it("returns 400 when query param q is missing", async () => {
    authAs(USER_ID);

    const req = new NextRequest(
      "http://localhost/api/tags/autocomplete?familyId=" + FAMILY_ID
    );
    const res = await autocompleteTags(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });
});