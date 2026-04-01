/**
 * Watch Party Presence System
 * 
 * Tracks which family members are currently watching the same video.
 * Heartbeat-based presence with green/grey dot indicators.
 * 
 * PRD Spec:
 * - Green dot: heartbeat within 30 seconds
 * - Grey dot: inactive for >30 seconds but present
 * - Removed after 2 minutes of no heartbeat
 */


// ============================================
// Types
// ============================================

export type PresenceStatus = 'active' | 'idle' | 'offline';

export interface PresenceUser {
  oderId: string;
  userId: string;
  name: string;
  avatar: string | null;
  status: PresenceStatus;
  lastSeen: number; // Unix timestamp in ms
  deviceId: string; // Identifies which device (for multi-device sync)
}

export interface RoomPresence {
  roomId: string;
  users: Map<string, PresenceUser>; // keyed by oderId (device-specific)
  updatedAt: number;
}

export interface PresenceUpdate {
  userId: string;
  name: string;
  avatar: string | null;
  status: PresenceStatus;
  deviceId: string;
  lastSeen: number;
}

// Optimized user representation for broadcasting (merged multi-device)
export interface MergedPresenceUser {
  oderId: string; // Primary oderId (first device that joined)
  userId: string;
  name: string;
  avatar: string | null;
  status: PresenceStatus;
  isMultiDevice: boolean;
  deviceCount: number;
  lastSeen: number;
}

export interface PresenceState {
  users: MergedPresenceUser[];
  timestamp: number;
}

// Socket.IO event payloads
export interface RoomJoinedPayload {
  roomId: string;
  presence: PresenceState;
}

export interface PresenceUpdatePayload {
  users: MergedPresenceUser[];
}

// ============================================
// Constants (from PRD)
// ============================================

const HEARTBEAT_INTERVAL_MS = 10_000; // Client sends heartbeat every 10s
const IDLE_THRESHOLD_MS = 30_000; // Grey dot after 30s idle
const REMOVAL_THRESHOLD_MS = 120_000; // Remove after 2min no heartbeat
const MAX_DEVICES_PER_USER = 5; // Max devices to track per user

// ============================================
// Room Presence Manager
// ============================================

