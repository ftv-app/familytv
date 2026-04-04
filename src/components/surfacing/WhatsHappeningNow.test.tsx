import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import { WhatsHappeningNow } from "./WhatsHappeningNow";

// ─── Mock WebSocket class ───────────────────────────────────────────────────────
// Must be defined at module level so the component captures it when imported
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  send = vi.fn();
  readyState = 1; // OPEN
  url: string;

  constructor(url: string) {
    MockWebSocket.instances.push(this);
    this.url = url;
  }

  // Helper to trigger onopen from tests
  triggerOpen() {
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  // Helper to trigger onmessage from tests
  triggerMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data: JSON.stringify(data) }));
    }
  }
}

// Stub WebSocket globally at module level (before component imports it)
vi.stubGlobal("WebSocket", MockWebSocket);

describe("WhatsHappeningNow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
  });

  afterEach(() => {
    cleanup();
  });

  const getLastWs = (): MockWebSocket => {
    const instances = MockWebSocket.instances;
    if (!instances.length) throw new Error("No WebSocket instance created");
    return instances[instances.length - 1];
  };

  it("renders loading skeleton initially", () => {
    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );
    const container = screen.getByTestId("surfacing-container");
    expect(container).toBeInTheDocument();
  });

  it("shows empty state when no activity", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });

    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-empty")).toBeInTheDocument();
    });
  });

  it("shows upcoming event cards when events exist", async () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "event-1",
              type: "event",
              actor: { name: "Mom", avatar: null },
              content: {
                title: "Family BBQ",
                description: "Summer cookout",
                startDate: futureDate,
                allDay: false,
              },
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
          familyName: "The Smiths",
        }),
    });

    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-event-card")).toBeInTheDocument();
    });
    expect(screen.getByText("Family BBQ")).toBeInTheDocument();
  });

  it("renders connection status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });

    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-connection-status")).toBeInTheDocument();
    });
  });

  it("shows online member chip when presence join received", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });

    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-container")).toBeInTheDocument();
    });

    const ws = getLastWs();

    // Simulate WebSocket connection open
    await act(async () => {
      ws.triggerOpen();
    });

    // Verify presence join was sent
    expect(ws.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"presence:join"')
    );

    // Fire presence update message
    await act(async () => {
      ws.triggerMessage({
        type: "presence:update",
        payload: {
          userId: "user-2",
          userName: "Dad",
          sessionId: "session-1",
          joinedAt: Date.now(),
          action: "join",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-online-member")).toBeInTheDocument();
      expect(screen.getByText("Dad")).toBeInTheDocument();
    });
  });

  it("shows recent activity when reaction received via WebSocket", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null, familyName: "The Smiths" }),
    });

    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-container")).toBeInTheDocument();
    });

    const ws = getLastWs();

    // Simulate WebSocket connection open
    await act(async () => {
      ws.triggerOpen();
    });

    // Fire reaction update message
    await act(async () => {
      ws.triggerMessage({
        type: "reaction:update",
        payload: {
          userId: "user-2",
          userName: "Sam",
          emoji: "❤️",
          timestamp: Date.now(),
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-activity-card")).toBeInTheDocument();
    });
  });
});
