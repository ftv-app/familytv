import { describe, it, expect } from 'vitest';
import {
  validateTimeRange,
  validateActivityTypes,
  validateMemberIds,
  validateLimit,
  isValidCursor,
  parseTimeRange,
  parseActivityTypes,
  parseMemberIds,
  parseLimit,
  parseCursor,
  getTimeRangeStart,
  shouldIncludePosts,
  shouldIncludeComments,
  shouldIncludeReactions,
  shouldIncludeEvents,
  filterByMembers,
  sortActivitiesByDate,
  applyPagination,
  ActivityItem,
  ActivityType,
} from './activity-filter';

describe('activity-filter', () => {
  describe('validateTimeRange', () => {
    it('returns valid for null', () => {
      const result = validateTimeRange(null);
      expect(result.valid).toBe(true);
    });

    it('returns valid for 24h', () => {
      const result = validateTimeRange('24h');
      expect(result.valid).toBe(true);
    });

    it('returns valid for 7d', () => {
      const result = validateTimeRange('7d');
      expect(result.valid).toBe(true);
    });

    it('returns valid for all', () => {
      const result = validateTimeRange('all');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for unknown value', () => {
      const result = validateTimeRange('30d');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateActivityTypes', () => {
    it('returns valid for null', () => {
      const result = validateActivityTypes(null);
      expect(result.valid).toBe(true);
    });

    it('returns valid for single type', () => {
      const result = validateActivityTypes('post');
      expect(result.valid).toBe(true);
    });

    it('returns valid for multiple types', () => {
      const result = validateActivityTypes('post,comment,reaction');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for unknown type', () => {
      const result = validateActivityTypes('post,unknown');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for empty string', () => {
      const result = validateActivityTypes('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMemberIds', () => {
    it('returns valid for null', () => {
      const result = validateMemberIds(null);
      expect(result.valid).toBe(true);
    });

    it('returns valid for single ID', () => {
      const result = validateMemberIds('user1');
      expect(result.valid).toBe(true);
    });

    it('returns valid for multiple IDs', () => {
      const result = validateMemberIds('user1,user2,user3');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for empty string in list', () => {
      const result = validateMemberIds('user1,,user3');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateLimit', () => {
    it('returns valid for null', () => {
      const result = validateLimit(null);
      expect(result.valid).toBe(true);
    });

    it('returns valid for 20', () => {
      const result = validateLimit('20');
      expect(result.valid).toBe(true);
    });

    it('returns valid for 1', () => {
      const result = validateLimit('1');
      expect(result.valid).toBe(true);
    });

    it('returns valid for 50', () => {
      const result = validateLimit('50');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for 0', () => {
      const result = validateLimit('0');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for 51', () => {
      const result = validateLimit('51');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for non-numeric', () => {
      const result = validateLimit('abc');
      expect(result.valid).toBe(false);
    });
  });

  describe('isValidCursor', () => {
    it('returns true for null', () => {
      expect(isValidCursor(null)).toBe(true);
    });

    it('returns true for valid ISO date', () => {
      expect(isValidCursor('2026-04-01T12:00:00Z')).toBe(true);
    });

    it('returns false for invalid date', () => {
      expect(isValidCursor('not-a-date')).toBe(false);
    });
  });

  describe('parseTimeRange', () => {
    it('returns all for null', () => {
      expect(parseTimeRange(null)).toBe('all');
    });

    it('returns correct value for valid input', () => {
      expect(parseTimeRange('24h')).toBe('24h');
      expect(parseTimeRange('7d')).toBe('7d');
      expect(parseTimeRange('all')).toBe('all');
    });

    it('returns all for invalid input', () => {
      expect(parseTimeRange('invalid')).toBe('all');
    });
  });

  describe('parseActivityTypes', () => {
    it('returns null for null', () => {
      expect(parseActivityTypes(null)).toBeNull();
    });

    it('parses single type', () => {
      expect(parseActivityTypes('post')).toEqual(['post']);
    });

    it('parses multiple types', () => {
      expect(parseActivityTypes('post,comment,reaction')).toEqual([
        'post',
        'comment',
        'reaction',
      ]);
    });

    it('trims whitespace', () => {
      expect(parseActivityTypes(' post , comment ')).toEqual([
        'post',
        'comment',
      ]);
    });
  });

  describe('parseMemberIds', () => {
    it('returns null for null', () => {
      expect(parseMemberIds(null)).toBeNull();
    });

    it('parses single ID', () => {
      expect(parseMemberIds('user1')).toEqual(['user1']);
    });

    it('parses multiple IDs', () => {
      expect(parseMemberIds('user1,user2,user3')).toEqual([
        'user1',
        'user2',
        'user3',
      ]);
    });

    it('filters empty strings', () => {
      expect(parseMemberIds('user1,,user3')).toEqual(['user1', 'user3']);
    });

    it('trims whitespace', () => {
      expect(parseMemberIds(' user1 , user2 ')).toEqual(['user1', 'user2']);
    });
  });

  describe('parseLimit', () => {
    it('returns default for null', () => {
      expect(parseLimit(null)).toBe(20);
    });

    it('parses valid limit', () => {
      expect(parseLimit('30')).toBe(30);
    });

    it('returns default for invalid values', () => {
      expect(parseLimit('abc')).toBe(20);
      expect(parseLimit('0')).toBe(20);
      expect(parseLimit('51')).toBe(20);
    });
  });

  describe('parseCursor', () => {
    it('returns null for null', () => {
      expect(parseCursor(null)).toBeNull();
    });

    it('parses valid ISO date', () => {
      const result = parseCursor('2026-04-01T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2026-04-01T12:00:00.000Z');
    });

    it('returns null for invalid date', () => {
      expect(parseCursor('not-a-date')).toBeNull();
    });
  });

  describe('getTimeRangeStart', () => {
    it('returns null for all', () => {
      expect(getTimeRangeStart('all')).toBeNull();
    });

    it('returns date for 24h', () => {
      const result = getTimeRangeStart('24h');
      expect(result).toBeInstanceOf(Date);
      const now = new Date();
      const diff = now.getTime() - result!.getTime();
      // Should be approximately 24 hours (within 1 second tolerance)
      expect(diff).toBeGreaterThan(24 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000 + 1000);
    });

    it('returns date for 7d', () => {
      const result = getTimeRangeStart('7d');
      expect(result).toBeInstanceOf(Date);
      const now = new Date();
      const diff = now.getTime() - result!.getTime();
      // Should be approximately 7 days (within 1 second tolerance)
      expect(diff).toBeGreaterThan(7 * 24 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(7 * 24 * 60 * 60 * 1000 + 1000);
    });
  });

  describe('shouldIncludePosts', () => {
    it('returns true for null (all types)', () => {
      expect(shouldIncludePosts(null)).toBe(true);
    });

    it('returns true when included', () => {
      expect(shouldIncludePosts(['post', 'comment'])).toBe(true);
    });

    it('returns false when not included', () => {
      expect(shouldIncludePosts(['comment', 'reaction'])).toBe(false);
    });
  });

  describe('shouldIncludeComments', () => {
    it('returns true for null (all types)', () => {
      expect(shouldIncludeComments(null)).toBe(true);
    });

    it('returns true when included', () => {
      expect(shouldIncludeComments(['post', 'comment'])).toBe(true);
    });

    it('returns false when not included', () => {
      expect(shouldIncludeComments(['post', 'reaction'])).toBe(false);
    });
  });

  describe('shouldIncludeReactions', () => {
    it('returns true for null (all types)', () => {
      expect(shouldIncludeReactions(null)).toBe(true);
    });

    it('returns true when included', () => {
      expect(shouldIncludeReactions(['reaction', 'event'])).toBe(true);
    });

    it('returns false when not included', () => {
      expect(shouldIncludeReactions(['post', 'comment'])).toBe(false);
    });
  });

  describe('shouldIncludeEvents', () => {
    it('returns true for null (all types)', () => {
      expect(shouldIncludeEvents(null)).toBe(true);
    });

    it('returns true when included', () => {
      expect(shouldIncludeEvents(['event', 'post'])).toBe(true);
    });

    it('returns false when not included', () => {
      expect(shouldIncludeEvents(['post', 'comment'])).toBe(false);
    });
  });

  describe('filterByMembers', () => {
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'post',
        actor: { id: 'user1', name: 'Mom', avatar: null },
        content: {},
        createdAt: '2026-04-01T10:00:00Z',
      },
      {
        id: '2',
        type: 'comment',
        actor: { id: 'user2', name: 'Dad', avatar: null },
        content: {},
        createdAt: '2026-04-01T11:00:00Z',
      },
      {
        id: '3',
        type: 'reaction',
        actor: { id: 'user1', name: 'Mom', avatar: null },
        content: {},
        createdAt: '2026-04-01T12:00:00Z',
      },
    ];

    it('returns all activities for null filter', () => {
      const result = filterByMembers(activities, null);
      expect(result.length).toBe(3);
    });

    it('returns all activities for empty array filter', () => {
      const result = filterByMembers(activities, []);
      expect(result.length).toBe(3);
    });

    it('filters by single member ID', () => {
      const result = filterByMembers(activities, ['user1']);
      expect(result.length).toBe(2);
      expect(result.every((a) => a.actor.id === 'user1')).toBe(true);
    });

    it('filters by multiple member IDs', () => {
      const result = filterByMembers(activities, ['user2']);
      expect(result.length).toBe(1);
      expect(result[0].actor.id).toBe('user2');
    });

    it('returns empty array when no matches', () => {
      const result = filterByMembers(activities, ['nonexistent']);
      expect(result.length).toBe(0);
    });
  });

  describe('sortActivitiesByDate', () => {
    it('sorts by createdAt descending', () => {
      const activities: ActivityItem[] = [
        {
          id: '1',
          type: 'post',
          actor: { id: 'user1', name: 'Mom', avatar: null },
          content: {},
          createdAt: '2026-04-01T10:00:00Z',
        },
        {
          id: '2',
          type: 'comment',
          actor: { id: 'user2', name: 'Dad', avatar: null },
          content: {},
          createdAt: '2026-04-01T12:00:00Z',
        },
        {
          id: '3',
          type: 'reaction',
          actor: { id: 'user1', name: 'Mom', avatar: null },
          content: {},
          createdAt: '2026-04-01T11:00:00Z',
        },
      ];

      const result = sortActivitiesByDate(activities);

      expect(result[0].id).toBe('2'); // 12:00
      expect(result[1].id).toBe('3'); // 11:00
      expect(result[2].id).toBe('1'); // 10:00
    });

    it('does not mutate original array', () => {
      const activities: ActivityItem[] = [
        {
          id: '1',
          type: 'post',
          actor: { id: 'user1', name: 'Mom', avatar: null },
          content: {},
          createdAt: '2026-04-01T10:00:00Z',
        },
      ];

      const originalFirstId = activities[0].id;
      sortActivitiesByDate(activities);
      expect(activities[0].id).toBe(originalFirstId);
    });
  });

  describe('applyPagination', () => {
    const createActivity = (id: string, minutesAgo: number): ActivityItem => ({
      id,
      type: 'post' as const,
      actor: { id: 'user1', name: 'Mom', avatar: null },
      content: {},
      createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    });

    it('applies limit correctly', () => {
      const activities = [
        createActivity('1', 60),
        createActivity('2', 50),
        createActivity('3', 40),
        createActivity('4', 30),
        createActivity('5', 20),
      ];

      const result = applyPagination(activities, 3);

      expect(result.items.length).toBe(3);
      expect(result.nextCursor).toBeDefined();
    });

    it('returns null cursor when no more items', () => {
      const activities = [
        createActivity('1', 60),
        createActivity('2', 50),
      ];

      const result = applyPagination(activities, 10);

      expect(result.items.length).toBe(2);
      expect(result.nextCursor).toBeNull();
    });

    it('sets cursor to last item date', () => {
      const activities = [
        createActivity('1', 60),
        createActivity('2', 50),
        createActivity('3', 40),
      ];

      const result = applyPagination(activities, 2);

      expect(result.items.length).toBe(2);
      expect(result.nextCursor).toBe(activities[1].createdAt); // Second item is last returned
    });

    it('sorts by date before applying limit', () => {
      const activities = [
        createActivity('1', 60), // Oldest
        createActivity('2', 30), // Newest
        createActivity('3', 45), // Middle
      ];

      const result = applyPagination(activities, 2);

      // Should be sorted newest first, then limited to 2
      expect(result.items[0].id).toBe('2'); // Newest
      expect(result.items[1].id).toBe('3'); // Middle
    });

    it('returns empty items and null cursor for empty array', () => {
      const result = applyPagination([], 10);

      expect(result.items.length).toBe(0);
      expect(result.nextCursor).toBeNull();
    });
  });
});
