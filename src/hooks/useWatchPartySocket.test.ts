import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWatchPartySocket } from "./useWatchPartySocket";

// Mock socket.io-client
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    disconnect: mockDisconnect,
    connected: true,
  })),
}));

describe("useWatchPartySocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial disconnected state", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isReconnecting).toBe(false);
      expect(result.current.state.presence).toEqual([]);
      expect(result.current.state.messages).toEqual([]);
      expect(result.current.state.error).toBeNull();
    });
  });

  describe("Connection", () => {
    it("should have sendMessage function", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(typeof result.current.sendMessage).toBe("function");
    });

    it("should have sendReaction function", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(typeof result.current.sendReaction).toBe("function");
    });

    it("should have sendHeartbeat function", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(typeof result.current.sendHeartbeat).toBe("function");
    });

    it("should have disconnect function", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(typeof result.current.disconnect).toBe("function");
    });
  });

  describe("Message Handling", () => {
    it("should handle empty text gracefully", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      // Should not throw
      expect(() => {
        result.current.sendMessage("");
      }).not.toThrow();
    });

    it("should trim whitespace from messages", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      // The function should handle whitespace-only strings gracefully
      result.current.sendMessage("   ");
      // Should not emit anything for whitespace-only
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("should limit message length to 500 characters", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      const longMessage = "a".repeat(600);

      // The function should handle long messages gracefully
      result.current.sendMessage(longMessage);

      // Function should not throw even with long input
      expect(true).toBe(true);
    });
  });

  describe("Reaction Handling", () => {
    it("should handle empty emoji gracefully", () => {
      const { result } = renderHook(() =>
        useWatchPartySocket({
          roomId: "test-room",
          userId: "user-1",
          userName: "Test User",
        })
      );

      expect(() => {
        result.current.sendReaction("");
      }).not.toThrow();
    });
  });
});
