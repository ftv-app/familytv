/**
 * Watch Party Socket.IO Event Handlers
 * 
 * Handles presence-related Socket.IO events for Watch Party.
 * 
 * PRD Spec Events:
 * - Client -> Server:
 *   - room:join { familyId, videoId, sessionId }
 *   - presence:heartbeat { roomId }
 * 
 * - Server -> Client:
 *   - room:joined { roomId, presence: { users, timestamp } }
 *   - presence:update { users: MergedPresenceUser[] }
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  PresenceManager,
  getPresenceManager,
  buildRoomId,
  parseRoomId,
  isValidRoomId,
  MergedPresenceUser,
} from './presence';

// Extend Socket to include authenticated user data
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    familyId?: string;
    displayName?: string;
    avatarUrl?: string | null;
    deviceId?: string;
  }
}

// ============================================
// Socket.IO Presence Handler
// ============================================

export function registerPresenceHandlers(io: SocketIOServer): void {
  const presence = getPresenceManager();

  io.on('connection', (socket: Socket) => {
    console.log(`[Presence] Client connected: ${socket.id}`);

    /**
     * room:join - Join a watch party room
     * 
     * Payload: { familyId: string, videoId: string, sessionId: string }
     * 
     * Response: room:joined { roomId, presence }
     */
    socket.on('room:join', (payload: {
      familyId: string;
      videoId: string;
      sessionId: string;
      deviceId?: string;
    }) => {
      try {
        // Validate payload
        if (!payload.familyId || !payload.videoId || !payload.sessionId) {
          socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Missing required fields' });
          return;
        }

        // Verify user belongs to this family (from auth middleware)
        if (socket.familyId && socket.familyId !== payload.familyId) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Cannot join room for different family' });
          return;
        }

        // Build room ID
        const roomId = buildRoomId(payload.familyId, payload.videoId, payload.sessionId);

        // Validate room ID format
        if (!isValidRoomId(roomId)) {
          socket.emit('error', { code: 'INVALID_ROOM', message: 'Invalid room ID format' });
          return;
        }

        // Generate or use provided device ID
        const deviceId = payload.deviceId || socket.deviceId || generateDeviceId();

        // Join the Socket.IO room
        socket.join(roomId);

        // Store device ID on socket
        socket.deviceId = deviceId;

        // Add user to presence tracking
        const user = presence.joinRoom(
          roomId,
          socket.userId || 'anonymous',
          socket.displayName || 'Family Member',
          socket.avatarUrl ?? null,
          deviceId
        );

        // Send confirmation to joining user
        const roomPresence = presence.getRoomPresence(roomId);
        socket.emit('room:joined', {
          roomId,
          presence: roomPresence,
        });

        // Broadcast presence update to all users in the room
        broadcastPresenceUpdate(io, roomId);

        console.log(`[Presence] User ${socket.userId} joined room ${roomId} with device ${deviceId}`);
      } catch (error) {
        console.error('[Presence] Error in room:join:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join room' });
      }
    });

    /**
     * presence:heartbeat - Keep presence alive
     * 
     * Payload: { roomId: string }
     * 
     * Response: presence:update (broadcast to room)
     */
    socket.on('presence:heartbeat', (payload: { roomId: string }) => {
      try {
        if (!payload.roomId) {
          socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Missing roomId' });
          return;
        }

        // Validate room ID
        if (!isValidRoomId(payload.roomId)) {
          socket.emit('error', { code: 'INVALID_ROOM', message: 'Invalid room ID format' });
          return;
        }

        // Verify socket is in the room
        if (!socket.rooms.has(payload.roomId)) {
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'You are not in this room' });
          return;
        }

        // Process heartbeat
        const deviceId = socket.deviceId || generateDeviceId();
        const success = presence.heartbeat(payload.roomId, deviceId);

        if (success) {
          // Broadcast updated presence to room
          broadcastPresenceUpdate(io, payload.roomId);
        }
      } catch (error) {
        console.error('[Presence] Error in presence:heartbeat:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to process heartbeat' });
      }
    });

    /**
     * room:leave - Leave a watch party room
     * 
     * Payload: { roomId: string }
     * 
     * Response: room:left { roomId }
     */
    socket.on('room:leave', (payload: { roomId: string }) => {
      try {
        if (!payload.roomId) {
          socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Missing roomId' });
          return;
        }

        // Leave Socket.IO room
        socket.leave(payload.roomId);

        // Remove from presence tracking
        const deviceId = socket.deviceId || generateDeviceId();
        presence.leaveRoom(payload.roomId, deviceId);

        // Broadcast presence update
        broadcastPresenceUpdate(io, payload.roomId);

        // Confirm leave
        socket.emit('room:left', { roomId: payload.roomId });

        console.log(`[Presence] User ${socket.userId} left room ${payload.roomId}`);
      } catch (error) {
        console.error('[Presence] Error in room:leave:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to leave room' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`[Presence] Client disconnected: ${socket.id}`);

      // Remove user from all rooms they were in
      // Note: In production, we might want to keep the user marked as "disconnected" 
      // rather than immediately removing them, to handle reconnections
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id && isValidRoomId(roomId)) {
          const deviceId = socket.deviceId || generateDeviceId();
          presence.leaveRoom(roomId, deviceId);
          broadcastPresenceUpdate(io, roomId);
        }
      }
    });
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Broadcast presence update to all users in a room
 */
function broadcastPresenceUpdate(io: SocketIOServer, roomId: string): void {
  const presence = getPresenceManager();
  const roomPresence = presence.getRoomPresence(roomId);

  io.to(roomId).emit('presence:update', {
    users: roomPresence.users,
  });
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Get presence state for a specific room
 */
export function getRoomPresenceState(roomId: string) {
  const presence = getPresenceManager();
  return presence.getRoomPresence(roomId);
}

/**
 * Check if a room exists in presence tracking
 */
export function hasRoom(roomId: string): boolean {
  const presence = getPresenceManager();
  return presence.hasRoom(roomId);
}
