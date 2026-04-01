/**
 * Socket.IO Server Setup for Watch Party
 * Supports both standalone Node.js server and Vercel serverless
 */
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Redis } from '@upstash/redis';
import type { AuthenticatedSocket } from './types';
import { socketServerState } from './types';
import { socketAuthMiddleware } from './auth';
import { registerWatchPartyHandlers } from './handlers';

// ---- Environment Variables ----
// UPSTASH_REDIS_REST_URL - Upstash Redis REST URL
// UPSTASH_REDIS_REST_TOKEN - Upstash Redis REST Token
// Or use REDIS_URL / REDIS_PASSWORD for standard Redis

let redisClient: Redis | null = null;

/**
 * Get or create Upstash Redis client
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD;

  if (!url || !token) {
    console.warn('Redis not configured. Running without Redis adapter (single-instance mode).');
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Initialize the Socket.IO server
 * Call this once at application startup
 */
export async function initializeSocketServer(
  httpServer?: HttpServer,
  options: {
    cors?: {
      origin: string | string[];
      methods: string[];
      credentials: boolean;
    };
    path?: string;
  } = {}
): Promise<SocketIOServer> {
  // If already initialized, return existing server
  if (socketServerState.io && socketServerState.isInitialized) {
    return socketServerState.io;
  }

  const redis = getRedisClient();
  socketServerState.redisClient = redis;

  // Determine CORS origin
  const corsOrigin = options.cors?.origin || process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || '*';

  const io = new SocketIOServer(httpServer, {
    path: options.path || '/api/socketio',
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Support both for Vercel compatibility
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply Redis adapter if Redis is available
  if (redis) {
    try {
      // Dynamic import for Redis adapter (only loads when Redis is available)
      const { createAdapter } = await import('@socket.io/redis-adapter');
      
      const pubClient = redis; // Upstash Redis is compatible with the Redis adapter
      const subClient = redis.duplicate();
      
      // Note: Upstash Redis may not support pub/sub in the same way
      // For production with multiple instances, consider using Redis Streams
      // or a dedicated pub/sub broker
      io.adapter(createAdapter(pubClient as never, subClient as never));
      
      console.log('Socket.IO Redis adapter enabled');
    } catch (error) {
      console.warn('Failed to enable Redis adapter:', error);
    }
  } else {
    console.log('Socket.IO running without Redis adapter (single-instance mode)');
  }

  // ---- Authentication Middleware ----
  io.use(async (socket: Socket, next) => {
    try {
      await socketAuthMiddleware(socket as AuthenticatedSocket, next);
    } catch (error) {
      next(error as Error);
    }
  });

  // ---- Connection Handler ----
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`Socket connected: ${authSocket.userId}`);

    // Register event handlers
    registerWatchPartyHandlers(io, authSocket);

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${authSocket.userId}:`, error);
    });
  });

  // ---- Health Check ----
  io.on('health', () => {
    console.log('Socket.IO server health check passed');
  });

  socketServerState.io = io;
  socketServerState.isInitialized = true;

  return io;
}

/**
 * Get the current Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return socketServerState.io;
}

/**
 * Check if Socket.IO server is initialized
 */
export function isSocketServerInitialized(): boolean {
  return socketServerState.isInitialized;
}

/**
 * Shutdown the Socket.IO server
 */
export async function shutdownSocketServer(): Promise<void> {
  if (socketServerState.io) {
    await new Promise<void>((resolve) => {
      socketServerState.io!.close(() => {
        console.log('Socket.IO server closed');
        resolve();
      });
    });
    
    socketServerState.io = null;
    socketServerState.redisClient = null;
    socketServerState.isInitialized = false;
  }
}

/**
 * Emit an event to a specific watch party room
 * Utility function for other parts of the app to communicate with watch party
 */
export function emitToWatchParty(
  familyId: string,
  sessionId: string,
  event: string,
  data: unknown
): boolean {
  const io = socketServerState.io;
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit event');
    return false;
  }

  const roomKey = `watchparty:${familyId}:${sessionId}`;
  io.to(roomKey).emit(event, data);
  return true;
}

/**
 * Broadcast to all watch party rooms in a family
 */
export function emitToFamilyWatchParties(
  familyId: string,
  event: string,
  data: unknown
): boolean {
  const io = socketServerState.io;
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit event');
    return false;
  }

  // Match all rooms for this family
  const roomPattern = new RegExp(`^watchparty:${familyId}:.*$`);
  
  // Socket.IO doesn't support pattern matching natively,
  // so we need to iterate through the adapter's rooms
  const rooms = io.sockets.adapter.rooms;
  
  if (rooms) {
    for (const [roomName] of rooms) {
      if (roomPattern.test(roomName)) {
        io.to(roomName).emit(event, data);
      }
    }
  }

  return true;
}
