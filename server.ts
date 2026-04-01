/**
 * Custom Server for FamilyTV with Socket.IO
 * 
 * This server adds Socket.IO WebSocket support to Next.js for local development.
 * 
 * Usage:
 *   npx tsx server.ts
 *   or
 *   npm run dev (with custom server configuration)
 * 
 * For production on Vercel, Socket.IO is handled via the Redis adapter
 * and a separate WebSocket-compatible deployment or Vercel's native WebSocket support.
 */
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Lazy-load socket server initialization
  const { initializeSocketServer } = require('./src/lib/socket/server');
  initializeSocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server initialized`);
  });
});
