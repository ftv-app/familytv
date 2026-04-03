import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { WhatsHappeningNow } from "./WhatsHappeningNow";

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  send = vi.fn();
  readyState = 1; // OPEN
}

const mockWs = new MockWebSocket() as unknown as WebSocket;
vi.stubGlobal("WebSocket", vi.fn(() => mockWs));

describe("WhatsHappeningNow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders loading skeleton initially", () => {
    render(
      <WhatsHappeningNow
        familyId="family-1"
        currentUserId="user-1"
      />
    );
    // Loading skeleton should be present (aria-hidden so not found by text)
    const container = screen.getByTestId("surfacing-container");
    expect(container).toBeInTheDocument();
  });

  it("shows empty state when no activity", async () => {
    // Mock empty fetch for events
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

    // Simulate WebSocket message
    if (mockWs.onmessage) {
      mockWs.onmessage(new MessageEvent("message", {
        data: JSON.stringify({
          type: "presence:update",
          payload: {
            userId: "user-2",
            userName: "Dad",
            sessionId: "session-1",
            joinedAt: Date.now(),
            action: "join",
          },
        }),
      }));
    }

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

    // Simulate reaction update via WebSocket
    if (mockWs.onmessage) {
      mockWs.onmessage(new MessageEvent("message", {
        data: JSON.stringify({
          type: "reaction:update",
          payload: {
            userId: "user-2",
            userName: "Sam",
            emoji: "❤️",
            timestamp: Date.now(),
          },
        }),
      }));
    }

    await waitFor(() => {
      expect(screen.getByTestId("surfacing-activity-card")).toBeInTheDocument();
    });
  });
});
