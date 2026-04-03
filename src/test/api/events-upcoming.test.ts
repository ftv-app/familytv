import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockAuth = vi.fn();
const mockMembershipsFindFirst = vi.fn();
const mockMembershipsFindMany = vi.fn();
const mockEventsFindMany = vi.fn();

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
        findMany: (...args: unknown[]) => mockMembershipsFindMany(...args),
      },
      calendarEvents: {
        findMany: (...args: unknown[]) => mockEventsFindMany(...args),
      },
    },
  },
  calendarEvents: {},
  familyMemberships: {},
}));

import { GET } from "@/app/api/events/upcoming/route";
import {
  createMockFamilyMembership,
  createMockFamily,
  createMockCalendarEvent,
} from "@/test/factories";

describe("/api/events/upcoming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = new NextRequest("http://localhost/api/events/upcoming");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("Authorization", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 403 when user is not a family member (with familyId param)", async () => {
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });

    it("returns 403 when user has no family memberships (no familyId param)", async () => {
      mockMembershipsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/events/upcoming");
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Not a member of this family");
    });
  });

  describe("Successful Response", () => {
    const mockFamily = createMockFamily({ id: "family_123", name: "The Smiths" });
    const mockMembership = createMockFamilyMembership({
      familyId: "family_123",
      userId: "user_123",
    });

    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns correct response shape", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);
      mockEventsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("events");
      expect(json).toHaveProperty("familyName");
      expect(Array.isArray(json.events)).toBe(true);
      expect(json.familyName).toBe("The Smiths");
    });

    it("returns empty events when none upcoming", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);
      mockEventsFindMany.mockResolvedValue([]);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events).toEqual([]);
    });

    it("returns upcoming events within 24h window", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      // Event starting in 2 hours
      const upcomingEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Family Dinner",
        startDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      });

      mockEventsFindMany.mockResolvedValue([upcomingEvent] as any);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events).toHaveLength(1);
      expect(json.events[0].title).toBe("Family Dinner");
    });

    it("transforms event dates to ISO strings", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const startDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const createdAt = new Date();

      const upcomingEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Movie Night",
        startDate,
        endDate,
        createdAt,
      });

      mockEventsFindMany.mockResolvedValue([upcomingEvent] as any);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events[0].startDate).toBe(startDate.toISOString());
      expect(json.events[0].endDate).toBe(endDate.toISOString());
      expect(json.events[0].createdAt).toBe(createdAt.toISOString());
    });

    it("includes all event fields in response", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      const startDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const upcomingEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Birthday Party",
        description: "Grandma's 80th birthday",
        startDate,
        allDay: false,
      });

      mockEventsFindMany.mockResolvedValue([upcomingEvent] as any);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.events[0]).toMatchObject({
        title: "Birthday Party",
        description: "Grandma's 80th birthday",
        allDay: false,
      });
    });

    it("orders events by startDate ascending", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);

      // Event starting in 4 hours
      const laterEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Later Event",
        startDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      });

      // Event starting in 1 hour
      const soonerEvent = createMockCalendarEvent({
        familyId: "family_123",
        title: "Sooner Event",
        startDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
      });

      // Mock returns them in correct order (sooner first) - route uses DB ordering
      mockEventsFindMany.mockResolvedValue([soonerEvent, laterEvent] as any);

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      // Events should be in startDate ascending order
      expect(json.events[0].title).toBe("Sooner Event");
      expect(json.events[1].title).toBe("Later Event");
    });

    it("uses first family when familyId not provided", async () => {
      const membershipWithFamily = { ...mockMembership, family: mockFamily };
      mockMembershipsFindMany.mockResolvedValue([membershipWithFamily]);
      mockEventsFindMany.mockResolvedValue([]);

      const req = new NextRequest("http://localhost/api/events/upcoming");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    const errFamily = createMockFamily({ id: "family_123", name: "The Smiths" });
    const errMembership = createMockFamilyMembership({
      familyId: "family_123",
      userId: "user_123",
    });

    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: "user_123" } as any);
    });

    it("returns 500 on database error", async () => {
      const membershipWithFamily = {
        ...errMembership,
        family: errFamily,
      };
      mockMembershipsFindFirst.mockResolvedValue(membershipWithFamily);
      mockEventsFindMany.mockRejectedValue(new Error("Database error"));

      const req = new NextRequest(
        "http://localhost/api/events/upcoming?familyId=family_123"
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Internal server error");
    });
  });
});
