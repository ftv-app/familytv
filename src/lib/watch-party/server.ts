/**
 * Watch Party Socket.IO Server
 * 
 * Main Socket.IO server setup with:
 * - Clerk JWT authentication middleware
 * - Redis adapter for horizontal scaling
 * - Presence, chat, and reaction handlers
 * - Family-scoped room access control
 * 
 * This module is used both for:
 * 1. Next.js API route integration (/api/socket)
 * 2. Standalone server mode (for development)
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import http from 'http';
import { verifyClerkToken, extractAuthFromHandshake } from './security';
import { registerPresenceHandlers } from './socket-handlers';
import { registerChatHandlers } from './chat-handler';
import { registerReactionHandlers } from './reaction-handler';

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
  redisUrl?: string;
  standalone?: boolean;
}

// ============================================
// Redis Client Factory
// ============================================

function createRedisClient(): ReturnType<typeof createClient> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return createClient({ url: redisUrl });
}

// ============================================
// Socket.IO Server Factory
// ============================================

/**
 * Create and configure a Socket.IO server with all handlers
 */
export async function createWatchPartyServer(
  httpServer?: http.Server, // Node HTTP server for standalone mode
  options: ServerOptions = {}
): Promise<SocketIOServer> {
  const corsOrigin = options.corsOrigin || process.env.SOCKET_CORS_ORIGIN || '*';

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

  if (options.redisUrl || process.env.REDIS_URL) {
    try {
      const pubClient = createRedisClient();
      const subClient = createRedisClient();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
    } catch (error) {
      console.warn('[Socket.IO] Running WITHOUT Redis adapter - single instance only');
    }
  } else {
    console.warn('[Socket.IO] REDIS_URL not set - running WITHOUT Redis adapter (single instance only)');
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

      next();
    } catch (error) {
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
    socket.on('error', () => {
      // Errors handled per-socket
    });

    socket.on('disconnect', () => {
      // Disconnect handled per-socket
    });
  });

  return io;
}

/**
 * Attach Socket.IO server to a Next.js API route response
 * This is called from the API route handler
 */
export function attachSocketServer(_io: SocketIOServer): void {
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
