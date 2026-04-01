/**
 * Unit tests for Watch Party Room Management
 * Part of CTM-229: Watch Party WebSocket Server
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addUserToSession,
  removeUserFromSession,
  getSessionUsers,
  getSessionUserCount,
  isUserInSession,
  getFamilyActiveSessions,
  getActiveFamilies,
  cleanupDisconnectedUser,
  clearPresenceStore,
  getLeavePresenceUpdate,
  getJoinPresenceUpdate,
  extractSessionIdFromRoomKey,
  extractFamilyIdFromRoomKey,
  isValidRoomKey,
  joinWatchPartyRoom,
  leaveWatchPartyRoom,
} from '../rooms';
import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../types';

// Mock the auth module
vi.mock('../auth', () => ({
  verifyWatchPartyAccess: vi.fn().mockResolvedValue({
    allowed: true,
    userName: 'Test User',
  }),
}));

// Create mock objects
const createMockServer = (): Server => ({
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
} as unknown as Server);

const createMockSocket = (overrides?: Partial<AuthenticatedSocket>): AuthenticatedSocket => ({
  id: 'socket-123',
  userId: 'user-456',
  userName: 'Test User',
  familyId: undefined,
  sessionId: undefined,
  join: vi.fn().mockResolvedValue(undefined),
  leave: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  ...overrides,
} as unknown as AuthenticatedSocket);

describe('Watch Party Rooms', () => {
  let mockServer: Server;

  beforeEach(() => {
    mockServer = createMockServer();
    clearPresenceStore();
  });

  describe('addUserToSession', () => {
    it('should add a user to a session and return presence update', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const userId = 'user-789';
      const userName = 'John Doe';

      const result = addUserToSession(familyId, sessionId, userId, userName);

      expect(result).toEqual({
        userId,
        userName,
        sessionId,
        joinedAt: expect.any(Number),
        action: 'join',
      });
    });

    it('should track multiple users in the same session', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      addUserToSession(familyId, sessionId, 'user-1', 'User One');
      addUserToSession(familyId, sessionId, 'user-2', 'User Two');
      addUserToSession(familyId, sessionId, 'user-3', 'User Three');

      const users = getSessionUsers(familyId, sessionId);
      expect(users).toHaveLength(3);
    });

    it('should update existing user presence (rejoin)', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const userId = 'user-existing';

      // First join
      const firstJoin = addUserToSession(familyId, sessionId, userId, 'User');
      
      // Second join (rejoin) - should update timestamp
      const secondJoin = addUserToSession(familyId, sessionId, userId, 'User Updated');

      // Should have latest joinedAt
      expect(secondJoin.joinedAt).toBeGreaterThanOrEqual(firstJoin.joinedAt);
    });
  });

  describe('removeUserFromSession', () => {
    it('should remove a user and return leave presence update', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const userId = 'user-789';

      // First add the user
      addUserToSession(familyId, sessionId, userId, 'Test User');

      // Then remove them
      const result = removeUserFromSession(familyId, sessionId, userId);

      expect(result).toEqual({
        userId,
        userName: 'Test User',
        sessionId,
        joinedAt: expect.any(Number),
        action: 'leave',
      });
    });

    it('should return null if user was not in session', () => {
      const result = removeUserFromSession('fam-none', 'session-none', 'user-none');
      expect(result).toBeNull();
    });

    it('should correctly update user count after removal', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      addUserToSession(familyId, sessionId, 'user-1', 'User 1');
      addUserToSession(familyId, sessionId, 'user-2', 'User 2');

      expect(getSessionUserCount(familyId, sessionId)).toBe(2);

      removeUserFromSession(familyId, sessionId, 'user-1');

      expect(getSessionUserCount(familyId, sessionId)).toBe(1);
    });
  });

  describe('getSessionUsers', () => {
    it('should return empty array for non-existent session', () => {
      const users = getSessionUsers('fam-none', 'session-none');
      expect(users).toEqual([]);
    });

    it('should return all users in a session', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      addUserToSession(familyId, sessionId, 'user-1', 'Alice');
      addUserToSession(familyId, sessionId, 'user-2', 'Bob');
      addUserToSession(familyId, sessionId, 'user-3', 'Charlie');

      const users = getSessionUsers(familyId, sessionId);

      expect(users).toHaveLength(3);
      expect(users.map(u => u.userName)).toContain('Alice');
      expect(users.map(u => u.userName)).toContain('Bob');
      expect(users.map(u => u.userName)).toContain('Charlie');
    });

    it('should not return users from other sessions', () => {
      const familyId = 'fam-123';

      addUserToSession(familyId, 'session-A', 'user-1', 'User A');
      addUserToSession(familyId, 'session-B', 'user-2', 'User B');

      const usersA = getSessionUsers(familyId, 'session-A');
      const usersB = getSessionUsers(familyId, 'session-B');

      expect(usersA).toHaveLength(1);
      expect(usersA[0].userName).toBe('User A');
      expect(usersB).toHaveLength(1);
      expect(usersB[0].userName).toBe('User B');
    });
  });

  describe('getSessionUserCount', () => {
    it('should return 0 for non-existent session', () => {
      expect(getSessionUserCount('fam-none', 'session-none')).toBe(0);
    });

    it('should return correct count', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      for (let i = 0; i < 5; i++) {
        addUserToSession(familyId, sessionId, `user-${i}`, `User ${i}`);
      }

      expect(getSessionUserCount(familyId, sessionId)).toBe(5);
    });
  });

  describe('isUserInSession', () => {
    it('should return false for non-existent session', () => {
      expect(isUserInSession('fam-none', 'session-none', 'user-1')).toBe(false);
    });

    it('should return true if user is in session', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const userId = 'user-target';

      addUserToSession(familyId, sessionId, userId, 'Target User');

      expect(isUserInSession(familyId, sessionId, userId)).toBe(true);
    });

    it('should return false if user is not in session', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      addUserToSession(familyId, sessionId, 'user-1', 'User 1');

      expect(isUserInSession(familyId, sessionId, 'user-other')).toBe(false);
    });
  });

  describe('getFamilyActiveSessions', () => {
    it('should return empty array when no sessions exist', () => {
      expect(getFamilyActiveSessions('fam-none')).toEqual([]);
    });

    it('should return all active session IDs for a family', () => {
      const familyId = 'fam-123';

      addUserToSession(familyId, 'session-1', 'user-1', 'User 1');
      addUserToSession(familyId, 'session-2', 'user-2', 'User 2');
      addUserToSession(familyId, 'session-3', 'user-3', 'User 3');

      const sessions = getFamilyActiveSessions(familyId);

      expect(sessions).toContain('session-1');
      expect(sessions).toContain('session-2');
      expect(sessions).toContain('session-3');
    });

    it('should not return sessions from other families', () => {
      addUserToSession('fam-A', 'session-1', 'user-1', 'User A');
      addUserToSession('fam-B', 'session-2', 'user-2', 'User B');

      const sessionsA = getFamilyActiveSessions('fam-A');
      const sessionsB = getFamilyActiveSessions('fam-B');

      expect(sessionsA).toEqual(['session-1']);
      expect(sessionsB).toEqual(['session-2']);
    });
  });

  describe('getActiveFamilies', () => {
    it('should return empty array when no families have sessions', () => {
      expect(getActiveFamilies()).toEqual([]);
    });

    it('should return all families with active sessions', () => {
      addUserToSession('fam-A', 'session-1', 'user-1', 'User A');
      addUserToSession('fam-B', 'session-1', 'user-2', 'User B');
      addUserToSession('fam-C', 'session-1', 'user-3', 'User C');

      const families = getActiveFamilies();

      expect(families).toContain('fam-A');
      expect(families).toContain('fam-B');
      expect(families).toContain('fam-C');
    });

    it('should not return duplicates for same family', () => {
      addUserToSession('fam-A', 'session-1', 'user-1', 'User 1');
      addUserToSession('fam-A', 'session-2', 'user-2', 'User 2');

      const families = getActiveFamilies();
      expect(families.filter(f => f === 'fam-A')).toHaveLength(1);
    });
  });

  describe('cleanupDisconnectedUser', () => {
    it('should clean up user presence on disconnect', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const userId = 'user-789';

      // Add user
      addUserToSession(familyId, sessionId, userId, 'Test User');
      expect(isUserInSession(familyId, sessionId, userId)).toBe(true);

      // Cleanup
      cleanupDisconnectedUser(mockServer, familyId, sessionId, userId);

      // User should be removed
      expect(isUserInSession(familyId, sessionId, userId)).toBe(false);
    });

    it('should emit presence update to remaining users', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      addUserToSession(familyId, sessionId, 'user-1', 'User 1');
      addUserToSession(familyId, sessionId, 'user-2', 'User 2');

      cleanupDisconnectedUser(mockServer, familyId, sessionId, 'user-1');

      // The server's to().emit() should have been called
      expect(mockServer.to).toHaveBeenCalled();
    });

    it('should handle cleanup for non-existent user gracefully', () => {
      expect(() => {
        cleanupDisconnectedUser(mockServer, 'fam-none', 'session-none', 'user-none');
      }).not.toThrow();
    });
  });

  describe('getLeavePresenceUpdate', () => {
    it('should generate correct leave presence update', () => {
      const result = getLeavePresenceUpdate('fam-123', 'session-456', 'user-789', 'Test User');
      
      expect(result).toEqual({
        userId: 'user-789',
        userName: 'Test User',
        sessionId: 'session-456',
        joinedAt: expect.any(Number),
        action: 'leave',
      });
    });
  });

  describe('getJoinPresenceUpdate', () => {
    it('should generate correct join presence update', () => {
      const result = getJoinPresenceUpdate('fam-123', 'session-456', 'user-789', 'Test User');
      
      expect(result).toEqual({
        userId: 'user-789',
        userName: 'Test User',
        sessionId: 'session-456',
        joinedAt: expect.any(Number),
        action: 'join',
      });
    });
  });

  describe('extractSessionIdFromRoomKey', () => {
    it('should extract session ID from valid room key', () => {
      expect(extractSessionIdFromRoomKey('watchparty:fam-123:session-456')).toBe('session-456');
    });

    it('should return null for invalid room key format', () => {
      expect(extractSessionIdFromRoomKey('watchparty:fam-123')).toBeNull();
      expect(extractSessionIdFromRoomKey('invalid:key')).toBeNull();
      expect(extractSessionIdFromRoomKey('')).toBeNull();
    });
  });

  describe('extractFamilyIdFromRoomKey', () => {
    it('should extract family ID from valid room key', () => {
      expect(extractFamilyIdFromRoomKey('watchparty:fam-123:session-456')).toBe('fam-123');
    });

    it('should return null for invalid room key format', () => {
      expect(extractFamilyIdFromRoomKey('watchparty')).toBeNull();
      expect(extractFamilyIdFromRoomKey('invalid')).toBeNull();
      expect(extractFamilyIdFromRoomKey('')).toBeNull();
    });
  });

  describe('isValidRoomKey', () => {
    it('should return true for valid watch party room keys', () => {
      expect(isValidRoomKey('watchparty:fam-123:session-456')).toBe(true);
      expect(isValidRoomKey('watchparty:a:b')).toBe(true);
    });

    it('should return false for invalid room keys', () => {
      expect(isValidRoomKey('watchparty:fam-123')).toBe(false);
      expect(isValidRoomKey('chatroom:fam-123:session-456')).toBe(false);
      expect(isValidRoomKey('')).toBe(false);
      expect(isValidRoomKey('invalid')).toBe(false);
    });
  });

  describe('joinWatchPartyRoom', () => {
    beforeEach(() => {
      clearPresenceStore();
    });

    it('should join a user to a watch party room successfully', async () => {
      const io = createMockServer();
      const socket = createMockSocket({ userId: 'user-123', userName: 'Test User' });
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      const result = await joinWatchPartyRoom(io, socket, familyId, sessionId);

      expect(result).toBe(true);
      expect(socket.join).toHaveBeenCalled();
      expect(socket.familyId).toBe(familyId);
      expect(socket.sessionId).toBe(sessionId);
    });

    it('should return false when user is not in family', async () => {
      const { verifyWatchPartyAccess } = await import('../auth');
      vi.mocked(verifyWatchPartyAccess).mockResolvedValueOnce({
        allowed: false,
        userName: 'Unknown',
      });

      const io = createMockServer();
      const socket = createMockSocket({ userId: 'user-unknown', userName: 'Unknown' });
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      const result = await joinWatchPartyRoom(io, socket, familyId, sessionId);

      expect(result).toBe(false);
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('should return false when socket has no userId', async () => {
      const io = createMockServer();
      const socket = createMockSocket({ userId: undefined });
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      const result = await joinWatchPartyRoom(io, socket, familyId, sessionId);

      expect(result).toBe(false);
    });

    it('should emit presence update to other users', async () => {
      const io = createMockServer();
      const socket = createMockSocket({ userId: 'user-123', userName: 'Test User' });
      const familyId = 'fam-123';
      const sessionId = 'session-456';

      await joinWatchPartyRoom(io, socket, familyId, sessionId);

      // Should emit presence.list to the joining user
      expect(socket.emit).toHaveBeenCalledWith('presence.list', expect.any(Array));
    });
  });

  describe('leaveWatchPartyRoom', () => {
    beforeEach(() => {
      clearPresenceStore();
    });

    it('should leave a watch party room successfully', () => {
      const io = createMockServer();
      const socket = createMockSocket({
        userId: 'user-123',
        familyId: 'fam-123',
        sessionId: 'session-456',
      });

      // First join
      addUserToSession('fam-123', 'session-456', 'user-123', 'Test User');

      leaveWatchPartyRoom(io, socket);

      expect(socket.leave).toHaveBeenCalled();
      expect(socket.familyId).toBeUndefined();
      expect(socket.sessionId).toBeUndefined();
    });

    it('should not throw when socket has no family/session info', () => {
      const io = createMockServer();
      const socket = createMockSocket({
        userId: 'user-123',
        familyId: undefined,
        sessionId: undefined,
      });

      expect(() => leaveWatchPartyRoom(io, socket)).not.toThrow();
    });

    it('should clear socket family and session info', () => {
      const io = createMockServer();
      const socket = createMockSocket({
        userId: 'user-123',
        familyId: 'fam-123',
        sessionId: 'session-456',
      });

      leaveWatchPartyRoom(io, socket);

      expect(socket.familyId).toBeUndefined();
      expect(socket.sessionId).toBeUndefined();
    });
  });
});
