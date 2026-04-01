import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PresenceManager,
  getPresenceManager,
  resetPresenceManager,
  buildRoomId,
  parseRoomId,
  isValidRoomId,
  isValidPresenceUpdate,
  PresenceStatus,
  PresenceUser,
  MergedPresenceUser,
} from '../presence';

// Mock crypto.getRandomValues for UUID generation
// Track call count to return different values each time
let mockCallCount = 0;
const mockRandomValues = vi.fn((arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) {
    // Return different bytes based on call count to ensure unique UUIDs
    arr[i] = (i + mockCallCount * 17) % 256;
  }
  mockCallCount++;
  return arr;
});
vi.stubGlobal('crypto', { getRandomValues: mockRandomValues });

describe('presence', () => {
  beforeEach(() => {
    vi.resetModules();
    resetPresenceManager();
    mockRandomValues.mockClear();
  });

  afterEach(() => {
    resetPresenceManager();
  });

  describe('PresenceManager', () => {
    describe('getOrCreateRoom', () => {
      it('creates a new room when none exists', () => {
        const manager = new PresenceManager();
        const room = manager.getOrCreateRoom('family:123:video:456:session:789');
        
        expect(room).toBeDefined();
        expect(room.roomId).toBe('family:123:video:456:session:789');
        expect(room.users.size).toBe(0);
        expect(room.updatedAt).toBeGreaterThan(0);
        
        manager.destroy();
      });

      it('returns existing room when it already exists', () => {
        const manager = new PresenceManager();
        const room1 = manager.getOrCreateRoom('test-room');
        room1.users.set('user1', {
          oderId: 'user1',
          userId: 'user1',
          name: 'Test User',
          avatar: null,
          status: 'active',
          lastSeen: Date.now(),
          deviceId: 'device1',
        });
        
        const room2 = manager.getOrCreateRoom('test-room');
        expect(room2).toBe(room1);
        expect(room2.users.size).toBe(1);
        
        manager.destroy();
      });
    });

    describe('joinRoom', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('adds a new user to the room', () => {
        const result = manager.joinRoom(
          'test-room',
          'user1',
          'Mom',
          'https://example.com/avatar.png',
          'device1'
        );
        
        expect(result.userId).toBe('user1');
        expect(result.name).toBe('Mom');
        expect(result.avatar).toBe('https://example.com/avatar.png');
        expect(result.status).toBe('active');
        expect(result.deviceId).toBe('device1');
        expect(result.lastSeen).toBeGreaterThan(0);
        expect(result.oderId).toBeDefined();
      });

      it('updates existing device when joining again', () => {
        const user1 = manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        const originalLastSeen = user1.lastSeen;
        
        // Wait a tiny bit to ensure time difference
        const user2 = manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        
        expect(user2.oderId).toBe(user1.oderId);
        expect(user2.lastSeen).toBeGreaterThanOrEqual(originalLastSeen);
        expect(user2.status).toBe('active');
      });

      it('handles multiple devices for same user', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        const user2 = manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
        
        const room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(2);
        expect(user2.oderId).not.toBe(room.users.values().next().value.oderId);
      });

      it('respects MAX_DEVICES_PER_USER limit', () => {
        // Add 5 devices (the limit)
        for (let i = 0; i < 5; i++) {
          manager.joinRoom('test-room', 'user1', 'Mom', null, `device${i}`);
        }
        
        let room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(5);
        
        // Adding 6th device should remove oldest
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device6');
        room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(5);
      });

      it('works with null avatar', () => {
        const result = manager.joinRoom('test-room', 'user1', 'Dad', null, 'device1');
        expect(result.avatar).toBeNull();
      });
    });

    describe('leaveRoom', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('removes a user from the room', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        const result = manager.leaveRoom('test-room', 'device1');
        
        expect(result).toBe(true);
        const room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(0);
      });

      it('returns false when device not found', () => {
        const result = manager.leaveRoom('test-room', 'nonexistent');
        expect(result).toBe(false);
      });

      it('returns false when room does not exist', () => {
        const result = manager.leaveRoom('nonexistent-room', 'device1');
        expect(result).toBe(false);
      });

      it('only removes the specific device', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
        
        manager.leaveRoom('test-room', 'device1');
        
        const room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(1);
        expect(Array.from(room.users.values())[0].deviceId).toBe('device2');
      });
    });

    describe('removeUser', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('removes all devices for a user', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
        
        const result = manager.removeUser('test-room', 'user1');
        
        expect(result).toBe(true);
        const room = manager.getOrCreateRoom('test-room');
        expect(room.users.size).toBe(0);
      });

      it('returns false when user not found', () => {
        const result = manager.removeUser('test-room', 'nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('heartbeat', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
        vi.useFakeTimers();
      });

      afterEach(() => {
        manager.destroy();
        vi.useRealTimers();
      });

      it('updates lastSeen and status', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        
        const beforeHeartbeat = manager.getRawRoomUsers('test-room')[0].lastSeen;
        
        // Simulate time passing
        vi.advanceTimersByTime(1000);
        
        manager.heartbeat('test-room', 'device1');
        
        const afterHeartbeat = manager.getRawRoomUsers('test-room')[0].lastSeen;
        expect(afterHeartbeat).toBeGreaterThan(beforeHeartbeat);
      });

      it('sets status to active', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        
        // Manually set to idle
        const user = manager.getRawRoomUsers('test-room')[0];
        user.status = 'idle';
        
        manager.heartbeat('test-room', 'device1');
        
        expect(manager.getRawRoomUsers('test-room')[0].status).toBe('active');
      });

      it('returns false when device not found', () => {
        const result = manager.heartbeat('test-room', 'nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('getRoomPresence', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('returns empty state for nonexistent room', () => {
        const state = manager.getRoomPresence('nonexistent');
        
        expect(state.users).toEqual([]);
        expect(state.timestamp).toBeGreaterThan(0);
      });

      it('returns merged presence for users with multiple devices', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
        
        const state = manager.getRoomPresence('test-room');
        
        expect(state.users.length).toBe(1);
        expect(state.users[0].userId).toBe('user1');
        expect(state.users[0].isMultiDevice).toBe(true);
        expect(state.users[0].deviceCount).toBe(2);
      });

      it('returns correct presence state after joins', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        manager.joinRoom('test-room', 'user2', 'Dad', null, 'device2');
        
        const state = manager.getRoomPresence('test-room');
        
        expect(state.users.length).toBe(2);
        expect(state.users.find(u => u.userId === 'user1')?.name).toBe('Mom');
        expect(state.users.find(u => u.userId === 'user2')?.name).toBe('Dad');
      });
    });

    describe('getRawRoomUsers', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('returns empty array for nonexistent room', () => {
        const users = manager.getRawRoomUsers('nonexistent');
        expect(users).toEqual([]);
      });

      it('returns all users with their devices', () => {
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
        manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
        
        const users = manager.getRawRoomUsers('test-room');
        expect(users.length).toBe(2);
      });
    });

    describe('room management', () => {
      let manager: PresenceManager;

      beforeEach(() => {
        manager = new PresenceManager();
      });

      afterEach(() => {
        manager.destroy();
      });

      it('getRoomCount returns correct count', () => {
        expect(manager.getRoomCount()).toBe(0);
        
        manager.getOrCreateRoom('room1');
        expect(manager.getRoomCount()).toBe(1);
        
        manager.getOrCreateRoom('room2');
        expect(manager.getRoomCount()).toBe(2);
      });

      it('hasRoom returns correct value', () => {
        expect(manager.hasRoom('room1')).toBe(false);
        
        manager.getOrCreateRoom('room1');
        expect(manager.hasRoom('room1')).toBe(true);
      });

      it('deleteRoom removes room', () => {
        manager.getOrCreateRoom('room1');
        expect(manager.hasRoom('room1')).toBe(true);
        
        manager.deleteRoom('room1');
        expect(manager.hasRoom('room1')).toBe(false);
      });
    });

    describe('singleton', () => {
      it('getPresenceManager returns singleton', () => {
        const manager1 = getPresenceManager();
        const manager2 = getPresenceManager();
        expect(manager1).toBe(manager2);
      });

      it('resetPresenceManager clears singleton', () => {
        const manager1 = getPresenceManager();
        resetPresenceManager();
        const manager2 = getPresenceManager();
        expect(manager1).not.toBe(manager2);
      });
    });
  });

  describe('buildRoomId', () => {
    it('builds correct room ID format', () => {
      const roomId = buildRoomId('family123', 'video456', 'session789');
      expect(roomId).toBe('family:family123:video:video456:session:session789');
    });

    it('handles special characters in IDs', () => {
      const roomId = buildRoomId('fam-123', 'vid-456', 'sess-789');
      expect(roomId).toBe('family:fam-123:video:vid-456:session:sess-789');
    });
  });

  describe('parseRoomId', () => {
    it('parses valid room ID', () => {
      const result = parseRoomId('family:fam123:video:vid456:session:sess789');
      
      expect(result).toEqual({
        familyId: 'fam123',
        videoId: 'vid456',
        sessionId: 'sess789',
      });
    });

    it('returns null for invalid room ID', () => {
      expect(parseRoomId('invalid')).toBeNull();
      expect(parseRoomId('family:fam123:invalid:vid456:session:sess789')).toBeNull();
      expect(parseRoomId('family:fam123:video:vid456')).toBeNull();
    });

    it('returns null for wrong prefix', () => {
      expect(parseRoomId('wrong:fam123:video:vid456:session:sess789')).toBeNull();
    });
  });

  describe('isValidRoomId', () => {
    it('returns true for valid room IDs', () => {
      expect(isValidRoomId('family:fam123:video:vid456:session:sess789')).toBe(true);
    });

    it('returns false for invalid room IDs', () => {
      expect(isValidRoomId('invalid')).toBe(false);
      expect(isValidRoomId('family:')).toBe(false);
      expect(isValidRoomId('')).toBe(false);
    });
  });

  describe('isValidPresenceUpdate', () => {
    it('returns true for valid update', () => {
      const update = {
        userId: 'user1',
        name: 'Mom',
        avatar: null,
        status: 'active' as PresenceStatus,
        deviceId: 'device1',
        lastSeen: Date.now(),
      };
      expect(isValidPresenceUpdate(update)).toBe(true);
    });

    it('returns true for update with avatar string', () => {
      const update = {
        userId: 'user1',
        name: 'Mom',
        avatar: 'https://example.com/avatar.png',
        status: 'idle' as PresenceStatus,
        deviceId: 'device1',
        lastSeen: Date.now(),
      };
      expect(isValidPresenceUpdate(update)).toBe(true);
    });

    it('returns false for invalid userId', () => {
      const update = {
        userId: 123,
        name: 'Mom',
        avatar: null,
        status: 'active',
        deviceId: 'device1',
        lastSeen: Date.now(),
      };
      expect(isValidPresenceUpdate(update)).toBe(false);
    });

    it('returns false for invalid status', () => {
      const update = {
        userId: 'user1',
        name: 'Mom',
        avatar: null,
        status: 'invalid',
        deviceId: 'device1',
        lastSeen: Date.now(),
      };
      expect(isValidPresenceUpdate(update)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidPresenceUpdate(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidPresenceUpdate(undefined)).toBe(false);
    });

    it('returns false for missing fields', () => {
      expect(isValidPresenceUpdate({ userId: 'user1' })).toBe(false);
    });
  });

  describe('MergedPresenceUser type', () => {
    let manager: PresenceManager;

    beforeEach(() => {
      manager = new PresenceManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('has correct structure for single device user', () => {
      manager.joinRoom('test-room', 'user1', 'Mom', 'https://avatar.png', 'device1');
      
      const state = manager.getRoomPresence('test-room');
      const user = state.users[0];
      
      expect(user.userId).toBe('user1');
      expect(user.name).toBe('Mom');
      expect(user.avatar).toBe('https://avatar.png');
      expect(user.status).toBe('active');
      expect(user.isMultiDevice).toBe(false);
      expect(user.deviceCount).toBe(1);
      expect(user.lastSeen).toBeGreaterThan(0);
      expect(user.oderId).toBeDefined();
    });

    it('has correct structure for multi-device user', () => {
      manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
      manager.joinRoom('test-room', 'user1', 'Mom', null, 'device2');
      
      const state = manager.getRoomPresence('test-room');
      const user = state.users[0];
      
      expect(user.isMultiDevice).toBe(true);
      expect(user.deviceCount).toBe(2);
    });
  });

  describe('idle detection', () => {
    let manager: PresenceManager;

    beforeEach(() => {
      // Use fake timers BEFORE creating manager to ensure Date is mocked
      vi.useFakeTimers({ shouldAdvanceTime: false });
      manager = new PresenceManager();
    });

    afterEach(() => {
      manager.destroy();
      vi.useRealTimers();
    });

    it('marks user as idle after IDLE_THRESHOLD_MS', () => {
      manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
      
      // Advance time past idle threshold (30 seconds)
      vi.advanceTimersByTime(31_000);
      
      // Trigger idle status update
      manager.updateIdleStatus('test-room');
      
      const state = manager.getRoomPresence('test-room');
      expect(state.users[0].status).toBe('idle');
    });

    it('removes user after REMOVAL_THRESHOLD_MS', () => {
      manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
      
      // Advance time past removal threshold (2 minutes)
      vi.advanceTimersByTime(121_000);
      
      // Trigger idle status update
      manager.updateIdleStatus('test-room');
      
      const state = manager.getRoomPresence('test-room');
      expect(state.users.length).toBe(0);
    });

    it('active heartbeat prevents idle status', () => {
      manager.joinRoom('test-room', 'user1', 'Mom', null, 'device1');
      
      // Advance time halfway to idle threshold
      vi.advanceTimersByTime(15_000);
      
      // Send heartbeat
      manager.heartbeat('test-room', 'device1');
      
      // Advance time to just under idle threshold
      vi.advanceTimersByTime(14_000);
      
      // Trigger idle status update
      manager.updateIdleStatus('test-room');
      
      const state = manager.getRoomPresence('test-room');
      expect(state.users[0].status).toBe('active');
    });
  });
});

describe('PresenceStatus type', () => {
  it('allows active status', () => {
    const status: PresenceStatus = 'active';
    expect(status).toBe('active');
  });

  it('allows idle status', () => {
    const status: PresenceStatus = 'idle';
    expect(status).toBe('idle');
  });

  it('allows offline status', () => {
    const status: PresenceStatus = 'offline';
    expect(status).toBe('offline');
  });
});
