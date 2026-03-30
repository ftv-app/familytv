import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockUser, TEST_USER_ID } from "../factories";

// Mock Clerk currentUser
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

// Mock db functions
const mockUpsertUser = vi.fn();
const mockGetNotificationsByUserId = vi.fn();
const mockMarkNotificationRead = vi.fn();
const mockMarkAllNotificationsRead = vi.fn();

vi.mock("@/lib/db", () => ({
  upsertUser: (...args: unknown[]) => mockUpsertUser(...args),
  getNotificationsByUserId: (...args: unknown[]) => mockGetNotificationsByUserId(...args),
  markNotificationRead: (...args: unknown[]) => mockMarkNotificationRead(...args),
  markAllNotificationsRead: (...args: unknown[]) => mockMarkAllNotificationsRead(...args),
}));

async function getHandler() {
  const mod = await import("@/app/api/notifications/route");
  return mod;
}

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await handler.GET(req);

    expect(res.status).toBe(401);
  });

  it("returns notifications for authenticated user", async () => {
    const user = createMockUser({ id: "db_user_123" });
    const notifications = [
      { id: "notif_1", user_id: user.id, type: "new_post", message: "New post in your family", read: false },
      { id: "notif_2", user_id: user.id, type: "event_reminder", message: "Birthday tomorrow", read: true },
    ];

    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([user]);
    mockGetNotificationsByUserId.mockResolvedValue(notifications);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(2);
  });

  it("returns empty array when no notifications", async () => {
    const user = createMockUser({ id: "db_user_123" });

    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([user]);
    mockGetNotificationsByUserId.mockResolvedValue([]);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await handler.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([createMockUser({ id: "db_user_123" })]);
    mockGetNotificationsByUserId.mockRejectedValue(new Error("DB error"));

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await handler.GET(req);

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue(null);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationId: "notif_123" }),
    });
    const res = await handler.PATCH(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when neither notificationId nor markAll is provided", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([createMockUser({ id: "db_user_123" })]);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await handler.PATCH(req);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("notificationId or markAll is required");
  });

  it("marks a single notification as read", async () => {
    const user = createMockUser({ id: "db_user_123" });

    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([user]);
    mockMarkNotificationRead.mockResolvedValue(undefined);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationId: "notif_123" }),
    });
    const res = await handler.PATCH(req);

    expect(res.status).toBe(200);
    expect(mockMarkNotificationRead).toHaveBeenCalledWith("notif_123", user.id);
  });

  it("marks all notifications as read", async () => {
    const user = createMockUser({ id: "db_user_123" });

    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([user]);
    mockMarkAllNotificationsRead.mockResolvedValue(undefined);

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAll: true }),
    });
    const res = await handler.PATCH(req);

    expect(res.status).toBe(200);
    expect(mockMarkAllNotificationsRead).toHaveBeenCalledWith(user.id);
  });

  it("returns 500 on database error", async () => {
    const { currentUser } = await import("@clerk/nextjs/server");
    vi.mocked(currentUser).mockResolvedValue({
      id: TEST_USER_ID,
      emailAddresses: [{ emailAddress: "test@family.com" }],
      fullName: "Test User",
      firstName: "Test",
    } as ReturnType<typeof currentUser>);
    mockUpsertUser.mockResolvedValue([createMockUser({ id: "db_user_123" })]);
    mockMarkNotificationRead.mockRejectedValue(new Error("DB error"));

    const handler = await getHandler();
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationId: "notif_123" }),
    });
    const res = await handler.PATCH(req);

    expect(res.status).toBe(500);
  });
});
