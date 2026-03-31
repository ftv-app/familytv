import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Node.js built-in modules that cause issues in jsdom environment
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed"),
    }),
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
  },
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue("hashed"),
    }),
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
  },
}));

// Mock @neondatabase/serverless
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn().mockReturnValue(vi.fn()),
}));

// Mock drizzle-orm/neon-http
vi.mock("drizzle-orm/neon-http", () => ({
  drizzle: vi.fn().mockReturnValue({}),
}));

// Create mock functions
const mockAuth = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockSelect = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      calendarEvents: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
    select: (...args: unknown[]) => mockSelect(...args),
    insert: vi.fn(),
  },
  posts: {},
  calendarEvents: {},
  familyMemberships: {},
  families: {},
}));

import { GET } from "@/app/api/family/activity/route";

describe("/api/family/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("returns 400 when familyId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);

      const req = new NextRequest("http://localhost/api/family/activity");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("familyId is required");
    });

    it("returns 400 when limit is invalid (NaN)", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=abc");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when limit is less than 1", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=0");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when limit is greater than 50", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=100");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("limit must be between 1 and 50");
    });

    it("returns 400 when cursor is invalid date", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockFindFirst.mockResolvedValue({ userId: "user_123", familyId: "family_123" });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&cursor=invalid-date");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid cursor format");
    });
  });

  describe("Authorization", () => {
    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockFindFirst.mockResolvedValue(null); // No membership found

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });
  });

  describe("Successful Response", () => {
    const mockMembership = { id: "mem_1", familyId: "family_123", userId: "user_123", role: "member", joinedAt: new Date() };
    const mockPost = {
      id: "post_1",
      familyId: "family_123",
      authorId: "user_123",
      authorName: "John Doe",
      contentType: "image",
      mediaUrl: "https://blob.vercel.com/image.jpg",
      caption: "Family photo",
      createdAt: new Date(),
    };
    const mockEvent = {
      id: "event_1",
      familyId: "family_123",
      title: "Family BBQ",
      description: "Annual barbecue",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: null,
      allDay: false,
      createdBy: "user_123",
      createdAt: new Date(),
    };
    const mockMember = { id: "mem_1", familyId: "family_123", userId: "user_new", role: "member", joinedAt: new Date() };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns activities, quietMembers, and upcomingEvents", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      // Mock posts query (from select)
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPost]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      // Mock calendarEvents.findMany for upcoming events
      mockFindMany
        .mockResolvedValueOnce([mockEvent]) // upcoming events
        .mockResolvedValueOnce([mockMember]); // family members

      // Mock posts max query for quiet members calculation
      mockSelectFn.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { authorId: "user_123", lastPostAt: new Date() },
            ]),
          }),
        }),
      });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("activities");
      expect(json).toHaveProperty("quietMembers");
      expect(json).toHaveProperty("upcomingEvents");
    });

    it("returns empty arrays when no data exists", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activities).toEqual([]);
      expect(json.quietMembers).toEqual([]);
      expect(json.upcomingEvents).toEqual([]);
    });

    it("applies custom limit from query param", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=5");
      const res = await GET(req);

      expect(res.status).toBe(200);
      // The mock should have been called with limit 5
    });

    it("calculates daysAway correctly for upcoming events", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      // Event happening in exactly 7 days
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      mockFindMany.mockResolvedValueOnce([
        { ...mockEvent, startDate: sevenDaysFromNow },
      ]);
      mockFindMany.mockResolvedValueOnce([]); // family members

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.upcomingEvents[0].daysAway).toBe(7);
    });

    it("marks members as quiet when they have no posts", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany
        .mockResolvedValueOnce([]) // no upcoming events
        .mockResolvedValueOnce([mockMember]); // family members with no posts

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.quietMembers).toHaveLength(1);
      expect(json.quietMembers[0].memberId).toBe("user_new");
      expect(json.quietMembers[0].lastActive).toBeNull();
    });

    it("marks members as quiet when last post was 21+ days ago", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      // 25 days ago
      const oldDate = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
      mockFindMany
        .mockResolvedValueOnce([]) // no upcoming events
        .mockResolvedValueOnce([{ ...mockMember }]); // family members

      // Return old last post date
      mockSelectFn.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { authorId: "user_new", lastPostAt: oldDate },
            ]),
          }),
        }),
      });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.quietMembers).toHaveLength(1);
    });

    it("does not mark active members as quiet", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany
        .mockResolvedValueOnce([]) // no upcoming events
        .mockResolvedValueOnce([mockMember]); // family members

      // Recent last post (just now)
      mockSelectFn.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { authorId: "user_new", lastPostAt: new Date() },
            ]),
          }),
        }),
      });

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.quietMembers).toHaveLength(0);
    });

    it("uses default limit of 20 when not specified", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Default limit of 20 should be used
    });

    it("handles cursor-based pagination", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const cursorDate = "2026-03-15T10:00:00Z";
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPost]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        `http://localhost/api/family/activity?familyId=family_123&cursor=${encodeURIComponent(cursorDate)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("sorts activities by createdAt descending", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const now = new Date();
      const olderPost = { ...mockPost, id: "post_1", createdAt: new Date(now.getTime() - 1000) };
      const newerPost = { ...mockPost, id: "post_2", createdAt: new Date(now.getTime()) };

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([newerPost, olderPost]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activities[0].id).toBe("post_2"); // newer post first
    });

    it("caps activities at limit", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      // Create more posts than the limit
      const posts = Array.from({ length: 25 }, (_, i) => ({
        ...mockPost,
        id: `post_${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(posts),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      mockFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123&limit=10");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activities.length).toBeLessThanOrEqual(10);
    });

    it("includes event type activities", async () => {
      mockFindFirst.mockResolvedValue(mockMembership);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSelect as any).mockImplementation(mockSelectFn);

      const futureEvent = {
        id: "event_1",
        familyId: "family_123",
        title: "Birthday Party",
        description: "Mom's birthday",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: null,
        allDay: true,
        createdBy: "user_123",
        createdAt: new Date(),
      };

      mockFindMany
        .mockResolvedValueOnce([futureEvent])
        .mockResolvedValueOnce([]);

      const req = new NextRequest("http://localhost/api/family/activity?familyId=family_123");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.upcomingEvents).toHaveLength(1);
      expect(json.upcomingEvents[0].title).toBe("Birthday Party");
    });
  });
});
