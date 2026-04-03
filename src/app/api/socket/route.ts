/**
 * Socket.IO API Route
 * 
 * This route handles Socket.IO WebSocket connections.
 * 
 * NOTE: Next.js App Router doesn't natively support WebSocket upgrades.
 * For production, use one of these approaches:
 * 
 * 1. CUSTOM SERVER (recommended for self-hosted):
 *    Create a standalone server that runs Socket.IO alongside Next.js
 *    See: server/socket.ts
 * 
 * 2. SEPARATE WEBSOCKET SERVICE:
 *    Run Socket.IO on a dedicated port (e.g., 3001) alongside Next.js
 *    See: scripts/start-socket-server.ts
 * 
 * 3. THIRD-PARTY REAL-TIME:
 *    Use Pusher, Ably, or similar for production Vercel deployments
 * 
 * This route exists as a placeholder and health check endpoint.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'watch-party-socket',
    message: 'Socket.IO server runs on a separate port. See server/socket.ts for standalone server.',
    documentation: {
      standalone: 'npx tsx server/socket.ts',
      development: 'npm run dev:socket',
      production: 'Run as a separate Node.js service',
    },
  });
}

// Disable body parsing for WebSocket upgrade handling in custom server
export const dynamic = 'force-dynamic';
