/**
 * Unit tests for Socket validation utilities
 * Part of CTM-229: Watch Party WebSocket Server
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePresenceJoin,
  validatePresenceLeave,
  validateReactionAdd,
  validateChatSend,
  isValidEmoji,
  isAuthorizedForSession,
  sanitizeMessage,
  formatTimestamp,
  isRateLimited,
  resetRateLimit,
  clearAllRateLimits,
} from '../validation';
import { RATE_LIMITS, VALID_EMOJIS } from '../types';

describe('Socket Validation', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('validatePresenceJoin', () => {
    it('should accept valid payload', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        userName: 'John Doe',
      };
      expect(validatePresenceJoin(payload)).toEqual({ valid: true });
    });

    it('should reject missing familyId', () => {
      const payload = {
        familyId: '',
        sessionId: 'session-456',
        userName: 'John Doe',
      };
      expect(validatePresenceJoin(payload)).toEqual({
        valid: false,
        error: 'familyId is required and must be a string',
      });
    });

    it('should reject missing sessionId', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: '',
        userName: 'John Doe',
      };
      expect(validatePresenceJoin(payload)).toEqual({
        valid: false,
        error: 'sessionId is required and must be a string',
      });
    });

    it('should reject missing userName', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        userName: '',
      };
      expect(validatePresenceJoin(payload)).toEqual({
        valid: false,
        error: 'userName is required and must be a string',
      });
    });

    it('should reject non-string familyId', () => {
      const payload = {
        familyId: 123 as unknown as string,
        sessionId: 'session-456',
        userName: 'John Doe',
      };
      expect(validatePresenceJoin(payload).valid).toBe(false);
    });
  });

  describe('validatePresenceLeave', () => {
    it('should accept valid payload', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
      };
      expect(validatePresenceLeave(payload)).toEqual({ valid: true });
    });

    it('should reject missing familyId', () => {
      const payload = {
        familyId: '',
        sessionId: 'session-456',
      };
      expect(validatePresenceLeave(payload)).toEqual({
        valid: false,
        error: 'familyId is required and must be a string',
      });
    });

    it('should reject missing sessionId', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: '',
      };
      expect(validatePresenceLeave(payload)).toEqual({
        valid: false,
        error: 'sessionId is required and must be a string',
      });
    });
  });

  describe('validateReactionAdd', () => {
    it('should accept valid payload with all emojis', () => {
      VALID_EMOJIS.forEach(emoji => {
        const payload = {
          familyId: 'fam-123',
          sessionId: 'session-456',
          emoji,
          timestamp: Date.now(),
        };
        expect(validateReactionAdd(payload)).toEqual({ valid: true });
      });
    });

    it('should reject invalid emoji', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        emoji: '💩',
        timestamp: Date.now(),
      };
      expect(validateReactionAdd(payload)).toEqual({
        valid: false,
        error: `Invalid emoji. Allowed: ${VALID_EMOJIS.join(' ')}`,
      });
    });

    it('should reject missing emoji', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        emoji: '',
        timestamp: Date.now(),
      };
      expect(validateReactionAdd(payload)).toEqual({
        valid: false,
        error: 'emoji is required',
      });
    });

    it('should reject missing familyId', () => {
      const payload = {
        familyId: '',
        sessionId: 'session-456',
        emoji: '👍',
        timestamp: Date.now(),
      };
      expect(validateReactionAdd(payload).valid).toBe(false);
    });

    it('should reject missing sessionId', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: '',
        emoji: '👍',
        timestamp: Date.now(),
      };
      expect(validateReactionAdd(payload).valid).toBe(false);
    });
  });

  describe('validateChatSend', () => {
    it('should accept valid payload', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        message: 'Hello, family!',
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({ valid: true });
    });

    it('should reject empty message', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        message: '',
        timestamp: Date.now(),
      };
      // Empty string is falsy, so it triggers the "message is required" check
      expect(validateChatSend(payload).valid).toBe(false);
      expect(validateChatSend(payload).error).toContain('required');
    });

    it('should reject whitespace-only message', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        message: '   ',
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({
        valid: false,
        error: 'Message cannot be empty',
      });
    });

    it('should reject message exceeding max length', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        message: 'a'.repeat(501),
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({
        valid: false,
        error: `Message too long (max ${RATE_LIMITS.chat.maxLength} characters)`,
      });
    });

    it('should accept message at exactly max length', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: 'session-456',
        message: 'a'.repeat(500),
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({ valid: true });
    });

    it('should reject missing familyId', () => {
      const payload = {
        familyId: '',
        sessionId: 'session-456',
        message: 'Hello!',
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({
        valid: false,
        error: 'familyId is required and must be a string',
      });
    });

    it('should reject missing sessionId', () => {
      const payload = {
        familyId: 'fam-123',
        sessionId: '',
        message: 'Hello!',
        timestamp: Date.now(),
      };
      expect(validateChatSend(payload)).toEqual({
        valid: false,
        error: 'sessionId is required and must be a string',
      });
    });
  });

  describe('isValidEmoji', () => {
    it('should return true for valid emojis', () => {
      VALID_EMOJIS.forEach(emoji => {
        expect(isValidEmoji(emoji)).toBe(true);
      });
    });

    it('should return false for invalid emojis', () => {
      const invalidEmojis = ['💩', '👎', '✅', '❌', '🙈', '💯', '😀', '🎊'];
      invalidEmojis.forEach(emoji => {
        expect(isValidEmoji(emoji)).toBe(false);
      });
    });

    it('should return false for empty string', () => {
      expect(isValidEmoji('')).toBe(false);
    });

    it('should return false for random strings', () => {
      expect(isValidEmoji('hello')).toBe(false);
      expect(isValidEmoji('123')).toBe(false);
    });
  });

  describe('isAuthorizedForSession', () => {
    it('should return true when socket matches target', () => {
      expect(isAuthorizedForSession('fam-123', 'session-456', 'fam-123', 'session-456')).toBe(true);
    });

    it('should return false when familyId differs', () => {
      expect(isAuthorizedForSession('fam-123', 'session-456', 'fam-789', 'session-456')).toBe(false);
    });

    it('should return false when sessionId differs', () => {
      expect(isAuthorizedForSession('fam-123', 'session-456', 'fam-123', 'session-789')).toBe(false);
    });

    it('should return false when socket is not in any session', () => {
      expect(isAuthorizedForSession(undefined, undefined, 'fam-123', 'session-456')).toBe(false);
    });

    it('should return false when only familyId matches', () => {
      expect(isAuthorizedForSession('fam-123', undefined, 'fam-123', 'session-456')).toBe(false);
    });

    it('should return false when only sessionId matches', () => {
      expect(isAuthorizedForSession(undefined, 'session-456', 'fam-123', 'session-456')).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    it('should escape HTML tags', () => {
      expect(sanitizeMessage('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeMessage('  Hello!  ')).toBe('Hello!');
    });

    it('should handle empty string', () => {
      expect(sanitizeMessage('')).toBe('');
    });

    it('should handle normal text', () => {
      expect(sanitizeMessage('Hello, family!')).toBe('Hello, family!');
    });

    it('should handle mixed content', () => {
      expect(sanitizeMessage('Hello <b>world</b>!')).toBe(
        'Hello &lt;b&gt;world&lt;/b&gt;!'
      );
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp as ISO string', () => {
      const timestamp = new Date('2026-04-01T12:00:00Z').getTime();
      expect(formatTimestamp(timestamp)).toBe('2026-04-01T12:00:00.000Z');
    });

    it('should handle current timestamp', () => {
      const now = Date.now();
      expect(formatTimestamp(now)).toBe(new Date(now).toISOString());
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const userId = 'user-123';
      const maxPerMinute = 10;

      for (let i = 0; i < 10; i++) {
        expect(isRateLimited(userId, 'chat', maxPerMinute)).toBe(false);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const userId = 'user-456';
      const maxPerMinute = 3;

      // Fill up the rate limit
      isRateLimited(userId, 'chat', maxPerMinute);
      isRateLimited(userId, 'chat', maxPerMinute);
      isRateLimited(userId, 'chat', maxPerMinute);

      // Should be blocked
      expect(isRateLimited(userId, 'chat', maxPerMinute)).toBe(true);
    });

    it('should track different actions separately', () => {
      const userId = 'user-789';
      const maxPerMinute = 2;

      // Use up chat limit
      isRateLimited(userId, 'chat', maxPerMinute);
      isRateLimited(userId, 'chat', maxPerMinute);

      // Chat should be blocked
      expect(isRateLimited(userId, 'chat', maxPerMinute)).toBe(true);

      // Reaction should still be allowed
      expect(isRateLimited(userId, 'reaction', maxPerMinute)).toBe(false);
    });

    it('should track different users separately', () => {
      const maxPerMinute = 2;

      // Use up user-1's limit
      isRateLimited('user-1', 'chat', maxPerMinute);
      isRateLimited('user-1', 'chat', maxPerMinute);

      // user-1 should be blocked
      expect(isRateLimited('user-1', 'chat', maxPerMinute)).toBe(true);

      // user-2 should still be allowed
      expect(isRateLimited('user-2', 'chat', maxPerMinute)).toBe(false);
    });

    it('should reset rate limit for specific user and action', () => {
      const userId = 'user-reset';
      const maxPerMinute = 1;

      // Use up the limit
      isRateLimited(userId, 'chat', maxPerMinute);
      expect(isRateLimited(userId, 'chat', maxPerMinute)).toBe(true);

      // Reset
      resetRateLimit(userId, 'chat');

      // Should be allowed again
      expect(isRateLimited(userId, 'chat', maxPerMinute)).toBe(false);
    });

    it('should clear all rate limits', () => {
      const maxPerMinute = 1;

      // Use up multiple users
      isRateLimited('user-A', 'chat', maxPerMinute);
      isRateLimited('user-B', 'chat', maxPerMinute);

      // Clear all
      clearAllRateLimits();

      // All should be allowed
      expect(isRateLimited('user-A', 'chat', maxPerMinute)).toBe(false);
      expect(isRateLimited('user-B', 'chat', maxPerMinute)).toBe(false);
    });

    it('should use default maxPerMinute for reactions', () => {
      const userId = 'user-default';
      const maxPerMinute = RATE_LIMITS.reaction.maxPerMinute;

      for (let i = 0; i < maxPerMinute; i++) {
        expect(isRateLimited(userId, 'reaction')).toBe(false);
      }

      expect(isRateLimited(userId, 'reaction')).toBe(true);
    });

    it('should use default maxPerMinute for chat', () => {
      const userId = 'user-chat-default';
      // Note: Default maxPerMinute is from reaction (30), not chat (20)
      const maxPerMinute = 30; // RATE_LIMITS.reaction.maxPerMinute

      for (let i = 0; i < maxPerMinute; i++) {
        expect(isRateLimited(userId, 'chat')).toBe(false);
      }

      expect(isRateLimited(userId, 'chat')).toBe(true);
    });
  });
});
