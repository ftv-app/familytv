/**
 * Watch Party Chat Handler Tests
 * CTM-229: Chat message handling, rate limiting, persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// Test Mocks
// =============================================================================

vi.mock('./security', () => ({
  AuthenticatedUser: {},
  sanitizeChatMessage: vi.fn((text: string) => text),
  validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
  checkChatRateLimit: vi.fn(),
  verifyRoomFamilyScope: vi.fn(),
  safeChatMessageForBroadcast: vi.fn((msg: any) => msg),
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

// Lazy mock for @/lib/db - factory returns a function that creates mock when called
vi.mock('@/lib/db', async () => {
  const mockFn = vi.fn();
  return { sql: mockFn };
});

// =============================================================================
// Imports
// =============================================================================

import { registerChatHandlers } from '../chat-handler';

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const ROOM_ID = `family:${VALID_UUID}:video:${VALID_UUID}:session:${VALID_UUID}`;

// =============================================================================
// registerChatHandlers Tests
// =============================================================================

describe('registerChatHandlers', () => {
  let mockSocket: any;
  let mockIo: any;

  beforeEach(() => {
    vi.clearAllMocks();

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
      on: vi.fn(),
      to: vi.fn().mockReturnThis(),
    };

    mockIo = {
      on: vi.fn((event: string, handler: (socket: any) => void) => {
        if (event === 'connection') mockIo._connectionHandler = handler;
      }),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
  });

  describe('connection setup', () => {
    it('should register connection handler on io', () => {
      registerChatHandlers(mockIo);
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should call connection handler with socket', () => {
      registerChatHandlers(mockIo);
      expect(mockIo._connectionHandler).toBeDefined();
      mockIo._connectionHandler(mockSocket);
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('should log when client connects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      expect(consoleSpy).toHaveBeenCalledWith('[Chat] Client connected: socket-123');
      consoleSpy.mockRestore();
    });
  });

  describe('chat:send event', () => {
    it('should register chat:send handler', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const sendHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:send')?.[1];
      expect(sendHandler).toBeDefined();
    });

    it('should emit AUTH_REQUIRED when socket has no userId', () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const sendHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:send')?.[1];
      sendHandler({ text: 'Hello!', videoTimestamp: 0 });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'AUTH_REQUIRED' }));
    });

    it('should emit NOT_IN_ROOM when socket is not in any watch party room', () => {
      mockSocket.rooms = new Set(['socket-123']);
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const sendHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:send')?.[1];
      sendHandler({ text: 'Hello!', videoTimestamp: 0 });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'NOT_IN_ROOM' }));
    });

    it('should emit VALIDATION_ERROR when text is empty', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const sendHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:send')?.[1];
      sendHandler({ text: '', videoTimestamp: 0 });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('should emit VALIDATION_ERROR when videoTimestamp is negative', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const sendHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:send')?.[1];
      sendHandler({ text: 'Hello!', videoTimestamp: -1 });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });
  });

  describe('chat:history event', () => {
    it('should register chat:history handler', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const historyHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:history')?.[1];
      expect(historyHandler).toBeDefined();
    });

    it('should emit AUTH_REQUIRED when not authenticated', () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const historyHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:history')?.[1];
      historyHandler({ roomId: ROOM_ID });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'AUTH_REQUIRED' }));
    });

    it('should emit INVALID_PAYLOAD when roomId is missing', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const historyHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:history')?.[1];
      historyHandler({});
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'INVALID_PAYLOAD' }));
    });

    it('should emit INVALID_ROOM when roomId is invalid format', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const historyHandler = mockSocket.on.mock.calls.find(([e]: [string]) => e === 'chat:history')?.[1];
      historyHandler({ roomId: 'invalid-room-id' });
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'INVALID_ROOM' }));
    });
  });

  describe('event registration completeness', () => {
    it('should register chat:send handler', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const registeredEvents = mockSocket.on.mock.calls.map(([e]: [string]) => e);
      expect(registeredEvents).toContain('chat:send');
    });

    it('should register chat:history handler', () => {
      registerChatHandlers(mockIo);
      mockIo._connectionHandler(mockSocket);
      const registeredEvents = mockSocket.on.mock.calls.map(([e]: [string]) => e);
      expect(registeredEvents).toContain('chat:history');
    });
  });
});
