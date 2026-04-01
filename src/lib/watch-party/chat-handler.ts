/**
 * Watch Party Chat Handler
 * 
 * Handles chat message events for Watch Party rooms.
 * - Stores messages in Neon Postgres
 * - Broadcasts to all room members
 * - Enforces rate limiting and sanitization
 * - Respects family-scoped room access
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { sql as getSql } from '@/lib/db';
import {
  AuthenticatedUser,
  sanitizeChatMessage,
  validateVideoTimestamp,
  checkChatRateLimit,
  verifyRoomFamilyScope,
  safeChatMessageForBroadcast,
  RateLimitError,
  ValidationError,
} from './security';
import { buildRoomId, parseRoomId } from './presence';

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

export interface ChatMessagePayload {
  text: string;
  videoTimestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  timestamp: string;
  videoTimestamp: number;
}

export interface RoomJoinedPayload {
  roomId: string;
  presence: {
    users: Array<{
      oderId: string;
      userId: string;
      name: string;
      avatar: string | null;
      status: 'active' | 'idle' | 'offline';
      isMultiDevice: boolean;
      deviceCount: number;
      lastSeen: number;
    }>;
    timestamp: number;
  };
  history: ChatMessage[];
}

// ============================================
// Constants
// ============================================

const MAX_CHAT_HISTORY = 100;

// ============================================
// SQL Helpers (Inline for this module to avoid circular deps)
// ============================================

/**
 * Save a chat message to the database
 */
async function saveChatMessage(
  roomId: string,
  familyId: string,
  userId: string,
  userName: string,
  userAvatar: string | null | undefined,
  text: string,
  videoTimestamp: number
): Promise<ChatMessage> {
  const sql = getSql();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  await sql`
    INSERT INTO family_chat_messages (id, room_id, family_id, user_id, user_name, user_avatar, text, video_timestamp_seconds, created_at)
    VALUES (${id}, ${roomId}, ${familyId}, ${userId}, ${userName}, ${userAvatar ?? null}, ${text}, ${videoTimestamp}, ${timestamp})
  `;

  return {
    id,
    userId,
    userName,
    userAvatar: userAvatar ?? null,
    text,
    timestamp,
    videoTimestamp,
  };
}

/**
 * Get chat history for a room (last 100 messages)
 */
async function getChatHistory(roomId: string, limit: number = MAX_CHAT_HISTORY): Promise<ChatMessage[]> {
  const sql = getSql();

  const rows = await sql`
    SELECT id, user_id, user_name, user_avatar, text, video_timestamp_seconds, created_at
    FROM family_chat_messages
    WHERE room_id = ${roomId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as unknown as Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_avatar: string | null;
    text: string;
    video_timestamp_seconds: number;
    created_at: string;
  }>;

  // Return in chronological order (oldest first)
  return rows.reverse().map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    text: row.text,
    timestamp: row.created_at,
    videoTimestamp: row.video_timestamp_seconds,
  }));
}

/**
 * Prune old messages when exceeding limit
 */
async function pruneChatHistory(roomId: string): Promise<void> {
  const sql = getSql();

  // Delete messages beyond the 100 newest
  await sql`
    DELETE FROM family_chat_messages
    WHERE id IN (
      SELECT id FROM family_chat_messages
      WHERE room_id = ${roomId}
      ORDER BY created_at DESC
      OFFSET ${MAX_CHAT_HISTORY}
    )
    AND room_id = ${roomId}
  `;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ============================================
// Chat Handler Registration
// ============================================

/**
 * Register chat event handlers on a Socket.IO server
 */
export function registerChatHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    // Client connected

    /**
     * chat:send - Send a chat message to the room
     * 
     * Payload: { text: string, videoTimestamp: number }
     * 
     * Response: 
     * - Error event on failure
     * - chat:new broadcast to room on success
     */
    socket.on('chat:send', async (payload: ChatMessagePayload) => {
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
        } catch (_err) {
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Cannot send messages in this room' });
          return;
        }

        // Rate limit check
        try {
          checkChatRateLimit(socket.userId);
        } catch (err) {
          if (err instanceof RateLimitError) {
            socket.emit('chat:rate_limited', {
              message: err.message,
              retryAfterMs: err.retryAfterMs,
            });
            return;
          }
          throw err;
        }

        // Validate and sanitize message
        let sanitizedText: string;
        let validatedTimestamp: number;

        try {
          sanitizedText = sanitizeChatMessage(payload.text);
          validatedTimestamp = validateVideoTimestamp(payload.videoTimestamp);
        } catch (err) {
          if (err instanceof ValidationError) {
            socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
            return;
          }
          throw err;
        }

        // Save message to database
        const message = await saveChatMessage(
          roomId,
          roomParts.familyId,
          socket.userId,
          socket.displayName || 'Family Member',
          socket.avatarUrl,
          sanitizedText,
          validatedTimestamp
        );

        // Check if we need to prune old messages
        await pruneChatHistory(roomId);

        // Broadcast to all users in the room (including sender)
        const safeMessage = safeChatMessageForBroadcast({
          id: message.id,
          userId: message.userId,
          userName: message.userName,
          userAvatar: message.userAvatar,
          text: message.text,
          timestamp: message.timestamp,
          videoTimestamp: message.videoTimestamp,
        });

        io.to(roomId).emit('chat:new', safeMessage);
      } catch (error) {
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
      }
    });

    /**
     * chat:history - Get chat history for a room
     * 
     * Payload: { roomId: string }
     * 
     * Response: chat:history event with message array
     */
    socket.on('chat:history', async (payload: { roomId: string }) => {
      try {
        // Validate user is authenticated
        if (!socket.userId || !socket.familyId) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
          return;
        }

        if (!payload.roomId) {
          socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Missing roomId' });
          return;
        }

        const roomParts = parseRoomId(payload.roomId);
        if (!roomParts) {
          socket.emit('error', { code: 'INVALID_ROOM', message: 'Invalid room ID format' });
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
          socket.emit('error', { code: 'UNAUTHORIZED', message: 'Cannot access this room' });
          return;
        }

        // Get history
        const history = await getChatHistory(payload.roomId);

        socket.emit('chat:history', history);
      } catch (error) {
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to fetch chat history' });
      }
    });
  });
}

/**
 * Get the chat history for a specific room (utility function)
 */
export async function getRoomChatHistory(roomId: string): Promise<ChatMessage[]> {
  return getChatHistory(roomId);
}
