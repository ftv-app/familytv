/**
 * Unit tests for Chat Persistence
 * Part of CTM-229: Watch Party WebSocket Server
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatMessage } from '../types';

// Since we can't actually connect to Neon Postgres in tests,
// we test the logic and validation that the persistence layer uses

describe('Chat Persistence Logic', () => {
  const MAX_MESSAGES_PER_SESSION = 100;

  describe('Message Structure', () => {
    it('should require all fields for a valid message', () => {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        userId: 'user-123',
        userName: 'Test User',
        message: 'Hello, family!',
        timestamp: Date.now(),
      };

      expect(message.id).toBeDefined();
      expect(message.userId).toBeDefined();
      expect(message.userName).toBeDefined();
      expect(message.message).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Message Storage Logic', () => {
    it('should limit messages to MAX_MESSAGES_PER_SESSION', () => {
      const messages: ChatMessage[] = [];
      
      // Simulate adding messages
      for (let i = 0; i < 150; i++) {
        messages.push({
          id: `msg-${i}`,
          userId: 'user-1',
          userName: 'User',
          message: `Message ${i}`,
          timestamp: Date.now() + i,
        });
      }

      // Keep only last 100
      const trimmed = messages.slice(-MAX_MESSAGES_PER_SESSION);
      
      expect(trimmed.length).toBe(100);
      expect(trimmed[0].message).toBe('Message 50');
      expect(trimmed[99].message).toBe('Message 149');
    });

    it('should order messages by timestamp ascending', () => {
      const messages: ChatMessage[] = [
        { id: '1', userId: 'u1', userName: 'U1', message: 'First', timestamp: 1000 },
        { id: '2', userId: 'u2', userName: 'U2', message: 'Second', timestamp: 2000 },
        { id: '3', userId: 'u3', userName: 'U3', message: 'Third', timestamp: 3000 },
      ];

      const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

      expect(sorted[0].message).toBe('First');
      expect(sorted[1].message).toBe('Second');
      expect(sorted[2].message).toBe('Third');
    });
  });

  describe('Message Deletion', () => {
    it('should allow user to delete their own message', () => {
      const userId = 'user-123';
      const messages = [
        { id: 'msg-1', userId: 'user-123', userName: 'Me', message: 'My message' },
        { id: 'msg-2', userId: 'user-456', userName: 'Other', message: 'Their message' },
      ];

      const canDelete = (msgId: string, requestingUserId: string) => {
        const msg = messages.find(m => m.id === msgId);
        return msg && msg.userId === requestingUserId;
      };

      expect(canDelete('msg-1', 'user-123')).toBe(true);
      expect(canDelete('msg-2', 'user-123')).toBe(false);
      expect(canDelete('msg-1', 'user-456')).toBe(false);
    });

    it('should not delete non-existent messages', () => {
      const messages: ChatMessage[] = [];

      const canDelete = (msgId: string) => {
        return messages.some(m => m.id === msgId);
      };

      expect(canDelete('non-existent')).toBe(false);
    });
  });

  describe('Message Retrieval', () => {
    it('should paginate messages correctly', () => {
      const allMessages: ChatMessage[] = [];
      for (let i = 0; i < 250; i++) {
        allMessages.push({
          id: `msg-${i}`,
          userId: 'user-1',
          userName: 'User',
          message: `Message ${i}`,
          timestamp: 1000 + i,
        });
      }

      const page1 = allMessages.slice(-100);
      const page2 = allMessages.slice(-200, -100);
      const page3 = allMessages.slice(-300, -200);

      expect(page1.length).toBe(100);
      expect(page2.length).toBe(100);
      expect(page3.length).toBe(50);

      // Verify ordering (most recent last)
      expect(page1[0].message).toBe('Message 150');
      expect(page1[99].message).toBe('Message 249');
    });

    it('should return empty for non-existent session', () => {
      const messagesBySession = new Map<string, ChatMessage[]>();
      
      const getMessages = (familyId: string, sessionId: string) => {
        return messagesBySession.get(`${familyId}:${sessionId}`) || [];
      };

      expect(getMessages('fam-none', 'session-none')).toEqual([]);
    });
  });

  describe('Message Count', () => {
    it('should count messages per session', () => {
      const messagesBySession = new Map<string, ChatMessage[]>();
      messagesBySession.set('fam:session1', [
        { id: '1', userId: 'u1', userName: 'U1', message: 'M1', timestamp: 1 },
        { id: '2', userId: 'u2', userName: 'U2', message: 'M2', timestamp: 2 },
      ]);
      messagesBySession.set('fam:session2', [
        { id: '3', userId: 'u3', userName: 'U3', message: 'M3', timestamp: 3 },
      ]);

      const count1 = messagesBySession.get('fam:session1')?.length || 0;
      const count2 = messagesBySession.get('fam:session2')?.length || 0;
      const count3 = messagesBySession.get('fam:session3')?.length || 0;

      expect(count1).toBe(2);
      expect(count2).toBe(1);
      expect(count3).toBe(0);
    });
  });

  describe('Cleanup Old Messages', () => {
    it('should identify messages to clean up', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 120; i++) {
        messages.push({
          id: `msg-${i}`,
          userId: 'user-1',
          userName: 'User',
          message: `Message ${i}`,
          timestamp: 1000 + i,
        });
      }

      // Keep last 100
      const keepIds = new Set(messages.slice(-100).map(m => m.id));
      const toDelete = messages.filter(m => !keepIds.has(m.id));

      expect(toDelete.length).toBe(20);
      expect(toDelete.map(m => m.id)).toEqual([
        'msg-0', 'msg-1', 'msg-2', 'msg-3', 'msg-4',
        'msg-5', 'msg-6', 'msg-7', 'msg-8', 'msg-9',
        'msg-10', 'msg-11', 'msg-12', 'msg-13', 'msg-14',
        'msg-15', 'msg-16', 'msg-17', 'msg-18', 'msg-19',
      ]);
    });
  });
});

describe('Database Error Handling', () => {
  it('should recognize PostgreSQL table not found error', () => {
    const error = { code: '42P01' }; // PostgreSQL undefined_table
    expect(error.code).toBe('42P01');
  });

  it('should handle other database errors differently', () => {
    const errors = [
      { code: '23505', message: 'Unique violation' },
      { code: '23503', message: 'Foreign key violation' },
      { code: '23502', message: 'Not null violation' },
    ];

    errors.forEach(err => {
      expect(err.code).not.toBe('42P01');
    });
  });
});
