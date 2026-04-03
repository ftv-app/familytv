/**
 * Watch Party Socket Handlers Tests
 * CTM-229: Presence event handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerPresenceHandlers, getRoomPresenceState, hasRoom } from '../socket-handlers';
import { resetPresenceManager, getPresenceManager } from '../presence';

// ============================================
// Test Setup
// ============================================

describe('socket-handlers', () => {
  let mockIO: any;
  let mockSocket: any;

  beforeEach(() => {
    vi.resetModules();
    resetPresenceManager();

    // Create mock socket
    mockSocket = {
      id: 'socket-123',
      userId: 'user-456',
      familyId: 'family-789',
      displayName: 'Mom',
      avatarUrl: 'https://example.com/avatar.png',
      deviceId: 'device-abc',
      rooms: new Set(['socket-123']),
      emit: vi.fn(),
      on: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
    };

    // Create mock IO
    mockIO = {
      on: vi.fn(),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetPresenceManager();
  });

  // ============================================
  // Connection Tests
  // ============================================

  describe('connection', () => {
    it('should register connection handler', () => {
      registerPresenceHandlers(mockIO);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up room:join listener', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('room:join', expect.any(Function));
    });

    it('should set up presence:heartbeat listener', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('presence:heartbeat', expect.any(Function));
    });

    it('should set up room:leave listener', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('room:leave', expect.any(Function));
    });
  });

  // ============================================
  // Room Join Tests
  // ============================================

  describe('room:join event', () => {
    it('should join room and broadcast presence update', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];

      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
        deviceId: 'device-abc',
      });

      // Should join Socket.IO room
      expect(mockSocket.join).toHaveBeenCalledWith('family:family-789:video:video-123:session:session-456');

      // Should emit room:joined to the socket
      expect(mockSocket.emit).toHaveBeenCalledWith('room:joined', expect.objectContaining({
        roomId: 'family:family-789:video:video-123:session:session-456',
        presence: expect.objectContaining({
          users: expect.any(Array),
        }),
      }));

      // Should broadcast presence update to room via io.to().emit()
      expect(mockIO.to).toHaveBeenCalledWith('family:family-789:video:video-123:session:session-456');
      expect(mockIO.emit).toHaveBeenCalledWith('presence:update', expect.any(Object));
    });

    it('should reject when user belongs to different family', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      mockSocket.familyId = 'family-123';

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];

      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ code: 'UNAUTHORIZED' })
      );
    });

    it('should reject missing required fields', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];

      // Missing sessionId
      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ code: 'INVALID_PAYLOAD' })
      );
    });

    it('should generate device ID if not provided', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      // Remove deviceId from socket
      delete mockSocket.deviceId;

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];

      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
      });

      // Should still work (generates device ID)
      expect(mockSocket.emit).toHaveBeenCalledWith('room:joined', expect.any(Object));
    });
  });

  // ============================================
  // Presence Heartbeat Tests
  // ============================================

  describe('presence:heartbeat event', () => {
    it('should register heartbeat handler', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const heartbeatHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'presence:heartbeat')?.[1];

      expect(heartbeatHandler).toBeDefined();
      expect(typeof heartbeatHandler).toBe('function');
    });

    it('should reject heartbeat without roomId', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const heartbeatHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'presence:heartbeat')?.[1];

      heartbeatHandler({}); // Missing roomId

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ code: 'INVALID_PAYLOAD' })
      );
    });

    it('should reject heartbeat when not in room', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      // Socket is not in any watch party room
      mockSocket.rooms.clear();
      mockSocket.rooms.add('socket-123');

      const heartbeatHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'presence:heartbeat')?.[1];

      heartbeatHandler({
        roomId: 'family:family-789:video:video-123:session:session-456',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ code: 'NOT_IN_ROOM' })
      );
    });
  });

  // ============================================
  // Room Leave Tests
  // ============================================

  describe('room:leave event', () => {
    it('should leave room and broadcast presence update', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      // First join a room
      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];
      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
        deviceId: 'device-abc',
      });

      // Reset mocks
      mockIO.emit.mockClear();
      mockIO.to.mockClear();

      // Now leave
      const roomLeaveHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:leave')?.[1];

      roomLeaveHandler({
        roomId: 'family:family-789:video:video-123:session:session-456',
      });

      // Should leave Socket.IO room
      expect(mockSocket.leave).toHaveBeenCalledWith('family:family-789:video:video-123:session:session-456');

      // Should emit room:left to the socket
      expect(mockSocket.emit).toHaveBeenCalledWith('room:left', expect.any(Object));

      // Should broadcast presence update to room
      expect(mockIO.to).toHaveBeenCalledWith('family:family-789:video:video-123:session:session-456');
      expect(mockIO.emit).toHaveBeenCalledWith('presence:update', expect.any(Object));
    });
  });

  // ============================================
  // Presence State Utility Tests
  // ============================================

  describe('presence state utilities', () => {
    it('should get room presence state after join', () => {
      registerPresenceHandlers(mockIO);

      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];
      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
        deviceId: 'device-abc',
      });

      const presence = getRoomPresenceState('family:family-789:video:video-123:session:session-456');

      expect(presence).toBeDefined();
      expect(presence.users).toBeDefined();
      expect(Array.isArray(presence.users)).toBe(true);
    });

    it('should return empty state for nonexistent room', () => {
      const presence = getRoomPresenceState('family:nonexistent:video:nonexistent:session:nonexistent');

      expect(presence).toEqual({
        users: [],
        timestamp: expect.any(Number),
      });
    });

    it('should check if room exists', () => {
      // Room doesn't exist initially
      expect(hasRoom('family:family-789:video:video-123:session:session-456')).toBe(false);

      // Join room via socket
      registerPresenceHandlers(mockIO);
      const connectionHandler = mockIO.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
      connectionHandler(mockSocket);

      const roomJoinHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'room:join')?.[1];
      roomJoinHandler({
        familyId: 'family-789',
        videoId: 'video-123',
        sessionId: 'session-456',
        deviceId: 'device-abc',
      });

      // Now room exists
      expect(hasRoom('family:family-789:video:video-123:session:session-456')).toBe(true);
    });
  });
});
