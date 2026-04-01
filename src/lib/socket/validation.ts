/**
 * Validation utilities for Socket.IO event handlers
 * These pure functions can be unit tested independently
 */
import type {
  PresenceJoinPayload,
  PresenceLeavePayload,
  ReactionAddPayload,
  ChatSendPayload,
  ValidEmoji,
} from './types';
import { RATE_LIMITS, VALID_EMOJIS } from './types';

// ---- Rate Limiting ----

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean expired timestamps from rate limit entry
 */
export function cleanExpiredTimestamps(entry: RateLimitEntry): number[] {
  const now = Date.now();
  return entry.timestamps.filter(t => now - t < 60000);
}

/**
 * Check if a user is rate limited for a specific action
 */
export function isRateLimited(
  userId: string,
  action: 'reaction' | 'chat',
  maxPerMinute: number = RATE_LIMITS.reaction.maxPerMinute
): boolean {
  const key = `${userId}:${action}`;
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  entry.timestamps = cleanExpiredTimestamps(entry);

  if (entry.timestamps.length >= maxPerMinute) {
    return true;
  }

  entry.timestamps.push(Date.now());
  return false;
}

/**
 * Reset rate limit for a user (for testing)
 */
export function resetRateLimit(userId: string, action: 'reaction' | 'chat'): void {
  const key = `${userId}:${action}`;
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

// ---- Payload Validation ----

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate presence.join payload
 */
export function validatePresenceJoin(
  payload: PresenceJoinPayload
): ValidationResult {
  if (!payload.familyId || typeof payload.familyId !== 'string') {
    return { valid: false, error: 'familyId is required and must be a string' };
  }
  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required and must be a string' };
  }
  if (!payload.userName || typeof payload.userName !== 'string') {
    return { valid: false, error: 'userName is required and must be a string' };
  }
  return { valid: true };
}

/**
 * Validate presence.leave payload
 */
export function validatePresenceLeave(
  payload: PresenceLeavePayload
): ValidationResult {
  if (!payload.familyId || typeof payload.familyId !== 'string') {
    return { valid: false, error: 'familyId is required and must be a string' };
  }
  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required and must be a string' };
  }
  return { valid: true };
}

/**
 * Validate reaction.add payload
 */
export function validateReactionAdd(
  payload: ReactionAddPayload
): ValidationResult {
  if (!payload.familyId || typeof payload.familyId !== 'string') {
    return { valid: false, error: 'familyId is required and must be a string' };
  }
  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required and must be a string' };
  }
  if (!payload.emoji) {
    return { valid: false, error: 'emoji is required' };
  }
  if (!isValidEmoji(payload.emoji)) {
    return { valid: false, error: `Invalid emoji. Allowed: ${VALID_EMOJIS.join(' ')}` };
  }
  return { valid: true };
}

/**
 * Validate chat.send payload
 */
export function validateChatSend(
  payload: ChatSendPayload
): ValidationResult {
  if (!payload.familyId || typeof payload.familyId !== 'string') {
    return { valid: false, error: 'familyId is required and must be a string' };
  }
  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required and must be a string' };
  }
  if (!payload.message || typeof payload.message !== 'string') {
    return { valid: false, error: 'message is required and must be a string' };
  }
  if (payload.message.length > RATE_LIMITS.chat.maxLength) {
    return { valid: false, error: `Message too long (max ${RATE_LIMITS.chat.maxLength} characters)` };
  }
  if (payload.message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  return { valid: true };
}

/**
 * Check if emoji is valid
 */
export function isValidEmoji(emoji: string): emoji is ValidEmoji {
  return VALID_EMOJIS.includes(emoji as ValidEmoji);
}

// ---- Session Access Control ----

/**
 * Check if socket is authorized for a specific session
 */
export function isAuthorizedForSession(
  socketFamilyId: string | undefined,
  socketSessionId: string | undefined,
  targetFamilyId: string,
  targetSessionId: string
): boolean {
  return socketFamilyId === targetFamilyId && socketSessionId === targetSessionId;
}

// ---- Message Formatting ----

/**
 * Sanitize message content (basic XSS prevention)
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
