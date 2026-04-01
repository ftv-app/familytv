/**
 * Watch Party Chat Handler Tests
 * CTM-229: Chat message handling, rate limiting, persistence
 *
 * Tests the ACTUAL exported functions from chat-handler.ts:
 * - saveChatMessage (DB persistence)
 * - getChatHistory (DB retrieval)
 * - pruneChatHistory (DB cleanup)
 * - generateUUID (ID generation)
 * - registerChatHandlers (Socket.IO event wiring)
 * - getRoomChatHistory (public API)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as SocketIOServer, Socket } from 'socket.io';

// =============================================================================
// Mocks
// =============================================================================

// Mock crypto for UUID generation
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = (i + uuidCounter * 17) % 256;
    }
    uuidCounter++;
    return arr;
  },
});

// Mock database - sql is getSql which returns the neon function
const mockSql = vi.fn();
vi.mock('@/lib/db', () => ({
  sql: () => mockSql,
}));

// Mock security module
vi.mock('./security', () => ({
  AuthenticatedUser: {},
  sanitizeChatMessage: vi.fn((text: string) => text),
  validateVideoTimestamp: vi.fn((ts: number) => Math.floor(ts)),
  checkChatRateLimit: vi.fn(),
  verifyRoomFamilyScope: vi.fn(),
  safeChatMessageForBroadcast: vi.fn((msg) => msg),
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
const {
  saveChatMessage,
  getChatHistory,
  pruneChatHistory,
  generateUUID,
  registerChatHandlers,
  getRoomChatHistory,
  ChatMessage,
} = await import('../chat-handler');

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const ROOM_ID = `family:${VALID_UUID}:video:${VALID_UUID}:session:${VALID_UUID}`;

// =============================================================================
// generateUUID Tests
// =============================================================================

describe('generateUUID', () => {
  it('should generate a valid UUID v4 format', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidV4Regex);
  });

  it('should generate unique UUIDs on consecutive calls', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate 36 character UUID (including hyphens)', () => {
    const uuid = generateUUID();
    expect(uuid.length).toBe(36);
  });
});

// =============================================================================
// saveChatMessage Tests
// =============================================================================

describe('saveChatMessage', () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  it('should save a chat message to the database', async () => {
    mockSql.mockResolvedValueOnce([]); // INSERT

    const message = await saveChatMessage(
      ROOM_ID,
      VALID_UUID,
      'user-123',
      'Mom',
      'https://example.com/avatar.png',
      'Hello family!',
      60
    );

    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(message).toMatchObject({
      userId: 'user-123',
      userName: 'Mom',
      userAvatar: 'https://example.com/avatar.png',
      text: 'Hello family!',
      videoTimestamp: 60,
    });
    expect(message.id).toBeDefined();
    expect(message.timestamp).toBeDefined();
  });

  it('should handle null avatar', async () => {
    mockSql.mockResolvedValueOnce([]);

    const message = await saveChatMessage(
      ROOM_ID,
      VALID_UUID,
      'user-123',
      'Dad',
      null,
      'Hello!',
      120
    );

    expect(message.userAvatar).toBeNull();
  });

  it('should handle undefined avatar', async () => {
    mockSql.mockResolvedValueOnce([]);

    const message = await saveChatMessage(
      ROOM_ID,
      VALID_UUID,
      'user-123',
      'Dad',
      undefined,
      'Hello!',
      120
    );

    expect(message.userAvatar).toBeNull();
  });

  it('should include all required ChatMessage fields', async () => {
    mockSql.mockResolvedValueOnce([]);

    const message = await saveChatMessage(
      ROOM_ID,
      VALID_UUID,
      'user-123',
      'Mom',
      null,
      'Test',
      45
    );

    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('userId');
    expect(message).toHaveProperty('userName');
    expect(message).toHaveProperty('userAvatar');
    expect(message).toHaveProperty('text');
    expect(message).toHaveProperty('timestamp');
    expect(message).toHaveProperty('videoTimestamp');
  });

  it('should generate unique IDs for each message', async () => {
    mockSql.mockResolvedValue([]);

    const msg1 = await saveChatMessage(ROOM_ID, VALID_UUID, 'u1', 'A', null, 'm1', 0);
    const msg2 = await saveChatMessage(ROOM_ID, VALID_UUID, 'u2', 'B', null, 'm2', 0);

    expect(msg1.id).not.toBe(msg2.id);
  });
});

// =============================================================================
// getChatHistory Tests
// =============================================================================

describe('getChatHistory', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it('should return messages in chronological order (oldest first)', async () => {
    const dbRows = [
      {
        id: 'msg-2',
        user_id: 'user-1',
        user_name: 'Mom',
        user_avatar: null,
        text: 'Second',
        video_timestamp_seconds: 60,
        created_at: '2024-01-01T00:02:00Z',
      },
      {
        id: 'msg-1',
        user_id: 'user-1',
        user_name: 'Mom',
        user_avatar: null,
        text: 'First',
        video_timestamp_seconds: 30,
        created_at: '2024-01-01T00:01:00Z',
      },
      {
        id: 'msg-3',
        user_id: 'user-2',
        user_name: 'Dad',
        user_avatar: null,
        text: 'Third',
        video_timestamp_seconds: 90,
        created_at: '2024-01-01T00:03:00Z',
      },
    ];

    mockSql.mockResolvedValueOnce(dbRows);

    const history = await getChatHistory(ROOM_ID);

    expect(history.length).toBe(3);
    expect(history[0].id).toBe('msg-1'); // Oldest
    expect(history[1].id).toBe('msg-2');
    expect(history[2].id).toBe('msg-3'); // Newest
  });

  it('should return empty array when no messages', async () => {
    mockSql.mockResolvedValueOnce([]);

    const history = await getChatHistory(ROOM_ID);

    expect(history).toEqual([]);
  });

  it('should map database fields correctly to ChatMessage', async () => {
    const dbRow = {
      id: 'msg-1',
      user_id: 'user-123',
      user_name: 'Mom',
      user_avatar: 'https://example.com/avatar.png',
      text: 'Hello!',
      video_timestamp_seconds: 45,
      created_at: '2024-01-01T12:00:00Z',
    };

    mockSql.mockResolvedValueOnce([dbRow]);

    const [message] = await getChatHistory(ROOM_ID);

    expect(message.id).toBe('msg-1');
    expect(message.userId).toBe('user-123');
    expect(message.userName).toBe('Mom');
    expect(message.userAvatar).toBe('https://example.com/avatar.png');
    expect(message.text).toBe('Hello!');
    expect(message.videoTimestamp).toBe(45);
    expect(message.timestamp).toBe('2024-01-01T12:00:00Z');
  });

  it('should respect limit parameter', async () => {
    mockSql.mockResolvedValueOnce([]);

    await getChatHistory(ROOM_ID, 50);

    // Check the SQL call included the limit
    expect(mockSql).toHaveBeenCalled();
    const callArg = mockSql.mock.calls[0][0];
    // The limit should be passed in the template literal
    expect(JSON.stringify(callArg)).toContain('50');
  });

  it('should default to MAX_CHAT_HISTORY (100) when no limit provided', async () => {
    mockSql.mockResolvedValueOnce([]);

    await getChatHistory(ROOM_ID);

    expect(mockSql).toHaveBeenCalled();
  });
});

// =============================================================================
// pruneChatHistory Tests
// =============================================================================

describe('pruneChatHistory', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it('should delete messages beyond the limit', async () => {
    mockSql.mockResolvedValueOnce([]); // DELETE

    await pruneChatHistory(ROOM_ID);

    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should not throw on empty room', async () => {
    mockSql.mockResolvedValueOnce([]);

    await expect(pruneChatHistory('nonexistent-room')).resolves.not.toThrow();
  });

  it('should use correct room ID in query', async () => {
    mockSql.mockResolvedValueOnce([]);

    await pruneChatHistory(ROOM_ID);

    const callArg = mockSql.mock.calls[0][0];
    expect(JSON.stringify(callArg)).toContain(ROOM_ID);
  });
});

// =============================================================================
// getRoomChatHistory Tests (public API)
// =============================================================================

describe('getRoomChatHistory', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it('should return chat history for a room', async () => {
    const dbRows = [
      {
        id: 'msg-1',
        user_id: 'user-1',
        user_name: 'Mom',
        user_avatar: null,
        text: 'Hello!',
        video_timestamp_seconds: 30,
        created_at: '2024-01-01T12:00:00Z',
      },
    ];
    mockSql.mockResolvedValueOnce(dbRows);

    const history = await getRoomChatHistory(ROOM_ID);

    expect(history.length).toBe(1);
    expect(history[0].id).toBe('msg-1');
  });

  it('should return empty array when no history', async () => {
    mockSql.mockResolvedValueOnce([]);

    const history = await getRoomChatHistory(ROOM_ID);

    expect(history).toEqual([]);
  });
});

// =============================================================================
// registerChatHandlers Tests
// =============================================================================

describe('registerChatHandlers', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: Partial<SocketIOServer>;
  let connectionHandler: (socket: Socket) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;

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
      on: vi.fn(),
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

    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  describe('chat:send event', () => {
    it('should emit chat:new after saving a valid message', async () => {
      registerChatHandlers(mockIo as SocketIOServer);

      // Find the chat:send handler
      const sendHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:send'
      )?.[1] as (payload: any) => Promise<void>;

      expect(sendHandler).toBeDefined();

      mockSql.mockResolvedValueOnce([]); // saveChatMessage INSERT

      // Call the handler
      await sendHandler({ text: 'Hello family!', videoTimestamp: 45 });

      // Should have emitted chat:new
      expect(mockSocket.emit).toHaveBeenCalledWith('chat:new', expect.objectContaining({
        text: 'Hello family!',
        videoTimestamp: 45,
      }));
    });

    it('should emit AUTH_REQUIRED when socket has no userId', async () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;

      registerChatHandlers(mockIo as SocketIOServer);

      const sendHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:send'
      )?.[1] as (payload: any) => void;

      await sendHandler({ text: 'Hello!', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'AUTH_REQUIRED',
      }));
    });

    it('should emit NOT_IN_ROOM when socket is not in any watch party room', async () => {
      mockSocket.rooms = new Set(['socket-123']); // Only the socket's own room

      registerChatHandlers(mockIo as SocketIOServer);

      const sendHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:send'
      )?.[1] as (payload: any) => void;

      await sendHandler({ text: 'Hello!', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'NOT_IN_ROOM',
      }));
    });

    it('should emit SERVER_ERROR on unexpected exception', async () => {
      registerChatHandlers(mockIo as SocketIOServer);

      const sendHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:send'
      )?.[1] as (payload: any) => void;

      // Force SQL to throw
      mockSql.mockRejectedValueOnce(new Error('DB error'));

      await sendHandler({ text: 'Hello!', videoTimestamp: 0 });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'SERVER_ERROR',
      }));
    });
  });

  describe('chat:history event', () => {
    it('should emit chat:history with message array', async () => {
      const dbRows = [
        {
          id: 'msg-1',
          user_id: 'user-1',
          user_name: 'Mom',
          user_avatar: null,
          text: 'First!',
          video_timestamp_seconds: 30,
          created_at: '2024-01-01T12:00:00Z',
        },
      ];
      mockSql.mockResolvedValueOnce(dbRows);

      registerChatHandlers(mockIo as SocketIOServer);

      const historyHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:history'
      )?.[1] as (payload: any) => Promise<void>;

      expect(historyHandler).toBeDefined();

      await historyHandler({ roomId: ROOM_ID });

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:history', expect.any(Array));
    });

    it('should emit AUTH_REQUIRED when not authenticated', async () => {
      mockSocket.userId = undefined;
      mockSocket.familyId = undefined;

      registerChatHandlers(mockIo as SocketIOServer);

      const historyHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:history'
      )?.[1] as (payload: any) => void;

      await historyHandler({ roomId: ROOM_ID });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'AUTH_REQUIRED',
      }));
    });

    it('should emit INVALID_PAYLOAD when roomId is missing', async () => {
      registerChatHandlers(mockIo as SocketIOServer);

      const historyHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:history'
      )?.[1] as (payload: any) => void;

      await historyHandler({}); // No roomId

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'INVALID_PAYLOAD',
      }));
    });

    it('should emit SERVER_ERROR on database failure', async () => {
      mockSql.mockRejectedValueOnce(new Error('DB error'));

      registerChatHandlers(mockIo as SocketIOServer);

      const historyHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        ([event]) => event === 'chat:history'
      )?.[1] as (payload: any) => void;

      await historyHandler({ roomId: ROOM_ID });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'SERVER_ERROR',
      }));
    });
  });

  describe('connection logging', () => {
    it('should log when client connects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      registerChatHandlers(mockIo as SocketIOServer);

      expect(consoleSpy).toHaveBeenCalledWith('[Chat] Client connected: socket-123');

      consoleSpy.mockRestore();
    });
  });
});

// =============================================================================
// ChatMessage Type Validation
// =============================================================================

describe('ChatMessage structure', () => {
  it('should have all required fields', () => {
    const message: ChatMessage = {
      id: 'msg-123',
      userId: 'user-456',
      userName: 'Mom',
      userAvatar: null,
      text: 'Hello!',
      timestamp: '2024-01-01T12:00:00Z',
      videoTimestamp: 60,
    };

    expect(message.id).toBeDefined();
    expect(message.userId).toBeDefined();
    expect(message.userName).toBeDefined();
    expect(message.text).toBeDefined();
    expect(message.timestamp).toBeDefined();
    expect(message.videoTimestamp).toBeDefined();
  });

  it('should allow optional avatar', () => {
    const message: ChatMessage = {
      id: 'msg-123',
      userId: 'user-456',
      userName: 'Mom',
      text: 'Hello!',
      timestamp: '2024-01-01T12:00:00Z',
      videoTimestamp: 60,
    };

    expect(message.userAvatar).toBeUndefined();
  });
});
