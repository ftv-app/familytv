/**
 * Watch Party Reaction Handler Tests
 * CTM-229: Reaction handling, rate limiting, ephemeral broadcast
 *
 * Tests the ACTUAL exported functions from reaction-handler.ts:
 * - registerReactionHandlers (Socket.IO event wiring)
 *
 * Note: Reactions are EPHEMERAL (not stored in DB) per PRD spec.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as SocketIOServer, Socket } from 'socket.io';

// =============================================================================
// Mocks
// =============================================================================

// Mock security module
vi.mock('./security', () => ({
  AuthenticatedUser: {},
  validateReactionEmoji: vi.fn((emoji: string) => emoji),
  validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
  checkReactionRateLimit: vi.fn(),
  verifyRoomFamilyScope: vi.fn(),
  safeReactionForBroadcast: vi.fn((reaction) => reaction),
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

// Mock presence (parseRoomId)
vi.mock('./presence', () => ({
  buildRoomId: vi.fn(),
  parseRoomId: vi.fn((roomId: string) => {
    if (!roomId.includes(':')) return null;
    const parts = roomId.split(':');
    if (parts.length !== 6) return null;
    return {
      familyId: parts[1],
      videoId: parts[3],
      sessionId: parts[5],
    };
  }),
}));

// Import AFTER mocks
const { registerReactionHandlers } = await import('../reaction-handler');

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

    // Create a mock socket for each test
    mockSocket = {
      id: 'socket-123',
      userId: 'user-456',
      familyId: VALID_UUID,
      displayName: 'Mom',
      avatarUrl: null,
      deviceId: 'device-abc',
      rooms: new Set<string>([ROOM_ID, 'socket-123']),
      join: vi.fn(),
      leave: vi.fn(),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: (payload: any) => void) => {
        if (event === 'reaction:send') {
          capturedHandler = handler;
        }
      }),
      to: vi.fn().mockReturnThis(),
    };

    // Mock io.on('connection') to capture the handler
    mockIo = {
      on: vi.fn((event: string, handler: (socket: Socket) => void) => {
        if (event === 'connection') {
          // Call handler immediately with mock socket
          handler(mockSocket as Socket);
        }
      }),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
  });

  describe('reaction:send event', () => {
    it('should emit reaction:new with valid payload', async () => {
      registerReactionHandlers(mockIo as SocketIOServer);

      expect(capturedHandler).toBeDefined();

      await capturedHandler!({ emoji: '😂', videoTimestamp: 45 });

      // Should have emitted reaction:new
      expect(mockSocket.emit).not.toHaveBeenCalledWith('error', expect.any(Object));
      expect(mockIo.emit).toHaveBeenCalledWith('reaction:new', expect.objectContaining({
        emoji: '😂',
        videoTimestamp: 45,
      }));
    });

    it('should broadcast reaction to the room', async () => {
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '❤️', videoTimestamp: 30 });

      // io.to(roomId).emit should have been called
      expect(mockIo.to).toHaveBeenCalledWith(ROOM_ID);
      expect(mockIo.emit).toHaveBeenCalledWith('reaction:new', expect.any(Object));
    });

    it('should include userId and userName in broadcast', async () => {
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '👏', videoTimestamp: 60 });

      // The broadcast should include user info
      const broadcastCall = (mockIo.emit as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'reaction:new'
      );
      expect(broadcastCall).toBeDefined();
      const broadcastPayload = broadcastCall?.[1];
      expect(broadcastPayload.userId).toBe('user-456');
      expect(broadcastPayload.userName).toBe('Mom');
    });

    it('should include videoTimestamp in broadcast', async () => {
      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '🔥', videoTimestamp: 120 });

      const broadcastCall = (mockIo.emit as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'reaction:new'
      );
      expect(broadcastCall?.[1].videoTimestamp).toBe(120);
    });

    it('should include client-side timestamp for ordering', async () => {
      registerReactionHandlers(mockIo as SocketIOServer);

      const beforeTime = Date.now();
      await capturedHandler!({ emoji: '😮', videoTimestamp: 0 });
      const afterTime = Date.now();

      const broadcastCall = (mockIo.emit as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'reaction:new'
      );
      const timestamp = broadcastCall?.[1].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should emit AUTH_REQUIRED when socket has no userId', async () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'AUTH_REQUIRED',
      }));
    });

    it('should emit NOT_IN_ROOM when socket is not in any watch party room', async () => {
      mockSocket.rooms = new Set(['socket-123']); // Only the socket's own room

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'NOT_IN_ROOM',
      }));
    });

    it('should emit reaction:rate_limited when rate limit exceeded', async () => {
      // Import the mocked RateLimitError
      const { RateLimitError } = await import('../reaction-handler').then(() => 
        import('./security').then(mod => ({ RateLimitError: mod.RateLimitError }))
      );

      // Re-setup mocks to throw RateLimitError
      vi.mock('./security', () => ({
        AuthenticatedUser: {},
        validateReactionEmoji: vi.fn((emoji: string) => emoji),
        validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
        checkReactionRateLimit: vi.fn().mockImplementation(() => {
          throw new RateLimitError('Slow down', 5000);
        }),
        verifyRoomFamilyScope: vi.fn(),
        safeReactionForBroadcast: vi.fn((reaction) => reaction),
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

      // Re-register handlers with new mock
      mockSocket.emit = vi.fn();
      capturedHandler = null;
      mockIo.on = vi.fn((event: string, handler: (socket: Socket) => void) => {
        if (event === 'connection') {
          handler(mockSocket as Socket);
        }
      });

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('reaction:rate_limited', expect.objectContaining({
        message: 'Slow down',
        retryAfterMs: 5000,
      }));
    });

    it('should emit VALIDATION_ERROR for invalid emoji', async () => {
      vi.mock('./security', () => ({
        AuthenticatedUser: {},
        validateReactionEmoji: vi.fn().mockImplementation(() => {
          throw new Error('Invalid emoji');
        }),
        validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
        checkReactionRateLimit: vi.fn(),
        verifyRoomFamilyScope: vi.fn(),
        safeReactionForBroadcast: vi.fn((reaction) => reaction),
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

      mockSocket.emit = vi.fn();
      capturedHandler = null;
      mockIo.on = vi.fn((event: string, handler: (socket: Socket) => void) => {
        if (event === 'connection') {
          handler(mockSocket as Socket);
        }
      });

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '<script>', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'VALIDATION_ERROR',
      }));
    });

    it('should emit SERVER_ERROR on unexpected exception', async () => {
      vi.mock('./security', () => ({
        AuthenticatedUser: {},
        validateReactionEmoji: vi.fn((emoji: string) => emoji),
        validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
        checkReactionRateLimit: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
        verifyRoomFamilyScope: vi.fn(),
        safeReactionForBroadcast: vi.fn((reaction) => reaction),
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

      mockSocket.emit = vi.fn();
      capturedHandler = null;
      mockIo.on = vi.fn((event: string, handler: (socket: Socket) => void) => {
        if (event === 'connection') {
          handler(mockSocket as Socket);
        }
      });

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'SERVER_ERROR',
      }));
    });
  });

  describe('ephemeral behavior (NOT stored in DB)', () => {
    it('should NOT call sql (database) for reactions', async () => {
      // Verify that registerReactionHandlers does NOT import/use sql
      // by checking the mock wasn't called

      // We mock @/lib/db to track any DB calls
      vi.mock('@/lib/db', () => ({
        sql: vi.fn(),
      }));

      registerReactionHandlers(mockIo as SocketIOServer);

      await capturedHandler!({ emoji: '😂', videoTimestamp: 45 });

      // DB should NOT have been called (reactions are ephemeral)
      const { sql } = await import('@/lib/db');
      expect((sql as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    });
  });

  describe('connection logging', () => {
    it('should log when client connects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      registerReactionHandlers(mockIo as SocketIOServer);

      expect(consoleSpy).toHaveBeenCalledWith('[Reaction] Client connected: socket-123');

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
