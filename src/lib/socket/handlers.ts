/**
 * Socket.IO Event Handlers for Watch Party
 * Handles: presence.join, presence.leave, reaction.add, chat.send
 */
import type { Server, Socket } from 'socket.io';
import type {
  AuthenticatedSocket,
  PresenceJoinPayload,
  PresenceLeavePayload,
  ReactionAddPayload,
  ChatSendPayload,
  ReactionUpdate,
  ChatMessage,
  ValidEmoji,
} from './types';
import { getWatchPartyRoomKey, RATE_LIMITS, VALID_EMOJIS } from './types';
import {
  joinWatchPartyRoom,
  leaveWatchPartyRoom,
  cleanupDisconnectedUser,
} from './rooms';
import { saveChatMessage, getRecentMessages } from './chat-persistence';

// Rate limiting state (in production, use Redis)
const userRateLimits = new Map<string, { reaction: number[]; chat: number[] }>();

/**
 * Reset rate limit counters that have expired
 */
function cleanRateLimits(userId: string): void {
  const now = Date.now();
  const limits = userRateLimits.get(userId);
  
  if (!limits) return;

  // Keep only entries from the last minute
  limits.reaction = limits.reaction.filter(t => now - t < 60000);
  limits.chat = limits.chat.filter(t => now - t < 60000);

  // Remove if empty
  if (limits.reaction.length === 0 && limits.chat.length === 0) {
    userRateLimits.delete(userId);
  }
}

/**
 * Check and update rate limit
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(
  userId: string,
  type: 'reaction' | 'chat',
  maxPerMinute: number
): boolean {
  cleanRateLimits(userId);
  
  const now = Date.now();
  const limits = userRateLimits.get(userId) || { reaction: [], chat: [] };
  
  const count = type === 'reaction' ? limits.reaction.length : limits.chat.length;
  
  if (count >= maxPerMinute) {
    return false;
  }

  // Add the new timestamp
  if (type === 'reaction') {
    limits.reaction.push(now);
  } else {
    limits.chat.push(now);
  }
  
  userRateLimits.set(userId, limits);
  return true;
}

/**
 * Validate emoji is in allowed list
 */
function isValidEmoji(emoji: string): emoji is ValidEmoji {
  return VALID_EMOJIS.includes(emoji as ValidEmoji);
}

/**
 * Register all Socket.IO event handlers
 */
