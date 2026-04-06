import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---- Module-level mock refs so tests can configure them ----
const mockMembershipsFindFirst = vi.fn();
const mockDbExecute = vi.fn();

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("test-uuid"),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i * 17 % 256;
    }
    return arr;
  }),
  default: {
    randomUUID: vi.fn().mockReturnValue("test-uuid"),
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i * 17 % 256;
      }
      return arr;
    }),
  },
}));

// ---- Mock database ----
vi.mock("@/db", () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockMembershipsFindFirst(...args),
      },
    },
    // Mock sql tagged template — returns an opaque object that db.execute processes
    sql: (strings: TemplateStringsArray, ..._values: unknown[]) => ({ strings }),
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
  familyMemberships: {},
}));

// ---- Mock PresenceManager ----
const mockJoinRoom = vi.fn();
const mockLeaveRoom = vi.fn();
const mockHeartbeat = vi.fn();
const mockGetRoomPresence = vi.fn();

class MockPresenceManager {
  joinRoom = mockJoinRoom;
  leaveRoom = mockLeaveRoom;
  heartbeat = mockHeartbeat;
  getRoomPresence = mockGetRoomPresence;
  destroy = vi.fn();
}

vi.mock("@/lib/watch-party/presence", () => ({
  getPresenceManager: () => new MockPresenceManager(),
  buildRoomId: (familyId: string, videoId: string, sessionId: string) =>
    `family:${familyId}:video:${videoId}:session:${sessionId}`,
  parseRoomId: (roomId: string) => {
    const parts = roomId.split(":");
    if (parts.length !== 6) return null;
    return { familyId: parts[1], videoId: parts[3], sessionId: parts[5] };
  },
  resetPresenceManager: vi.fn(),
}));

// ---- Mock Clerk auth ----
const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// ---- Import route under test (after mocks are set up) ----
import { GET, POST } from "@/app/api/watchparty/[sessionId]/presence/route";

const SESSION_ID = "session-abc-123";
const FAMILY_ID = "family-xyz-456";
const VIDEO_ID = "video-qrs-789";
const USER_ID = "user_123";

function makeReq(url: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/watchparty/[sessionId]/presence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // GET
  // ==========================================
  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`);
      const res = await GET(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 404 when session not found", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([]);
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`);
      const res = await GET(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Session not found");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`);
      const res = await GET(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Forbidden: not a family member");
    });

    it("returns 200 with presence state when session found and user is member", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockGetRoomPresence.mockReturnValue({
        users: [
          {
            oderId: "oder-1",
            userId: USER_ID,
            name: "Dad",
            avatar: null,
            status: "active",
            isMultiDevice: false,
            deviceCount: 1,
            lastSeen: Date.now(),
            currentView: null,
          },
        ],
        timestamp: Date.now(),
      });

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`);
      const res = await GET(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sessionId).toBe(SESSION_ID);
      expect(json.familyId).toBe(FAMILY_ID);
      expect(json.videoId).toBe(VIDEO_ID);
      expect(json.users).toHaveLength(1);
    });

    it("returns empty users array when no one is watching", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockGetRoomPresence.mockReturnValue({ users: [], timestamp: Date.now() });

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`);
      const res = await GET(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.users).toEqual([]);
    });
  });

  // ==========================================
  // POST
  // ==========================================
  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 400 when action is missing", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("action must be one of: join, leave, heartbeat");
    });

    it("returns 400 when deviceId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("deviceId is required");
    });

    it("returns 404 when session not found", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([]);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 400 when session is inactive", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: false },
      ]);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Session is not active");
    });

    it("returns 403 when user is not a family member", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue(null);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(403);
    });

    it("join action calls presenceManager.joinRoom with correct params", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockGetRoomPresence.mockReturnValue({ users: [], timestamp: Date.now() });

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "join",
        deviceId: "device-1",
        name: "Dad",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(200);
      expect(mockJoinRoom).toHaveBeenCalledWith(
        `family:${FAMILY_ID}:video:${VIDEO_ID}:session:${SESSION_ID}`,
        USER_ID,
        "Dad",
        null,
        "device-1"
      );
    });

    it("leave action calls presenceManager.leaveRoom", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockGetRoomPresence.mockReturnValue({ users: [], timestamp: Date.now() });

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "leave",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(200);
      expect(mockLeaveRoom).toHaveBeenCalledWith(
        `family:${FAMILY_ID}:video:${VIDEO_ID}:session:${SESSION_ID}`,
        "device-1"
      );
    });

    it("heartbeat returns 400 if device not in session", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockHeartbeat.mockReturnValue(false);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "heartbeat",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Device not in session — must join first");
    });

    it("heartbeat returns 200 when device is in session", async () => {
      mockAuth.mockResolvedValue({ userId: USER_ID } as any);
      mockDbExecute.mockResolvedValue([
        { family_id: FAMILY_ID, video_id: VIDEO_ID, active: true },
      ]);
      mockMembershipsFindFirst.mockResolvedValue({
        familyId: FAMILY_ID,
        userId: USER_ID,
      });
      mockHeartbeat.mockReturnValue(true);

      const req = makeReq(`/api/watchparty/${SESSION_ID}/presence`, "POST", {
        action: "heartbeat",
        deviceId: "device-1",
      });
      const res = await POST(req, {
        params: Promise.resolve({ sessionId: SESSION_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