export class PresenceManager {
  private rooms: Map<string, RoomPresence> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    this.startCleanup();
  }
  
  /**
   * Get or create a room
   */
  getOrCreateRoom(roomId: string): RoomPresence {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        users: new Map(),
        updatedAt: Date.now(),
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }
  
  /**
   * Get room presence state (merged for multi-device users)
   */
  getRoomPresence(roomId: string): PresenceState {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { users: [], timestamp: Date.now() };
    }
    return this.mergePresenceState(room);
  }
  
  /**
   * Add a user to a room
   */
  joinRoom(
    roomId: string,
    userId: string,
    name: string,
    avatar: string | null,
    deviceId: string
  ): PresenceUser {
    const room = this.getOrCreateRoom(roomId);
    
    // Check if this device is already in the room
    const existingDevice = this.findUserByDevice(room, deviceId);
    if (existingDevice) {
      // Update lastSeen and mark as active
      existingDevice.lastSeen = Date.now();
      existingDevice.status = 'active';
      room.updatedAt = Date.now();
      return existingDevice;
    }
    
    // Check user device limit
    const userDevices = this.getUserDevices(room, userId);
    if (userDevices.length >= MAX_DEVICES_PER_USER) {
      // Remove oldest device
      const oldest = userDevices.sort((a, b) => a.lastSeen - b.lastSeen)[0];
      room.users.delete(oldest.oderId);
    }
    
    const oderId = this.generateOderId();
    const user: PresenceUser = {
      oderId,
      userId,
      name,
      avatar,
      status: 'active',
      lastSeen: Date.now(),
      deviceId,
    };
    
    room.users.set(oderId, user);
    room.updatedAt = Date.now();
    return user;
  }
  
  /**
   * Remove a device from a room
   */
  leaveRoom(roomId: string, deviceId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const user = this.findUserByDevice(room, deviceId);
    if (!user) return false;
    
    room.users.delete(user.oderId);
    room.updatedAt = Date.now();
    
    // Clean up empty rooms after a delay (handled by cleanup interval)
    return true;
  }
  
  /**
   * Remove a user (all devices) from a room
   */
  removeUser(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const userDevices = this.getUserDevices(room, userId);
    for (const device of userDevices) {
      room.users.delete(device.oderId);
    }
    room.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Process a heartbeat from a user
   */
  heartbeat(roomId: string, deviceId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const user = this.findUserByDevice(room, deviceId);
    if (!user) return false;
    
    user.lastSeen = Date.now();
    user.status = 'active';
    room.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Update presence status based on idle detection
   */
  updateIdleStatus(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const now = Date.now();
    for (const user of room.users.values()) {
      const timeSinceLastSeen = now - user.lastSeen;
      
      if (timeSinceLastSeen >= REMOVAL_THRESHOLD_MS) {
        // User should be removed
        room.users.delete(user.oderId);
      } else if (timeSinceLastSeen >= IDLE_THRESHOLD_MS && user.status === 'active') {
        // Mark as idle
        user.status = 'idle';
        room.updatedAt = Date.now();
      }
    }
  }
  
  /**
   * Get all users in a room (non-merged)
   */
  getRawRoomUsers(roomId: string): PresenceUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }
  
  /**
   * Merge multiple devices for the same user into a single presence
   */
  private mergePresenceState(room: RoomPresence): PresenceState {
    const now = Date.now();
    const userMap = new Map<string, {
      devices: PresenceUser[];
      primary: PresenceUser;
    }>();
    
    // Group devices by userId
    for (const user of room.users.values()) {
      const timeSinceLastSeen = now - user.lastSeen;
      
      // Skip users that should be removed due to inactivity
      if (timeSinceLastSeen >= REMOVAL_THRESHOLD_MS) {
        continue;
      }
      
      if (!userMap.has(user.userId)) {
        userMap.set(user.userId, { devices: [], primary: user });
      }
      userMap.get(user.userId)!.devices.push(user);
      
      // Update primary if this device was seen more recently
      if (user.lastSeen > userMap.get(user.userId)!.primary.lastSeen) {
        userMap.get(user.userId)!.primary = user;
      }
    }
    
    // Convert to merged presence users
    const mergedUsers: MergedPresenceUser[] = [];
    for (const [userId, { devices, primary }] of userMap) {
      // Determine overall status (use the most active status)
      let overallStatus: PresenceStatus = 'offline';
      const now = Date.now();
      const timeSinceLastSeen = now - primary.lastSeen;
      
      if (timeSinceLastSeen >= IDLE_THRESHOLD_MS) {
        overallStatus = 'idle';
      } else {
        overallStatus = 'active';
      }
      
      mergedUsers.push({
        oderId: primary.oderId,
        userId,
        name: primary.name,
        avatar: primary.avatar,
        status: overallStatus,
        isMultiDevice: devices.length > 1,
        deviceCount: devices.length,
        lastSeen: primary.lastSeen,
      });
    }
    
    return {
      users: mergedUsers,
      timestamp: now,
    };
  }
  
  /**
   * Find a user by device ID
   */
  private findUserByDevice(room: RoomPresence, deviceId: string): PresenceUser | undefined {
    for (const user of room.users.values()) {
      if (user.deviceId === deviceId) {
        return user;
      }
    }
    return undefined;
  }
  
  /**
   * Get all devices for a user in a room
   */
  private getUserDevices(room: RoomPresence, userId: string): PresenceUser[] {
    return Array.from(room.users.values()).filter(u => u.userId === userId);
  }
  
  /**
   * Generate a unique oderId for a presence entry
   */
  private generateOderId(): string {
    // Use crypto for UUID generation
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  /**
   * Start periodic cleanup of stale presence entries
   */
  private startCleanup(): void {
    if (typeof setInterval === 'undefined') return;
    
    this.cleanupInterval = setInterval(() => {
      for (const roomId of this.rooms.keys()) {
        this.updateIdleStatus(roomId);
      }
      
      // Remove empty rooms
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }, IDLE_THRESHOLD_MS / 2); // Run cleanup every 15 seconds
  }
  
  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.rooms.clear();
  }
  
  /**
   * Get the number of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
  
  /**
   * Check if a room exists
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
  
  /**
   * Remove a room entirely
   */
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }
}

// ============================================
// Singleton instance for the server
// ============================================

let _presenceManager: PresenceManager | null = null;

export function getPresenceManager(): PresenceManager {
  if (!_presenceManager) {
    _presenceManager = new PresenceManager();
  }
  return _presenceManager;
}

export function resetPresenceManager(): void {
  if (_presenceManager) {
    _presenceManager.destroy();
    _presenceManager = null;
  }
}

// ============================================
// Room ID Builder
// ============================================

/**
 * Build a room ID from components
 * Format: family:{familyId}:video:{videoId}:session:{sessionId}
 */
export function buildRoomId(familyId: string, videoId: string, sessionId: string): string {
  return `family:${familyId}:video:${videoId}:session:${sessionId}`;
}

/**
 * Parse a room ID into its components
 */
export function parseRoomId(roomId: string): {
  familyId: string;
  videoId: string;
  sessionId: string;
} | null {
  const parts = roomId.split(':');
  if (parts.length !== 6) return null;
  if (parts[0] !== 'family' || parts[2] !== 'video' || parts[4] !== 'session') return null;
  
  return {
    familyId: parts[1],
    videoId: parts[3],
    sessionId: parts[5],
  };
}

// ============================================
// Validation helpers
// ============================================

/**
 * Validate a room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  return parseRoomId(roomId) !== null;
}

/**
 * Validate presence update payload
 */
export function isValidPresenceUpdate(update: unknown): update is PresenceUpdate {
  if (typeof update !== 'object' || update === null) return false;
  const u = update as Record<string, unknown>;
  return (
    typeof u.userId === 'string' &&
    typeof u.name === 'string' &&
    (u.avatar === null || typeof u.avatar === 'string') &&
    (u.status === 'active' || u.status === 'idle' || u.status === 'offline') &&
    typeof u.deviceId === 'string' &&
    typeof u.lastSeen === 'number'
  );
}
