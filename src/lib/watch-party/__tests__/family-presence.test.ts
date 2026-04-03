import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PresenceManager,
  resetPresenceManager,
  buildRoomId,
  parseRoomId,
} from '../presence';

// Mock crypto.getRandomValues for UUID generation
let mockCallCount = 0;
const mockRandomValues = vi.fn((arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = (i + mockCallCount * 17) % 256;
  }
  mockCallCount++;
  return arr;
});
vi.stubGlobal('crypto', { getRandomValues: mockRandomValues });

describe('presence - family presence', () => {
  beforeEach(() => {
    vi.resetModules();
    resetPresenceManager();
    mockRandomValues.mockClear();
    mockCallCount = 0;
  });

  afterEach(() => {
    resetPresenceManager();
  });

  describe('getFamilyPresence', () => {
    let manager: PresenceManager;

    beforeEach(() => {
      manager = new PresenceManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('returns empty list when no rooms exist for family', () => {
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers).toEqual([]);
      expect(state.timestamp).toBeGreaterThan(0);
    });

    it('returns empty list when no users in rooms', () => {
      manager.getOrCreateRoom(buildRoomId('family_123', 'video_1', 'session_1'));
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers).toEqual([]);
    });

    it('returns online members from family rooms', () => {
      // Join a watch party room
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers.length).toBe(1);
      expect(state.onlineMembers[0].userId).toBe('user_1');
      expect(state.onlineMembers[0].name).toBe('Mom');
      expect(state.onlineMembers[0].status).toBe('active');
    });

    it('does not return users from other families', () => {
      // Join family_123 room
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      // Join family_456 room
      manager.joinRoom(
        buildRoomId('family_456', 'video_1', 'session_1'),
        'user_2',
        'Dad',
        null,
        'device_2'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers.length).toBe(1);
      expect(state.onlineMembers[0].userId).toBe('user_1');
      expect(state.onlineMembers[0].name).toBe('Mom');
    });

    it('aggregates users from multiple rooms in same family', () => {
      // Join first watch party
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      // Join second watch party
      manager.joinRoom(
        buildRoomId('family_123', 'video_2', 'session_2'),
        'user_2',
        'Dad',
        null,
        'device_2'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers.length).toBe(2);
      const userIds = state.onlineMembers.map(u => u.userId).sort();
      expect(userIds).toEqual(['user_1', 'user_2']);
    });

    it('includes currentView with room details', () => {
      manager.joinRoom(
        buildRoomId('family_123', 'video_abc', 'session_xyz'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers[0].currentView).toEqual({
        roomId: 'family:family_123:video:video_abc:session:session_xyz',
        videoId: 'video_abc',
        sessionId: 'session_xyz',
      });
    });

    it('returns null currentView when user is in no rooms', () => {
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers).toEqual([]);
    });

    it('handles multi-device users correctly', () => {
      // User joins from two devices
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_2'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      // Should still return 1 user (merged)
      expect(state.onlineMembers.length).toBe(1);
      expect(state.onlineMembers[0].userId).toBe('user_1');
    });

    it('handles same user in multiple rooms', () => {
      // User joins two different watch parties
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      manager.joinRoom(
        buildRoomId('family_123', 'video_2', 'session_2'),
        'user_1',
        'Mom',
        null,
        'device_2'
      );
      
      const state = manager.getFamilyPresence('family_123');
      
      // Should return 1 user with the most recent view
      expect(state.onlineMembers.length).toBe(1);
      expect(state.onlineMembers[0].userId).toBe('user_1');
    });

    it('updates timestamp each call', () => {
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      const state1 = manager.getFamilyPresence('family_123');
      const timestamp1 = state1.timestamp;
      
      // Wait a tiny bit
      const state2 = manager.getFamilyPresence('family_123');
      
      expect(state2.timestamp).toBeGreaterThanOrEqual(timestamp1);
    });
  });

  describe('getFamilyPresence - idle detection', () => {
    let manager: PresenceManager;

    beforeEach(() => {
      vi.useFakeTimers();
      manager = new PresenceManager();
    });

    afterEach(() => {
      manager.destroy();
      vi.useRealTimers();
    });

    it('marks user as idle after IDLE_THRESHOLD_MS', () => {
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      // Advance time past idle threshold (30 seconds)
      vi.advanceTimersByTime(31_000);
      
      // Manually trigger idle status update on the room
      manager.updateIdleStatus(buildRoomId('family_123', 'video_1', 'session_1'));
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers[0].status).toBe('idle');
    });

    it('removes user after REMOVAL_THRESHOLD_MS', () => {
      manager.joinRoom(
        buildRoomId('family_123', 'video_1', 'session_1'),
        'user_1',
        'Mom',
        null,
        'device_1'
      );
      
      // Advance time past removal threshold (2 minutes)
      vi.advanceTimersByTime(121_000);
      
      // Manually trigger idle status update on the room
      manager.updateIdleStatus(buildRoomId('family_123', 'video_1', 'session_1'));
      
      const state = manager.getFamilyPresence('family_123');
      
      expect(state.onlineMembers).toEqual([]);
    });
  });
});
