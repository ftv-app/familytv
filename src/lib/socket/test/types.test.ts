/**
 * Unit tests for Socket types and utilities
 * Part of CTM-229: Watch Party WebSocket Server
 */
import { describe, it, expect } from 'vitest';
import {
  getWatchPartyRoomKey,
  getPresenceRedisKey,
  RATE_LIMITS,
  VALID_EMOJIS,
  type ChatMessage,
  type PresenceUpdate,
  type ReactionUpdate,
} from '../types';

describe('Socket Types', () => {
  describe('getWatchPartyRoomKey', () => {
    it('should generate correct room key format', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const key = getWatchPartyRoomKey(familyId, sessionId);
      expect(key).toBe('watchparty:fam-123:session-456');
    });

    it('should handle UUID format family IDs', () => {
      const familyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const sessionId = 'tv-001';
      const key = getWatchPartyRoomKey(familyId, sessionId);
      expect(key).toBe(`watchparty:${familyId}:tv-001`);
    });

    it('should handle special characters in session IDs', () => {
      const familyId = 'fam-123';
      const sessionId = 'session_with-special.chars';
      const key = getWatchPartyRoomKey(familyId, sessionId);
      expect(key).toBe('watchparty:fam-123:session_with-special.chars');
    });
  });

  describe('getPresenceRedisKey', () => {
    it('should generate correct Redis key format', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const key = getPresenceRedisKey(familyId, sessionId);
      expect(key).toBe('wp:presence:fam-123:session-456');
    });

    it('should be distinct from room key', () => {
      const familyId = 'fam-123';
      const sessionId = 'session-456';
      const roomKey = getWatchPartyRoomKey(familyId, sessionId);
      const presenceKey = getPresenceRedisKey(familyId, sessionId);
      expect(roomKey).not.toBe(presenceKey);
      expect(roomKey).toContain('watchparty');
      expect(presenceKey).toContain('wp:presence');
    });
  });

  describe('RATE_LIMITS', () => {
    it('should have reaction rate limit defined', () => {
      expect(RATE_LIMITS.reaction).toBeDefined();
      expect(RATE_LIMITS.reaction.maxPerMinute).toBe(30);
    });

    it('should have chat rate limit defined', () => {
      expect(RATE_LIMITS.chat).toBeDefined();
      expect(RATE_LIMITS.chat.maxPerMinute).toBe(20);
      expect(RATE_LIMITS.chat.maxLength).toBe(500);
    });
  });

  describe('VALID_EMOJIS', () => {
    it('should contain all allowed reaction emojis', () => {
      const expectedEmojis = ['👍', '❤️', '😂', '😢', '🔥', '🎉'];
      expect(VALID_EMOJIS).toEqual(expectedEmojis);
    });

    it('should have exactly 6 valid emojis', () => {
      expect(VALID_EMOJIS.length).toBe(6);
    });

    it('should not contain invalid emojis', () => {
      expect((VALID_EMOJIS as readonly string[]).includes('💩')).toBe(false);
      expect((VALID_EMOJIS as readonly string[]).includes('👎')).toBe(false);
    });
  });

  describe('TypeScript interfaces', () => {
    it('should accept valid ChatMessage structure', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        userId: 'user-456',
        userName: 'Test User',
        message: 'Hello, family!',
        timestamp: Date.now(),
      };
      expect(message.id).toBe('msg-123');
      expect(message.message).toBe('Hello, family!');
    });

    it('should accept valid PresenceUpdate structure', () => {
      const presence: PresenceUpdate = {
        userId: 'user-456',
        userName: 'Test User',
        sessionId: 'session-789',
        joinedAt: Date.now(),
        action: 'join',
      };
      expect(presence.action).toBe('join');
    });

    it('should accept valid ReactionUpdate structure', () => {
      const reaction: ReactionUpdate = {
        userId: 'user-456',
        userName: 'Test User',
        emoji: '👍',
        timestamp: Date.now(),
      };
      expect(reaction.emoji).toBe('👍');
    });
  });
});
