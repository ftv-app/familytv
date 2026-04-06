/**
 * Watch Party Socket.IO Server
 *
 * Main Socket.IO server setup with:
 * - Clerk JWT authentication middleware
 * - Presence, chat, and reaction handlers
 * - Family-scoped room access control
 * - Optional Redis adapter for horizontal scaling
 *
 * This module is used both for:
 * 1. Next.js API route integration (/api/socket)
 * 2. Standalone server mode (for development)
 *
 * NOTE: Redis adapter is NOT enabled in the MVP build by default.
 * For horizontal scaling with multiple instances:
 *   1. Set NEXT_PUBLIC_USE_REDIS_ADAPTER=true in environment
 *   2. Configure REDIS_URL / REDIS_PASSWORD or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *   3. Use a proper Redis instance (not Upstash REST API which doesn't support pub/sub)
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from '@upstash/redis';
import http from 'http';
import { verifyClerkToken, extractAuthFromHandshake } from './security';
import { registerPresenceHandlers } from './socket-handlers';
import { registerChatHandlers } from './chat-handler';
import { registerReactionHandlers } from './reaction-handler';
import { getRedisPresenceManager } from './redis-presence';

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

export interface ServerOptions {
  corsOrigin?: string;
  standalone?: boolean;
  enableRedisAdapter?: boolean;
}

// ============================================
// Redis Client Factory
// ============================================

/**
 * Get or create Redis client for Socket.IO adapter
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD;

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error('[Socket.IO] Failed to create Redis client:', error);
    return null;
  }
}

// ============================================
// Socket.IO Server Factory
// ============================================

/**
 * Create and configure a Socket.IO server with all handlers
 */
export async function createWatchPartyServer(
  _httpServer?: http.Server, // Node HTTP server for standalone mode
  options: ServerOptions = {}
): Promise<SocketIOServer> {
  const corsOrigin = options.corsOrigin || process.env.SOCKET_CORS_ORIGIN || '*';
  const enableRedisAdapter = options.enableRedisAdapter ?? !!process.env.NEXT_PUBLIC_USE_REDIS_ADAPTER;

  const io = new SocketIOServer({
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // WebSocket with HTTP long-poll fallback
    pingTimeout: 20000,      // 20s ping timeout
    pingInterval: 25000,      // 25s ping interval
    connectTimeout: 10000,   // 10s connection timeout
  });

  // =========================================
  // Redis Adapter Setup (for horizontal scaling)
  // =========================================

  if (enableRedisAdapter) {
    const redis = createRedisClient();
    if (redis) {
      try {
        // Create pub/sub clients for Socket.IO Redis adapter
        // The adapter needs two separate Redis connections:
        // one for publishing events, one for subscribing to rooms
        const pubClient = redis;
        
        // For subClient, we need a separate Redis connection
        // This is required because Redis pub/sub works on dedicated connections
        const subClient = createRedisClient();
        
        if (subClient) {
          await io.adapter(createAdapter(pubClient as any, subClient as any));
          console.log('[Socket.IO] Redis adapter enabled for horizontal scaling');
          
          // Initialize Redis presence manager for presence tracking
          getRedisPresenceManager(redis);
        } else {
          console.warn('[Socket.IO] Could not create subClient for Redis adapter. Running without Redis adapter.');
        }
      } catch (error) {
        console.error('[Socket.IO] Failed to initialize Redis adapter:', error);
        console.warn('[Socket.IO] Falling back to in-memory mode');
      }
    } else {
      console.warn('[Socket.IO] Redis not configured. Running without Redis adapter (single-instance mode).');
    }
  } else {
    console.log('[Socket.IO] Running without Redis adapter (single-instance mode). Set NEXT_PUBLIC_USE_REDIS_ADAPTER=true to enable.');
  }

  // =========================================
  // Authentication Middleware
  // =========================================

  io.use(async (socket, next) => {
    try {
      const authHeader = extractAuthFromHandshake(socket.handshake);

      if (!authHeader) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyClerkToken(authHeader);

      // Attach user data to socket
      socket.userId = user.userId;
      socket.familyId = user.familyId;
      socket.displayName = user.displayName;
      socket.avatarUrl = user.avatarUrl;

      console.log(`[Auth] User ${user.userId} authenticated for socket ${socket.id}`);
      next();
    } catch (error) {
      console.error('[Auth] Authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  // =========================================
  // Register Event Handlers
  // =========================================

  registerPresenceHandlers(io);
  registerChatHandlers(io);
  registerReactionHandlers(io);

  // =========================================
  // Global Error Handler
  // =========================================

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}, user: ${socket.userId}`);

    socket.on('error', (error) => {
      console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

/**
 * Attach Socket.IO server to a Next.js API route response
 * This is called from the API route handler
 */
export function attachSocketServer(io: SocketIOServer): void {
  // Socket.IO manages its own connection lifecycle
  // This function exists for potential future extension
}

/**
 * Get Socket.IO server instance (singleton for the process)
 */
let _io: SocketIOServer | null = null;

export async function getSocketServer(): Promise<SocketIOServer> {
  if (!_io) {
    _io = await createWatchPartyServer();
  }
  return _io;
}

export function resetSocketServer(): void {
  if (_io) {
    _io.disconnectSockets();
    _io.close();
    _io = null;
  }
}
