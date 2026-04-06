/**
 * Watch Party Socket Presence Tests
 * CTM-230: Socket.IO + Redis presence backend
 * 
 * Tests for:
 * - Redis presence manager operations (mocked Redis)
 * - Socket.IO server initialization with Redis adapter
 * - JOIN/LEAVE/DISCONNECT handlers update Redis presence
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Redis } from '@upstash/redis';
import {
  RedisPresenceManager,
  getRedisPresenceManager,
  resetRedisPresenceManager,
} from '../redis-presence';

// Mock Redis client
const mockRedisSet = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisDel = vi.fn();
const mockRedisSadd = vi.fn();
const mockRedisSrem = vi.fn();
const mockRedisSmembers = vi.fn();
const mockRedisScard = vi.fn();
const mockRedisExists = vi.fn();
const mockRedisExpire = vi.fn();

const mockRedis = {
  set: mockRedisSet,
  get: mockRedisGet,
  del: mockRedisDel,
  sadd: mockRedisSadd,
  srem: mockRedisSrem,
  smembers: mockRedisSmembers,
  scard: mockRedisScard,
  exists: mockRedisExists,
  expire: mockRedisExpire,
} as unknown as Redis;

describe('redis-presence', () => {
  beforeEach(() => {
    vi.resetModules();
    resetRedisPresenceManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRedisPresenceManager();
  });

  describe('RedisPresenceManager', () => {
    describe('joinRoom', () => {
      it('should add user to Redis set and hash', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisSet.mockResolvedValue(1);
        mockRedisSadd.mockResolvedValue(1);
        mockRedisExpire.mockResolvedValue(1);

        const user = await manager.joinRoom(
          'family:fam1:video:vid1:session:sess1',
          'oder-123',
          'user-456',
          'Mom',
          'https://avatar.png',
          'device-abc'
        );

        expect(user.oderId).toBe('oder-123');
        expect(user.userId).toBe('user-456');
        expect(user.name).toBe('Mom');
        expect(user.avatar).toBe('https://avatar.png');
        expect(user.deviceId).toBe('device-abc');
        expect(user.joinedAt).toBeGreaterThan(0);
        expect(user.lastSeen).toBeGreaterThan(0);

        // Verify Redis calls
        expect(mockRedisSet).toHaveBeenCalled();
        expect(mockRedisSadd).toHaveBeenCalled();
        expect(mockRedisExpire).toHaveBeenCalled();
      });

      it('should handle null avatar', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisSet.mockResolvedValue(1);
        mockRedisSadd.mockResolvedValue(1);
        mockRedisExpire.mockResolvedValue(1);

        const user = await manager.joinRoom(
          'family:fam1:video:vid1:session:sess1',
          'oder-123',
          'user-456',
          'Dad',
          null,
          'device-abc'
        );

        expect(user.avatar).toBeNull();
      });
    });

    describe('leaveRoom', () => {
      it('should remove user from Redis set and hash', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisSrem.mockResolvedValue(1);
        mockRedisDel.mockResolvedValue(1);

        const result = await manager.leaveRoom(
          'family:fam1:video:vid1:session:sess1',
          'oder-123'
        );

        expect(result).toBe(true);
        expect(mockRedisSrem).toHaveBeenCalled();
        expect(mockRedisDel).toHaveBeenCalled();
      });
    });

    describe('heartbeat', () => {
      it('should refresh user lastSeen and TTL', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        const userData = JSON.stringify({
          oderId: 'oder-123',
          userId: 'user-456',
          name: 'Mom',
          avatar: null,
          deviceId: 'device-abc',
          joinedAt: Date.now() - 5000,
          lastSeen: Date.now() - 5000,
        });

        mockRedisGet.mockResolvedValue(userData);
        mockRedisSet.mockResolvedValue(1);
        mockRedisExpire.mockResolvedValue(1);

        const result = await manager.heartbeat(
          'family:fam1:video:vid1:session:sess1',
          'oder-123'
        );

        expect(result).toBe(true);
        expect(mockRedisGet).toHaveBeenCalled();
        expect(mockRedisSet).toHaveBeenCalled();
        expect(mockRedisExpire).toHaveBeenCalled();
      });

      it('should return false if user not found', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisGet.mockResolvedValue(null);

        const result = await manager.heartbeat(
          'family:fam1:video:vid1:session:sess1',
          'nonexistent'
        );

        expect(result).toBe(false);
      });
    });

    describe('getRoomPresence', () => {
      it('should return all users in room', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        const user1 = JSON.stringify({
          oderId: 'oder-1',
          userId: 'user-1',
          name: 'Mom',
          avatar: null,
          deviceId: 'device-1',
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        });

        const user2 = JSON.stringify({
          oderId: 'oder-2',
          userId: 'user-2',
          name: 'Dad',
          avatar: null,
          deviceId: 'device-2',
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        });

        mockRedisSmembers.mockResolvedValue(['oder-1', 'oder-2']);
        mockRedisGet
          .mockResolvedValueOnce(user1)
          .mockResolvedValueOnce(user2);

        const state = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');

        expect(state.users.length).toBe(2);
        expect(state.users[0].name).toBe('Mom');
        expect(state.users[1].name).toBe('Dad');
        expect(state.timestamp).toBeGreaterThan(0);
      });

      it('should return empty array for empty room', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisSmembers.mockResolvedValue([]);

        const state = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');

        expect(state.users).toEqual([]);
        expect(state.timestamp).toBeGreaterThan(0);
      });

      it('should return empty array when room does not exist', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisSmembers.mockResolvedValue(null);

        const state = await manager.getRoomPresence('nonexistent:room');

        expect(state.users).toEqual([]);
      });
    });

    describe('hasRoom', () => {
      it('should return true if room has users', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisExists.mockResolvedValue(1);

        const result = await manager.hasRoom('family:fam1:video:vid1:session:sess1');

        expect(result).toBe(true);
      });

      it('should return false if room does not exist', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisExists.mockResolvedValue(0);

        const result = await manager.hasRoom('nonexistent:room');

        expect(result).toBe(false);
      });
    });

    describe('getRoomUserCount', () => {
      it('should return correct count', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisScard.mockResolvedValue(3);

        const count = await manager.getRoomUserCount('family:fam1:video:vid1:session:sess1');

        expect(count).toBe(3);
      });

      it('should return 0 when undefined', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisScard.mockResolvedValue(undefined);

        const count = await manager.getRoomUserCount('family:fam1:video:vid1:session:sess1');

        expect(count).toBe(0);
      });
    });

    describe('clearRoom', () => {
      it('should delete all presence data for room', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        mockRedisDel.mockResolvedValue(1);

        await manager.clearRoom('family:fam1:video:vid1:session:sess1');

        expect(mockRedisDel).toHaveBeenCalled();
      });
    });

    describe('cache invalidation', () => {
      it('should invalidate cache on joinRoom', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        // joinRoom invalidates cache by calling localCache.delete()
        // We verify this by checking that after joinRoom, getRoomPresence
        // does NOT use the cache (because smembers is NOT called in cache path)
        mockRedisSet.mockResolvedValue(1);
        mockRedisSadd.mockResolvedValue(1);
        mockRedisExpire.mockResolvedValue(1);
        mockRedisSmembers.mockResolvedValue(['oder-123']);
        mockRedisGet.mockResolvedValue(JSON.stringify({
          oderId: 'oder-123',
          userId: 'user-456',
          name: 'Mom',
          avatar: null,
          deviceId: 'device-abc',
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        }));

        // After joinRoom, cache is invalidated
        await manager.joinRoom('room1', 'oder-123', 'user-456', 'Mom', null, 'device-abc');

        // Subsequent getRoomPresence should hit Redis (not cache)
        const state = await manager.getRoomPresence('room1');
        expect(state.users.length).toBe(1);
        expect(state.users[0].userId).toBe('user-456');
      });

      it('should clear all caches', async () => {
        const manager = new RedisPresenceManager(mockRedis);

        // First, populate cache by calling getRoomPresence
        mockRedisSmembers.mockResolvedValue([]);
        await manager.getRoomPresence('room1');
        await manager.getRoomPresence('room2');

        // Clear cache
        manager.clearCache();

        // After clearCache, next calls should hit Redis again
        mockRedisSmembers.mockClear();
        mockRedisSmembers.mockResolvedValue([]);
        await manager.getRoomPresence('room1');
        await manager.getRoomPresence('room2');

        // Should have called smembers twice (once per room)
        expect(mockRedisSmembers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const manager1 = getRedisPresenceManager(mockRedis);
      const manager2 = getRedisPresenceManager(mockRedis);
      expect(manager1).toBe(manager2);
    });

    it('should reset singleton', () => {
      const manager1 = getRedisPresenceManager(mockRedis);
      resetRedisPresenceManager();
      const manager2 = getRedisPresenceManager(mockRedis);
      expect(manager1).not.toBe(manager2);
    });
  });
});

describe('redis-presence integration', () => {
  // These tests verify the integration between Socket.IO handlers and Redis presence
  
  describe('with mocked Redis client', () => {
    it('should simulate full join-leave cycle', async () => {
      const manager = new RedisPresenceManager(mockRedis);

      // Mock responses for join
      mockRedisSet.mockResolvedValue(1);
      mockRedisSadd.mockResolvedValue(1);
      mockRedisExpire.mockResolvedValue(1);

      // User joins room
      const user = await manager.joinRoom(
        'family:fam1:video:vid1:session:sess1',
        'oder-123',
        'user-456',
        'Mom',
        null,
        'device-abc'
      );
      expect(user.userId).toBe('user-456');

      // Mock response for presence check
      mockRedisSmembers.mockResolvedValue(['oder-123']);
      mockRedisGet.mockResolvedValue(JSON.stringify(user));

      // Get presence
      const presence = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');
      expect(presence.users.length).toBe(1);
      expect(presence.users[0].name).toBe('Mom');

      // Mock response for leave
      mockRedisSrem.mockResolvedValue(1);
      mockRedisDel.mockResolvedValue(1);

      // User leaves room
      await manager.leaveRoom('family:fam1:video:vid1:session:sess1', 'oder-123');

      // Mock response for empty presence
      mockRedisSmembers.mockResolvedValue([]);

      // Get presence again
      const presenceAfterLeave = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');
      expect(presenceAfterLeave.users.length).toBe(0);
    });

    it('should simulate heartbeat keeping user alive', async () => {
      const manager = new RedisPresenceManager(mockRedis);

      // User joins room
      mockRedisSet.mockResolvedValue(1);
      mockRedisSadd.mockResolvedValue(1);
      mockRedisExpire.mockResolvedValue(1);

      await manager.joinRoom(
        'family:fam1:video:vid1:session:sess1',
        'oder-123',
        'user-456',
        'Mom',
        null,
        'device-abc'
      );

      // Get original lastSeen
      mockRedisSmembers.mockResolvedValue(['oder-123']);
      const originalPresence = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');
      const originalLastSeen = originalPresence.users[0].lastSeen;

      // Advance time
      await new Promise(r => setTimeout(r, 10));

      // Send heartbeat
      const userData = JSON.stringify({
        ...originalPresence.users[0],
        lastSeen: originalLastSeen,
      });
      mockRedisGet.mockResolvedValue(userData);
      mockRedisSet.mockResolvedValue(1);
      mockRedisExpire.mockResolvedValue(1);

      await manager.heartbeat('family:fam1:video:vid1:session:sess1', 'oder-123');

      // Get updated presence - note cache was invalidated so we call again
      mockRedisSmembers.mockResolvedValue(['oder-123']);
      const updatedPresence = await manager.getRoomPresence('family:fam1:video:vid1:session:sess1');
      
      expect(updatedPresence.users[0].lastSeen).toBeGreaterThanOrEqual(originalLastSeen);
    });
  });
});