export function registerWatchPartyHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId;
  
  if (!userId) {
    socket.disconnect();
    return;
  }

  // ---- presence.join ----
  socket.on('presence.join', async (payload: PresenceJoinPayload, callback) => {
    try {
      const { familyId, sessionId, userName } = payload;

      if (!familyId || !sessionId) {
        return callback?.({ success: false, error: 'familyId and sessionId required' });
      }

      const success = await joinWatchPartyRoom(io, socket, familyId, sessionId);

      if (!success) {
        return callback?.({ success: false, error: 'Not authorized to join this family' });
      }

      // Get recent messages for this session
      const recentMessages = await getRecentMessages(familyId, sessionId);

      return callback?.({ success: true, recentMessages });
    } catch (error) {
      console.error('presence.join error:', error);
      return callback?.({ success: false, error: 'Failed to join session' });
    }
  });

  // ---- presence.leave ----
  socket.on('presence.leave', (payload: PresenceLeavePayload, callback) => {
    try {
      const { familyId, sessionId } = payload;

      if (!familyId || !sessionId) {
        return callback?.({ success: false, error: 'familyId and sessionId required' });
      }

      leaveWatchPartyRoom(io, socket, familyId, sessionId);
      return callback?.({ success: true });
    } catch (error) {
      console.error('presence.leave error:', error);
      return callback?.({ success: false, error: 'Failed to leave session' });
    }
  });

  // ---- reaction.add ----
  socket.on('reaction.add', async (payload: ReactionAddPayload, callback) => {
    try {
      const { familyId, sessionId, emoji, timestamp } = payload;

      if (!familyId || !sessionId || !emoji) {
        return callback?.({ success: false, error: 'familyId, sessionId, and emoji required' });
      }

      // Validate emoji
      if (!isValidEmoji(emoji)) {
        return callback?.({ success: false, error: 'Invalid emoji' });
      }

      // Rate limit check
      if (!checkRateLimit(userId, 'reaction', RATE_LIMITS.reaction.maxPerMinute)) {
        return callback?.({ success: false, error: 'Rate limited: too many reactions' });
      }

      // Verify user is in this session
      if (socket.familyId !== familyId || socket.sessionId !== sessionId) {
        return callback?.({ success: false, error: 'Not in this session' });
      }

      const roomKey = getWatchPartyRoomKey(familyId, sessionId);
      const reaction: ReactionUpdate = {
        userId,
        userName: socket.userName || 'Family Member',
        emoji,
        timestamp: timestamp || Date.now(),
      };

      // Broadcast to all users in the room (including sender)
      io.to(roomKey).emit('reaction.update', reaction);

      return callback?.({ success: true });
    } catch (error) {
      console.error('reaction.add error:', error);
      return callback?.({ success: false, error: 'Failed to add reaction' });
    }
  });

  // ---- chat.send ----
  socket.on('chat.send', async (payload: ChatSendPayload, callback) => {
    try {
      const { familyId, sessionId, message, timestamp } = payload;

      if (!familyId || !sessionId || !message) {
        return callback?.({ success: false, error: 'familyId, sessionId, and message required' });
      }

      // Validate message length
      if (message.length > RATE_LIMITS.chat.maxLength) {
        return callback?.({ 
          success: false, 
          error: `Message too long (max ${RATE_LIMITS.chat.maxLength} characters)` 
        });
      }

      if (message.trim().length === 0) {
        return callback?.({ success: false, error: 'Message cannot be empty' });
      }

      // Rate limit check
      if (!checkRateLimits(userId, 'chat', RATE_LIMITS.chat.maxPerMinute)) {
        return callback?.({ success: false, error: 'Rate limited: too many messages' });
      }

      // Verify user is in this session
      if (socket.familyId !== familyId || socket.sessionId !== sessionId) {
        return callback?.({ success: false, error: 'Not in this session' });
      }

      // Save to database
      const chatMessage = await saveChatMessage(
        familyId,
        sessionId,
        userId,
        socket.userName || 'Family Member',
        message.trim()
      );

      // Broadcast to all users in the room
      const roomKey = getWatchPartyRoomKey(familyId, sessionId);
      io.to(roomKey).emit('chat.message', chatMessage);

      return callback?.({ success: true, messageId: chatMessage.id });
    } catch (error) {
      console.error('chat.send error:', error);
      return callback?.({ success: false, error: 'Failed to send message' });
    }
  });

  // ---- chat.load ----
  socket.on('chat.load', async (payload: { familyId: string; sessionId: string }, callback) => {
    try {
      const { familyId, sessionId } = payload;

      if (!familyId || !sessionId) {
        return callback?.({ success: false, error: 'familyId and sessionId required' });
      }

      const messages = await getRecentMessages(familyId, sessionId);
      return callback?.({ success: true, messages });
    } catch (error) {
      console.error('chat.load error:', error);
      return callback?.({ success: false, error: 'Failed to load messages' });
    }
  });

  // ---- disconnect ----
  socket.on('disconnect', (reason) => {
    console.log(`Socket ${userId} disconnected: ${reason}`);

    // Clean up presence if user was in a session
    if (socket.familyId && socket.sessionId && socket.userId) {
      cleanupDisconnectedUser(io, socket.familyId, socket.sessionId, socket.userId);
    }

    // Clean up rate limit data
    userRateLimits.delete(userId);
  });
}

// Helper function to check rate limits for chat
function checkRateLimits(
  userId: string,
  type: 'reaction' | 'chat',
  maxPerMinute: number
): boolean {
  const now = Date.now();
  const limits = userRateLimits.get(userId) || { reaction: [], chat: [] };
  
  const timestamps = type === 'reaction' ? limits.reaction : limits.chat;
  
  // Remove expired timestamps (older than 1 minute)
  const recentTimestamps = timestamps.filter(t => now - t < 60000);
  
  if (recentTimestamps.length >= maxPerMinute) {
    return false;
  }

  // Add new timestamp
  recentTimestamps.push(now);
  
  if (type === 'reaction') {
    userRateLimits.set(userId, { ...limits, reaction: recentTimestamps });
  } else {
    userRateLimits.set(userId, { ...limits, chat: recentTimestamps });
  }
  
  return true;
}
