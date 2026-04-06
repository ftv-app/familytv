/**
 * Watch Party Redis Presence
 * 
 * Redis-backed presence tracking for horizontal scaling.
 * Uses Redis sets with TTL for tracking which users/devices are in watch party rooms.
 * 
 * Key pattern: `presence:{roomId}` -> Redis Set (member = oderId)
 * User data: `presence:{roomId}:{oderId}` -> JSON string
 * TTL: 30 seconds (refreshed by heartbeat)
 */

import { Redis } from '@upstash/redis';

// Redis key prefixes
const PRESENCE_KEY_PREFIX = 'presence:';
const HEARTBEAT_TTL_SECONDS = 30;

// ============================================
// Types
// ============================================

export interface RedisPresenceUser {
  oderId: string;
  userId: string;
  name: string;
  avatar: string | null;
  deviceId: string;
  joinedAt: number;
  lastSeen: number;
}

export interface RedisPresenceState {
  users: RedisPresenceUser[];
  timestamp: number;
}

// ============================================
// Redis Presence Manager
// ============================================

/**
 * RedisPresenceManager - tracks presence in Redis for horizontal scaling
 * 
 * Each user/device in a room is stored as a member in a Redis set.
 * The user data is stored as a separate key: presence:{roomId}:{oderId}
 * The set key has a TTL of 30 seconds, refreshed on heartbeat.
 */
export class RedisPresenceManager {
  private redis: Redis;
  private localCache: Map<string, RedisPresenceUser[]> = new Map();
  private cacheTTL: number = 0;
  private readonly CACHE_MAX_AGE_MS = 5000; // 5 second cache

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Get the Redis key for a room's presence set
   */
  private getPresenceKey(roomId: string): string {
    return `${PRESENCE_KEY_PREFIX}${roomId}`;
  }

  /**
   * Get the Redis key for a user's presence data
   */
  private getUserKey(roomId: string, oderId: string): string {
    return `${PRESENCE_KEY_PREFIX}${roomId}:${oderId}`;
  }

  /**
   * Add a user to a room in Redis
   */
  async joinRoom(
    roomId: string,
    oderId: string,
    userId: string,
    name: string,
    avatar: string | null,
    deviceId: string
  ): Promise<RedisPresenceUser> {
    const key = this.getPresenceKey(roomId);
    const userKey = this.getUserKey(roomId, oderId);
    const now = Date.now();

    const user: RedisPresenceUser = {
      oderId,
      userId,
      name,
      avatar,
      deviceId,
      joinedAt: now,
      lastSeen: now,
    };

    // Store user data as JSON string with composite key
    await this.redis.set(userKey, JSON.stringify(user));

    // Add to set for room membership tracking
    await this.redis.sadd(key, oderId);

    // Refresh TTL on the presence set
    await this.redis.expire(key, HEARTBEAT_TTL_SECONDS);

    // Also refresh TTL on user data
    await this.redis.expire(userKey, HEARTBEAT_TTL_SECONDS);

    // Invalidate local cache
    this.localCache.delete(roomId);

    return user;
  }

  /**
   * Remove a user (device) from a room
   */
  async leaveRoom(roomId: string, oderId: string): Promise<boolean> {
    const key = this.getPresenceKey(roomId);
    const userKey = this.getUserKey(roomId, oderId);

    // Remove from set
    await this.redis.srem(key, oderId);

    // Remove user data key
    await this.redis.del(userKey);

    // Invalidate local cache
    this.localCache.delete(roomId);

    return true;
  }

  /**
   * Refresh a user's presence (heartbeat)
   */
  async heartbeat(roomId: string, oderId: string): Promise<boolean> {
    const userKey = this.getUserKey(roomId, oderId);
    const now = Date.now();

    // Get current user data
    const userData = await this.redis.get(userKey);
    if (!userData) {
      return false;
    }

    const user = JSON.parse(userData as string) as RedisPresenceUser;
    user.lastSeen = now;

    // Update user data
    await this.redis.set(userKey, JSON.stringify(user));

    // Refresh TTL on user data
    await this.redis.expire(userKey, HEARTBEAT_TTL_SECONDS);

    // Invalidate local cache
    this.localCache.delete(roomId);

    return true;
  }

  /**
   * Get all users in a room
   */
  async getRoomPresence(roomId: string): Promise<RedisPresenceState> {
    const key = this.getPresenceKey(roomId);
    const now = Date.now();

    // Check local cache first
    const cached = this.localCache.get(roomId);
    if (cached && now - this.cacheTTL < this.CACHE_MAX_AGE_MS) {
      return { users: cached, timestamp: now };
    }

    // Get all members of the set
    const oderIds = await this.redis.smembers(key);
    if (!oderIds || oderIds.length === 0) {
      return { users: [], timestamp: now };
    }

    // Get user data for each member
    const users: RedisPresenceUser[] = [];
    for (const oderId of oderIds) {
      const userKey = this.getUserKey(roomId, oderId);
      const userData = await this.redis.get(userKey);
      if (userData) {
        users.push(JSON.parse(userData as string) as RedisPresenceUser);
      }
    }

    // Cache the result
    this.localCache.set(roomId, users);
    this.cacheTTL = now;

    return { users, timestamp: now };
  }

  /**
   * Check if a room exists (has any users)
   */
  async hasRoom(roomId: string): Promise<boolean> {
    const key = this.getPresenceKey(roomId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Get the count of users in a room
   */
  async getRoomUserCount(roomId: string): Promise<number> {
    const key = this.getPresenceKey(roomId);
    const count = await this.redis.scard(key);
    return count || 0;
  }

  /**
   * Remove all users from a room
   */
  async clearRoom(roomId: string): Promise<void> {
    const key = this.getPresenceKey(roomId);

    // Get all members first
    const oderIds = await this.redis.smembers(key);
    if (oderIds && oderIds.length > 0) {
      // Delete all user data keys
      for (const oderId of oderIds) {
        const userKey = this.getUserKey(roomId, oderId);
        await this.redis.del(userKey);
      }
    }

    // Delete the presence set
    await this.redis.del(key);

    // Invalidate local cache
    this.localCache.delete(roomId);
  }

  /**
   * Invalidate local cache for a room
   */
  invalidateCache(roomId: string): void {
    this.localCache.delete(roomId);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.localCache.clear();
  }
}

// ============================================
// Singleton
// ============================================

let _redisPresenceManager: RedisPresenceManager | null = null;

/**
 * Get or create the Redis presence manager singleton
 */
export function getRedisPresenceManager(redis: Redis): RedisPresenceManager {
  if (!_redisPresenceManager) {
    _redisPresenceManager = new RedisPresenceManager(redis);
  }
  return _redisPresenceManager;
}

/**
 * Reset the Redis presence manager (for testing)
 */
export function resetRedisPresenceManager(): void {
  if (_redisPresenceManager) {
    _redisPresenceManager.clearCache();
    _redisPresenceManager = null;
  }
}
