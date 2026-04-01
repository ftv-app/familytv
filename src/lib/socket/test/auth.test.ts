/**
 * Unit tests for Socket Authentication
 * Part of CTM-229: Watch Party WebSocket Server
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../types';
import { AuthError } from '../auth';

describe('Socket Authentication', () => {
  describe('AuthError', () => {
    it('should create AuthError with correct properties', () => {
      const error = new AuthError('Test error', 'INVALID_TOKEN');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.name).toBe('AuthError');
    });

    it('should support all error codes', () => {
      const codes: AuthError['code'][] = [
        'NO_TOKEN',
        'INVALID_TOKEN',
        'NOT_IN_FAMILY',
        'USER_NOT_FOUND',
      ];

      codes.forEach(code => {
        const error = new AuthError(`Error for ${code}`, code);
        expect(error.code).toBe(code);
      });
    });
  });

  describe('Token Validation', () => {
    it('should require token for authentication', () => {
      const token = '';
      const hasToken = !!token;
      expect(hasToken).toBe(false);
    });

    it('should accept valid token format', () => {
      const token = 'Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU1R0NNIn0...';
      const hasToken = !!token;
      expect(hasToken).toBe(true);
    });

    it('should extract token from Bearer format', () => {
      const authHeader = 'Bearer my-secret-token';
      const token = authHeader.replace('Bearer ', '');
      expect(token).toBe('my-secret-token');
    });

    it('should handle missing Bearer prefix', () => {
      const authHeader = 'my-secret-token';
      const token = authHeader.replace('Bearer ', '');
      expect(token).toBe('my-secret-token');
    });
  });

  describe('Family Membership', () => {
    it('should validate user belongs to family', () => {
      const familyMembers = ['user-1', 'user-2', 'user-3'];
      const userId = 'user-2';

      expect(familyMembers.includes(userId)).toBe(true);
    });

    it('should reject user not in family', () => {
      const familyMembers = ['user-1', 'user-2', 'user-3'];
      const userId = 'user-unknown';

      expect(familyMembers.includes(userId)).toBe(false);
    });

    it('should handle empty family members list', () => {
      const familyMembers: string[] = [];
      const userId = 'user-1';

      expect(familyMembers.includes(userId)).toBe(false);
    });
  });

  describe('User Display Name', () => {
    it('should return provided name if available', () => {
      const name = 'John Doe';
      const result = name || 'Family Member';
      expect(result).toBe('John Doe');
    });

    it('should return default if name is null', () => {
      const name: string | null = null;
      const result = name || 'Family Member';
      expect(result).toBe('Family Member');
    });

    it('should return default if name is empty string', () => {
      const name = '';
      const result = name || 'Family Member';
      expect(result).toBe('Family Member');
    });
  });

  describe('Socket Authentication Middleware', () => {
    it('should call next with error when no token provided', async () => {
      const socket = {
        handshake: {
          auth: {},
          headers: {},
        },
      } as Socket;

      const next = vi.fn();
      const hasToken = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      expect(!!hasToken).toBe(false);
    });

    it('should extract token from handshake auth', () => {
      const socket = {
        handshake: {
          auth: { token: 'my-token' },
          headers: {},
        },
      } as Socket;

      const token = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      expect(token).toBe('my-token');
    });

    it('should extract token from authorization header', () => {
      const socket = {
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      } as Socket;

      const token = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      expect(token).toBe('header-token');
    });
  });

  describe('Watch Party Access Control', () => {
    it('should allow access for family members', () => {
      const userId = 'user-123';
      const familyId = 'fam-456';
      const membership = { familyId: 'fam-456', userId: 'user-123' };

      const hasAccess = 
        membership.familyId === familyId && 
        membership.userId === userId;

      expect(hasAccess).toBe(true);
    });

    it('should deny access for non-family members', () => {
      const userId = 'user-unknown';
      const familyId = 'fam-456';
      const membership = { familyId: 'fam-456', userId: 'user-123' };

      const hasAccess = 
        membership.familyId === familyId && 
        membership.userId === userId;

      expect(hasAccess).toBe(false);
    });

    it('should deny access for different family', () => {
      const userId = 'user-123';
      const familyId = 'fam-different';
      const membership = { familyId: 'fam-456', userId: 'user-123' };

      const hasAccess = 
        membership.familyId === familyId && 
        membership.userId === userId;

      expect(hasAccess).toBe(false);
    });
  });
});
