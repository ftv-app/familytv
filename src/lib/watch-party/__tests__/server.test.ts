/**
 * Watch Party Server Tests
 * CTM-229: Socket.IO server initialization, Redis adapter, middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mocks - must be at top level (hoisted by Vitest)
// =============================================================================

const mockPubClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
};

const mockSubClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
};

const mockAdapter = {};

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: vi.fn(() => mockAdapter),
}));

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockPubClient),
}));

// Mock security module with proper async handling
vi.mock('../security', () => ({
  verifyClerkToken: vi.fn().mockResolvedValue({
    userId: 'user-123',
    familyId: 'family-456',
    displayName: 'Test User',
    avatarUrl: null,
  }),
  extractAuthFromHandshake: vi.fn((handshake: any) => {
    if (handshake?.auth?.token === 'invalid-token') {
      return undefined;
    }
    return handshake?.headers?.authorization || handshake?.auth?.token || null;
  }),
}));

// Mock presence handlers
vi.mock('../socket-handlers', () => ({
  registerPresenceHandlers: vi.fn(),
}));

// Mock chat handlers
vi.mock('../chat-handler', () => ({
  registerChatHandlers: vi.fn(),
}));

// Mock reaction handlers
vi.mock('../reaction-handler', () => ({
  registerReactionHandlers: vi.fn(),
}));

// =============================================================================
// Test Imports
// =============================================================================

import { createWatchPartyServer, attachSocketServer } from '../server';

// =============================================================================
// Test Setup
// =============================================================================

describe('Watch Party Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Redis mock clients
    mockPubClient.connect.mockResolvedValue(undefined);
    mockPubClient.disconnect.mockResolvedValue(undefined);
    mockSubClient.connect.mockResolvedValue(undefined);
    mockSubClient.disconnect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =============================================================================
  // Server Creation Tests
  // =============================================================================

  describe('createWatchPartyServer', () => {
    it('should create server without httpServer (API route mode)', async () => {
      const io = await createWatchPartyServer();
      expect(io).toBeDefined();
      expect(typeof io.on).toBe('function');
    });

    it('should create server with custom cors origin', async () => {
      const io = await createWatchPartyServer(undefined, {
        corsOrigin: 'https://familytv.app',
      });
      expect(io).toBeDefined();
    });

    it('should create server with custom options', async () => {
      const io = await createWatchPartyServer(undefined, {
        corsOrigin: 'https://example.com',
        standalone: true,
      });
      expect(io).toBeDefined();
    });

    it('should register presence handlers', async () => {
      const { registerPresenceHandlers } = await import('../socket-handlers');
      await createWatchPartyServer();
      expect(registerPresenceHandlers).toHaveBeenCalled();
    });

    it('should register chat handlers', async () => {
      const { registerChatHandlers } = await import('../chat-handler');
      await createWatchPartyServer();
      expect(registerChatHandlers).toHaveBeenCalled();
    });

    it('should register reaction handlers', async () => {
      const { registerReactionHandlers } = await import('../reaction-handler');
      await createWatchPartyServer();
      expect(registerReactionHandlers).toHaveBeenCalled();
    });

    it('should set up connection handler', async () => {
      const io = await createWatchPartyServer();
      expect(typeof io.on).toBe('function');
    });
  });

  // =============================================================================
  // Redis Adapter Tests
  // =============================================================================

  describe('Redis adapter setup', () => {
    it('should set up Redis adapter when redisUrl option is provided', async () => {
      const { createClient } = await import('redis');
      const { createAdapter } = await import('@socket.io/redis-adapter');
      
      const testPubClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      };
      const testSubClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      };
      
      (createClient as any).mockReturnValueOnce(testPubClient).mockReturnValueOnce(testSubClient);
      
      const io = await createWatchPartyServer(undefined, {
        redisUrl: 'redis://localhost:6379',
      });
      
      expect(testPubClient.connect).toHaveBeenCalled();
      expect(testSubClient.connect).toHaveBeenCalled();
      expect(createAdapter).toHaveBeenCalledWith(testPubClient, testSubClient);
    });

    it('should handle Redis connection failure gracefully', async () => {
      const { createClient } = await import('redis');
      
      const failingClient = {
        connect: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        disconnect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      };
      
      (createClient as any).mockReturnValue(failingClient);
      
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const io = await createWatchPartyServer(undefined, {
        redisUrl: 'redis://localhost:6379',
      });
      
      expect(io).toBeDefined();
      
      warnSpy.mockRestore();
    });

    it('should log warning when REDIS_URL is not set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await createWatchPartyServer();
      
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('REDIS_URL not set'));
      
      warnSpy.mockRestore();
    });

    it('should use process.env.REDIS_URL when available', async () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      const { createClient } = await import('redis');
      const testPubClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      };
      const testSubClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      };
      (createClient as any).mockReturnValueOnce(testPubClient).mockReturnValueOnce(testSubClient);
      
      await createWatchPartyServer();
      
      expect(testPubClient.connect).toHaveBeenCalled();
      
      process.env.REDIS_URL = originalRedisUrl;
    });
  });

  // =============================================================================
  // Authentication Middleware Tests
  // =============================================================================

  describe('Authentication middleware', () => {
    it('should have use method available on io', async () => {
      const io = await createWatchPartyServer();
      expect(typeof io.use).toBe('function');
    });
  });

  // =============================================================================
  // attachSocketServer Tests
  // =============================================================================

  describe('attachSocketServer', () => {
    it('should exist and be callable', () => {
      expect(() => attachSocketServer({} as any)).not.toThrow();
    });
  });
});

// =============================================================================
// Server Options Tests
// =============================================================================

describe('Server Options', () => {
  it('should accept custom SOCKET_CORS_ORIGIN from options', async () => {
    const io = await createWatchPartyServer(undefined, {
      corsOrigin: 'https://custom-origin.com',
    });
    expect(io).toBeDefined();
  });

  it('should accept redisUrl option', async () => {
    const io = await createWatchPartyServer(undefined, {
      redisUrl: 'redis://localhost:6379',
    });
    expect(io).toBeDefined();
  });

  it('should accept standalone option', async () => {
    const io = await createWatchPartyServer(undefined, {
      standalone: true,
    });
    expect(io).toBeDefined();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Server Integration', () => {
  it('should create multiple servers in sequence', async () => {
    // Import fresh to avoid singleton issues
    const { createWatchPartyServer: create1, resetSocketServer: reset1 } = await import('../server');
    const { createWatchPartyServer: create2, resetSocketServer: reset2 } = await import('../server');
    
    const io1 = await create1();
    reset1();
    const io2 = await create2();
    reset2();
    
    expect(io1).not.toBe(io2);
  });

  it('should handle rapid server creation', async () => {
    const { createWatchPartyServer: create1 } = await import('../server');
    const { createWatchPartyServer: create2 } = await import('../server');
    
    const servers = await Promise.all([
      create1(),
      create2(),
    ]);
    
    expect(servers[0]).toBeDefined();
    expect(servers[1]).toBeDefined();
  });
});
