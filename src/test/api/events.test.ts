import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockEventsFindMany = vi.fn();
const mockInsert = vi.fn();

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Mock database
vi.mock("@/db", () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
      },
      calendarEvents: {
        findMany: (...args: unknown[]) => mockEventsFindMany(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
  calendarEvents: {},
  familyMemberships: {},
}));

import { GET, POST } from "@/app/api/events/route";
import { createMockCalendarEvent, createMockFamilyMembership } from "@/test/factories";

describe("/api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 when familyId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/events");
      const res = await GET(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("familyId is required");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
      const res = await GET(req);
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });

    it("returns events for family member", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      const events = [createMockCalendarEvent({ familyId: "fam_123" })];
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(membership);
      mockEventsFindMany.mockResolvedValue(events as any);
      
      const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events).toHaveLength(1);
    });

    it("returns empty array when no events", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(membership);
      mockEventsFindMany.mockResolvedValue([]);
      
      const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events).toHaveLength(0);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "Family BBQ",
          startDate: "2026-07-04T12:00:00Z",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid familyId", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: 123,
          title: "Family BBQ",
          startDate: "2026-07-04T12:00:00Z",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid family ID");
    });

    it("returns 400 when title is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          startDate: "2026-07-04T12:00:00Z",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Title is required");
    });

    it("returns 400 when title is empty", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "   ",
          startDate: "2026-07-04T12:00:00Z",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });

    it("returns 400 when startDate is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "Family BBQ",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("startDate is required");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(null);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "Family BBQ",
          startDate: "2026-07-04T12:00:00Z",
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(403);
    });

    it("creates event successfully", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      const event = createMockCalendarEvent({ familyId: "fam_123", title: "Family BBQ" });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(membership);
      mockInsert.mockReturnValue({
        returning: vi.fn().mockResolvedValue([event]),
      } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "Family BBQ",
          startDate: "2026-07-04T12:00:00Z",
          description: "Annual family barbecue",
          allDay: false,
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.event).toBeDefined();
      expect(json.event.title).toBe("Family BBQ");
    });

    it("creates all-day event successfully", async () => {
      const membership = createMockFamilyMembership({ familyId: "fam_123", userId: "user_123" });
      const event = createMockCalendarEvent({ familyId: "fam_123", allDay: true });
      
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
      mockMembershipsFindFirst.mockResolvedValue(membership);
      mockInsert.mockReturnValue({
        returning: vi.fn().mockResolvedValue([event]),
      } as any);
      
      const req = new NextRequest("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({
          familyId: "fam_123",
          title: "Family Reunion",
          startDate: "2026-07-04",
          allDay: true,
        }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
    });
  });
});
