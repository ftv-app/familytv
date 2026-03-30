import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockEvent,
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
    calendarEvents: {
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
  familyMemberships: {},
  calendarEvents: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/events/route");
  return mod;
}

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when familyId is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events");
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
    const req = new NextRequest("http://localhost/api/events?familyId=fam_123");
    const res = await handler.GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("returns events for authenticated family member", async () => {
    const family = createMockFamily();
    const events = [
      createMockEvent({ familyId: family.id }),
      createMockEvent({ familyId: family.id }),
    ];

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.calendarEvents.findMany.mockResolvedValue(events);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/events?familyId=${family.id}`);
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toHaveLength(2);
  });

  it("orders events by startDate descending", async () => {
    const family = createMockFamily();

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.query.calendarEvents.findMany.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest(`http://localhost/api/events?familyId=${family.id}`);
    await handler.GET(req);

    expect(mockDb.query.calendarEvents.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        title: "Birthday",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid family ID", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: 123,
        title: "Birthday",
        startDate: new Date().toISOString(),
      }),
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
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        title: "Birthday",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid family ID");
  });

  it("returns 400 when title is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Title is required");
  });

  it("returns 400 when title is empty", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        title: "   ",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Title is required");
  });

  it("returns 400 when title is not a string", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        title: 123,
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Title is required");
  });

  it("returns 400 when startDate is missing", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        title: "Birthday",
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("startDate is required");
  });

  it("returns 403 when user is not a family member", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: "fam_123",
        title: "Birthday",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Not a member of this family");
  });

  it("creates an event successfully", async () => {
    const family = createMockFamily();
    const newEvent = createMockEvent({ familyId: family.id });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newEvent]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        title: "Birthday Party",
        description: "Grandma's birthday",
        startDate: new Date().toISOString(),
        allDay: false,
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.event).toBeDefined();
    // Returned event uses factory title from mock (not input "Birthday Party")
    expect(body.event.title).toBe("Family Birthday");
  });

  it("creates an all-day event", async () => {
    const family = createMockFamily();
    const newEvent = createMockEvent({ familyId: family.id, allDay: true });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newEvent]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        title: "Family Day",
        startDate: new Date().toISOString(),
        allDay: true,
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("creates event with optional endDate", async () => {
    const family = createMockFamily();
    const newEvent = createMockEvent({
      familyId: family.id,
      endDate: new Date(),
    });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newEvent]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        title: "Graduation Ceremony",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });

  it("trims title whitespace", async () => {
    const family = createMockFamily();
    const newEvent = createMockEvent({ familyId: family.id });

    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: TEST_USER_ID });
    mockDb.query.familyMemberships.findFirst.mockResolvedValue(
      createMockMembership({ familyId: family.id, userId: TEST_USER_ID })
    );
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newEvent]),
      }),
    });

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({
        familyId: family.id,
        title: "  Birthday  ",
        startDate: new Date().toISOString(),
      }),
    });
    const res = await handler.POST(req);

    expect(res.status).toBe(201);
  });
});
