/**
 * Watch Party Reaction Handler
 * 
 * Handles reaction events for Watch Party rooms.
 * - Ephemeral reactions (NOT stored in database per PRD)
 * - Broadcast to all room members in real-time
 * - Enforces rate limiting and validation
 * - Respects family-scoped room access
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  AuthenticatedUser,
  validateReactionEmoji,
  validateVideoTimestamp,
  checkReactionRateLimit,
  verifyRoomFamilyScope,
  safeReactionForBroadcast,
  RateLimitError,
  ValidationError,
} from './security';
import { parseRoomId } from './presence';

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
// Types
// ============================================

export interface ReactionPayload {
  emoji: string;
  videoTimestamp: number;
}

export interface Reaction {
  userId: string;
  userName: string;
  emoji: string;
  videoTimestamp: number;
  timestamp: number; // Client-side timestamp for ordering
}

// ============================================
// Constants
// ============================================

// PRD spec: max 1 reaction per 200ms = 300/min
// We enforce a more conservative 10/min for spam prevention
// See security.ts DEFAULT_RATE_LIMIT_CONFIG

// ============================================
// Reaction Handler Registration
// ============================================

/**
 * Register reaction event handlers on a Socket.IO server
 */
export function registerReactionHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Reaction] Client connected: ${socket.id}`);

    /**
     * reaction:send - Send a reaction to the room
     * 
     * Payload: { emoji: string, videoTimestamp: number }
     * 
     * Response:
     * - Error event on failure
     * - reaction:new broadcast to room on success
     * - reaction:rate_limited event if rate limited
     */
    socket.on('reaction:send', (payload: ReactionPayload) => {
      try {
        // Validate user is authenticated
        if (!socket.userId || !socket.familyId) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
          return;
        }

        // Find the room(s) this socket is in
        const rooms = Array.from(socket.rooms).filter(
          r => r !== socket.id && parseRoomId(r) !== null
        );

        if (rooms.length === 0) {
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'You are not in any watch party room' });
          return;
        }

        const roomId = rooms[0];
        const roomParts = parseRoomId(roomId);

        if (!roomParts) {
          socket.emit('error', { code: 'INVALID_ROOM', message: 'Invalid room ID' });
          return;
        }

        // Verify family membership
        const user: AuthenticatedUser = {
          userId: socket.userId,
          familyId: socket.familyId,
          displayName: socket.displayName || 'Family Member',
          avatarUrl: socket.avatarUrl ?? undefined,
        };

        try {
          verifyRoomFamilyScope(roomParts, user);
        } catch (err) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Cannot send reactions in this room' });
          return;
        }

        // Rate limit check
        try {
          checkReactionRateLimit(socket.userId);
        } catch (err) {
          if (err instanceof RateLimitError) {
            socket.emit('reaction:rate_limited', {
              message: err.message,
              retryAfterMs: err.retryAfterMs,
            });
            return;
          }
          throw err;
        }

        // Validate emoji and timestamp
        let validatedEmoji: string;
        let validatedTimestamp: number;

        try {
          validatedEmoji = validateReactionEmoji(payload.emoji);
          validatedTimestamp = validateVideoTimestamp(payload.videoTimestamp);
        } catch (err) {
          if (err instanceof ValidationError) {
            socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
            return;
          }
          throw err;
        }

        // Create reaction object (ephemeral - NOT stored)
        const reaction: Reaction = {
          userId: socket.userId,
          userName: socket.displayName || 'Family Member',
          emoji: validatedEmoji,
          videoTimestamp: validatedTimestamp,
          timestamp: Date.now(),
        };

        // Broadcast to all users in the room (including sender)
        const safeReaction = safeReactionForBroadcast(reaction);
        io.to(roomId).emit('reaction:new', safeReaction);

        console.log(`[Reaction] ${socket.userId} sent ${validatedEmoji} in room ${roomId}`);
      } catch (error) {
        console.error('[Reaction] Error sending reaction:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send reaction' });
      }
    });
  });
}
