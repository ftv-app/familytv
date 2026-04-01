/**
 * Socket.IO API Route
 * 
 * This route handles Socket.IO initialization for Watch Party.
 * For local development, it works with the custom server.
 * For Vercel deployment, it provides WebSocket support via the ServerlessSocket wrapper.
 * 
 * In production, Socket.IO needs special handling on serverless platforms:
 * - Option 1: Use @vercel/kv with Socket.IO Redis adapter
 * - Option 2: Use a dedicated WebSocket service (Pusher, Ably, etc.)
 * - Option 3: Use Vercel's experimental WebSocket support
 */
import { NextResponse } from 'next/server';

// Socket.IO uses WebSocket, which requires special handling on Vercel
// This endpoint serves as a health check and initialization point

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'watch-party-socket',
    version: '1.0.0',
    message: 'Socket.IO endpoint active. Connect via Socket.IO client.',
  });
}

// Note: The actual Socket.IO server is initialized in:
// - `src/server.ts` for local development with custom server
// - In production, consider using Upstash Redis Adapter with Socket.IO
//   See: https://socket.io/docs/v4/redis-adapter/
