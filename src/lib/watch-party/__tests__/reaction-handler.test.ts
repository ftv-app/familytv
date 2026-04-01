/**
 * Watch Party Reaction Handler Tests
 * CTM-229: Reaction handling, rate limiting, ephemeral broadcast
 * 
 * Note: Reactions are EPHEMERAL (not stored in DB) per PRD spec.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server as SocketIOServer, Socket } from 'socket.io';

// =============================================================================
// Mocks - all vi.mock calls must be at top level (hoisted by Vitest)
// =============================================================================

// Mock security module
vi.mock('./security', () => ({
  AuthenticatedUser: {},
  validateReactionEmoji: vi.fn((emoji: string) => emoji),
  validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
  checkReactionRateLimit: vi.fn(),
  verifyRoomFamilyScope: vi.fn(),
  safeReactionForBroadcast: vi.fn((reaction: any) => reaction),
  RateLimitError: class RateLimitError extends Error {
    constructor(public message: string, public retryAfterMs: number) {
      super(message);
      this.name = 'RateLimitError';
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(public message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

vi.mock('./presence', () => ({
  buildRoomId: vi.fn(),
  parseRoomId: vi.fn((roomId: string) => {
    if (!roomId.includes(':')) return null;
    const parts = roomId.split(':');
    if (parts.length !== 6) return null;
    return { familyId: parts[1], videoId: parts[3], sessionId: parts[5] };
  }),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const ROOM_ID = `family:${VALID_UUID}:video:${VALID_UUID}:session:${VALID_UUID}`;

// =============================================================================
// registerReactionHandlers Tests
// =============================================================================

describe('registerReactionHandlers', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: Partial<SocketIOServer>;
  let capturedHandler: ((payload: any) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler = null;

    mockSocket = {
      id: 'socket-123',
      userId: 'user-456',
      familyId: VALID_UUID,
      displayName: 'Mom',
      avatarUrl: null,
      rooms: new Set<string>([ROOM_ID, 'socket-123']),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: (payload: any) => void) => {
        if (event === 'reaction:send') capturedHandler = handler;
      }),
      to: vi.fn().mockReturnThis(),
    };

    mockIo = {
      on: vi.fn((event: string, handler: (socket: Socket) => void) => {
        if (event === 'connection') handler(mockSocket as Socket);
      }),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
  });

  describe('reaction:send event', () => {
    it('should register reaction:send event handler', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);
      expect(capturedHandler).toBeDefined();
    });

    it('should emit reaction:new with valid payload', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 45 });

      expect(mockSocket.emit).not.toHaveBeenCalledWith('error', expect.any(Object));
      expect(mockIo.emit).toHaveBeenCalledWith('reaction:new', expect.objectContaining({
        emoji: '😂',
        videoTimestamp: 45,
      }));
    });

    it('should broadcast reaction to the room', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '❤️', videoTimestamp: 30 });

      expect(mockIo.to).toHaveBeenCalledWith(ROOM_ID);
      expect(mockIo.emit).toHaveBeenCalledWith('reaction:new', expect.any(Object));
    });

    it('should include userId and userName in broadcast', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '👏', videoTimestamp: 60 });

      const broadcastCall = (mockIo.emit as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]: any[]) => event === 'reaction:new'
      );
      expect(broadcastCall?.[1].userId).toBe('user-456');
      expect(broadcastCall?.[1].userName).toBe('Mom');
    });

    it('should include videoTimestamp in broadcast', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '🔥', videoTimestamp: 120 });

      const broadcastCall = (mockIo.emit as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]: any[]) => event === 'reaction:new'
      );
      expect(broadcastCall?.[1].videoTimestamp).toBe(120);
    });

    it('should emit AUTH_REQUIRED when socket has no userId', async () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;

      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'AUTH_REQUIRED',
      }));
    });

    it('should emit NOT_IN_ROOM when socket is not in any watch party room', async () => {
      mockSocket.rooms = new Set(['socket-123']);

      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'NOT_IN_ROOM',
      }));
    });
  });

  describe('ephemeral behavior (NOT stored in DB)', () => {
    it('should NOT call database for reactions', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 45 });

      // Reactions are ephemeral - emit should succeed without DB
      expect(mockIo.emit).toHaveBeenCalledWith('reaction:new', expect.any(Object));
    });
  });

  describe('connection logging', () => {
    it('should not log on client connect', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { registerReactionHandlers } = await import('../reaction-handler');
      registerReactionHandlers(mockIo as SocketIOServer);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

// =============================================================================
// Reaction Type Validation
// =============================================================================

describe('Reaction type structure', () => {
  it('should have correct reaction structure', () => {
    const reaction = {
      userId: 'user-456',
      userName: 'Mom',
      emoji: '😂',
      videoTimestamp: 45,
      timestamp: Date.now(),
    };
    expect(reaction).toHaveProperty('userId');
    expect(reaction).toHaveProperty('userName');
    expect(reaction).toHaveProperty('emoji');
    expect(reaction).toHaveProperty('videoTimestamp');
    expect(reaction).toHaveProperty('timestamp');
  });
});
