/**
 * Watch Party Room Management
 * Manages Socket.IO rooms for family watch party sessions
 */
import type { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket, PresenceUpdate } from './types';
import { getWatchPartyRoomKey } from './types';
import { verifyWatchPartyAccess } from './auth';

// In-memory presence tracking (Redis-backed in production)
// Exported for testing - use clearPresenceStore() in tests
export const presenceStore = new Map<string, Map<string, PresenceUpdate>>();

/**
 * Clear all presence data (for testing)
 */
export function clearPresenceStore(): void {
  presenceStore.clear();
}

/**
 * Get or create presence map for a session
 */
function getSessionPresence(familyId: string, sessionId: string): Map<string, PresenceUpdate> {
  const key = getWatchPartyRoomKey(familyId, sessionId);
  if (!presenceStore.has(key)) {
    presenceStore.set(key, new Map());
  }
  return presenceStore.get(key)!;
}

/**
 * Add a user to a watch party session
 */
export function addUserToSession(
  familyId: string,
  sessionId: string,
  userId: string,
  userName: string
): PresenceUpdate {
  const presence = getSessionPresence(familyId, sessionId);
  
  const update: PresenceUpdate = {
    userId,
    userName,
    sessionId,
    joinedAt: Date.now(),
    action: 'join',
  };
  
  presence.set(userId, update);
  return update;
}

/**
 * Remove a user from a watch party session
 */
export function removeUserFromSession(
  familyId: string,
  sessionId: string,
  userId: string
): PresenceUpdate | null {
  const presence = getSessionPresence(familyId, sessionId);
  const existing = presence.get(userId);
  
  if (existing) {
    presence.delete(userId);
    return {
      ...existing,
      action: 'leave',
    };
  }
  
  return null;
}

/**
 * Get all users in a watch party session
 */
export function getSessionUsers(
  familyId: string,
  sessionId: string
): PresenceUpdate[] {
  const presence = getSessionPresence(familyId, sessionId);
  return Array.from(presence.values());
}

/**
 * Get user count in a watch party session
 */
export function getSessionUserCount(familyId: string, sessionId: string): number {
  const presence = getSessionPresence(familyId, sessionId);
  return presence.size;
}

/**
 * Check if a user is in a specific session
 */
export function isUserInSession(
  familyId: string,
  sessionId: string,
  userId: string
): boolean {
  const presence = getSessionPresence(familyId, sessionId);
  return presence.has(userId);
}

/**
 * Join a user to a watch party room
 * Returns true if join was successful, false if not authorized
 */
export async function joinWatchPartyRoom(
  io: Server,
  socket: AuthenticatedSocket,
  familyId: string,
  sessionId: string
): Promise<boolean> {
  if (!socket.userId) {
    return false;
  }

  // Verify user is a member of this family
  const { allowed, userName } = await verifyWatchPartyAccess(
    socket.userId,
    familyId,
    socket.token || ''
  );

  if (!allowed) {
    return false;
  }

  // Get the room key
  const roomKey = getWatchPartyRoomKey(familyId, sessionId);

  // Join the Socket.IO room
  await socket.join(roomKey);

  // Attach family/session info to socket
  socket.familyId = familyId;
  socket.sessionId = sessionId;
  socket.userName = userName;

  // Track presence
  const presenceUpdate = addUserToSession(familyId, sessionId, socket.userId, userName);

  // Notify other users in the room of new presence
  socket.to(roomKey).emit('presence.update', presenceUpdate);

  // Send current presence list to the joining user
  const currentUsers = getSessionUsers(familyId, sessionId);
  socket.emit('presence.list', currentUsers);

  return true;
}

/**
 * Leave a watch party room
 */
export function leaveWatchPartyRoom(
  io: Server,
  socket: AuthenticatedSocket,
  familyId?: string,
  sessionId?: string
): void {
  const fId = familyId || socket.familyId;
  const sId = sessionId || socket.sessionId;

  if (!fId || !sId || !socket.userId) return;

  const roomKey = getWatchPartyRoomKey(fId, sId);

  // Leave the Socket.IO room
  socket.leave(roomKey);

  // Remove from presence tracking
  const presenceUpdate = removeUserFromSession(fId, sId, socket.userId);

  // Notify remaining users
  if (presenceUpdate) {
    socket.to(roomKey).emit('presence.update', presenceUpdate);
  }

  // Clear socket family/session info
  socket.familyId = undefined;
  socket.sessionId = undefined;
}

/**
 * Get all active watch party sessions for a family
 */
export function getFamilyActiveSessions(familyId: string): string[] {
  const sessions: string[] = [];
  
  for (const [key] of presenceStore) {
    if (key.startsWith(`watchparty:${familyId}:`)) {
      const parts = key.split(':');
      if (parts.length >= 3) {
        sessions.push(parts[2]);
      }
    }
  }
  
  return sessions;
}

/**
 * Get all families with active watch party sessions
 */
export function getActiveFamilies(): string[] {
  const families = new Set<string>();
  
  for (const [key] of presenceStore) {
    const parts = key.split(':');
    if (parts.length >= 2) {
      families.add(parts[1]);
    }
  }
  
  return Array.from(families);
}

/**
 * Clean up presence data for disconnected sockets
 * Called when a socket disconnects
 */
export function cleanupDisconnectedUser(
  io: Server,
  familyId: string,
  sessionId: string,
  userId: string
): void {
  const roomKey = getWatchPartyRoomKey(familyId, sessionId);
  const presenceUpdate = removeUserFromSession(familyId, sessionId, userId);

  if (presenceUpdate) {
    io.to(roomKey).emit('presence.update', presenceUpdate);
  }
}

/**
 * Get presence update when a user leaves (for broadcasting)
 * This is a pure function that can be unit tested
 */
export function getLeavePresenceUpdate(
  familyId: string,
  sessionId: string,
  userId: string,
  userName: string
): { userId: string; userName: string; sessionId: string; joinedAt: number; action: 'leave' } {
  return {
    userId,
    userName,
    sessionId,
    joinedAt: Date.now(),
    action: 'leave',
  };
}

/**
 * Get presence update when a user joins (for broadcasting)
 * This is a pure function that can be unit tested
 */
export function getJoinPresenceUpdate(
  familyId: string,
  sessionId: string,
  userId: string,
  userName: string
): { userId: string; userName: string; sessionId: string; joinedAt: number; action: 'join' } {
  return {
    userId,
    userName,
    sessionId,
    joinedAt: Date.now(),
    action: 'join',
  };
}

/**
 * Extract session ID from room key
 */
export function extractSessionIdFromRoomKey(roomKey: string): string | null {
  const parts = roomKey.split(':');
  if (parts.length >= 3) {
    return parts[2];
  }
  return null;
}

/**
 * Extract family ID from room key
 */
export function extractFamilyIdFromRoomKey(roomKey: string): string | null {
  const parts = roomKey.split(':');
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
}

/**
 * Check if room key is valid format
 */
export function isValidRoomKey(roomKey: string): boolean {
  return roomKey.startsWith('watchparty:') && roomKey.split(':').length >= 3;
}
