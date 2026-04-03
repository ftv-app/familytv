// Socket.IO types for Watch Party
import type { Socket, Server } from 'socket.io';
import type { Redis } from '@upstash/redis';

// ---- Event Payloads ----

export interface PresenceJoinPayload {
  familyId: string;
  sessionId: string; // TV playback session ID
  userName: string;
}

export interface PresenceLeavePayload {
  familyId: string;
  sessionId: string;
}

export interface ReactionAddPayload {
  familyId: string;
  sessionId: string;
  emoji: string; // 👍 ❤️ 😂 😢 🔥 🎉
  timestamp: number;
}

export interface ChatSendPayload {
  familyId: string;
  sessionId: string;
  message: string;
  timestamp: number;
}

// ---- Event Responses ----

export interface PresenceUpdate {
  userId: string;
  userName: string;
  sessionId: string;
  joinedAt: number;
  action: 'join' | 'leave';
}

export interface ReactionUpdate {
  userId: string;
  userName: string;
  emoji: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

// ---- Auth ----

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  familyId?: string;
  sessionId?: string;
  token?: string;
}

// ---- Room Keys ----

/**
 * Get the Socket.IO room key for a family watch party session
 * Format: watchparty:{familyId}:{sessionId}
 */
export function getWatchPartyRoomKey(familyId: string, sessionId: string): string {
  return `watchparty:${familyId}:${sessionId}`;
}

/**
 * Get the Redis key for tracking active users in a watch party session
 * Format: wp:presence:{familyId}:{sessionId}
 */
export function getPresenceRedisKey(familyId: string, sessionId: string): string {
  return `wp:presence:${familyId}:${sessionId}`;
}

// ---- Socket.IO Server Instance (singleton) ----

export interface SocketServerState {
  io: Server | null;
  redisClient: Redis | null;
  isInitialized: boolean;
}

export const socketServerState: SocketServerState = {
  io: null,
  redisClient: null,
  isInitialized: false,
};

// ---- Rate Limiting ----

export const RATE_LIMITS = {
  reaction: { maxPerMinute: 30 },
  chat: { maxPerMinute: 20, maxLength: 500 },
} as const;

// Valid emoji reactions
export const VALID_EMOJIS = ['🎬', '😂', '❤️', '🔥', '😮', '💯'] as const;
export type ValidEmoji = typeof VALID_EMOJIS[number];
