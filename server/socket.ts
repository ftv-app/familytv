/**
 * Watch Party Socket.IO Standalone Server
 * 
 * This script runs Socket.IO as a standalone server alongside Next.js.
 * Use this for development or self-hosted production deployments.
 * 
 * Usage:
 *   npx tsx server/socket.ts
 * 
 * Environment variables required:
 *   DATABASE_URL - Neon Postgres connection string
 *   REDIS_URL - Redis connection string (optional, for horizontal scaling)
 *   CLERK_SECRET_KEY - Clerk secret key for JWT verification
 *   SOCKET_PORT - Port for Socket.IO server (default: 3001)
 *   SOCKET_CORS_ORIGIN - CORS origin (default: http://localhost:3000)
 */

import { createServer } from 'http';
import { createWatchPartyServer } from '../src/lib/watch-party/server';

const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000';

async function main() {
  console.log('===========================================');
  console.log('  FamilyTV Watch Party Socket.IO Server');
  console.log('===========================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  CORS Origin: ${CORS_ORIGIN}`);
  console.log(`  Redis: ${process.env.REDIS_URL ? 'enabled' : 'disabled (single instance)'}`);
  console.log('===========================================');

  // Create HTTP server
  const httpServer = createServer();

  // Create and attach Socket.IO server
  const io = await createWatchPartyServer(httpServer, {
    corsOrigin: CORS_ORIGIN,
    redisUrl: process.env.REDIS_URL,
    standalone: true,
  });

  // Start listening
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Socket.IO server running on port ${PORT}`);
    console.log(`   Connect at: http://localhost:${PORT}`);
    console.log(`\n   Health check: http://localhost:${PORT}/api/socket\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n[Server] Received SIGTERM, shutting down gracefully...');
    io.disconnectSockets();
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n[Server] Received SIGINT, shutting down gracefully...');
    io.disconnectSockets();
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('[Server] Fatal error:', error);
  process.exit(1);
});
