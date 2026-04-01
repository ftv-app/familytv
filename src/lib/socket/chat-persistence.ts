/**
 * Watch Party Chat Persistence
 * Neon Postgres integration for storing last 100 chat messages per session
 */
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import type { ChatMessage } from './types';

// ---- Database Schema ----
// Note: The watch_party_messages table should be created via drizzle
// or a manual migration. Schema:
// CREATE TABLE watch_party_messages (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   family_id UUID NOT NULL,
//   session_id TEXT NOT NULL,
//   user_id TEXT NOT NULL,
//   user_name TEXT NOT NULL,
//   message TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT NOW()
// );
// CREATE INDEX idx_watch_party_session ON watch_party_messages(family_id, session_id, created_at DESC);
// CREATE INDEX idx_watch_party_lookup ON watch_party_messages(family_id, session_id);

const MAX_MESSAGES_PER_SESSION = 100;

/**
 * Save a chat message to Neon Postgres
 */
export async function saveChatMessage(
  familyId: string,
  sessionId: string,
  userId: string,
  userName: string,
  message: string
): Promise<ChatMessage> {
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  try {
    await db.execute(sql`
      INSERT INTO watch_party_messages (id, family_id, session_id, user_id, user_name, message, created_at)
      VALUES (
        ${id}::uuid,
        ${familyId}::uuid,
        ${sessionId},
        ${userId},
        ${userName},
        ${message},
        NOW()
      )
    `);

    // Cleanup old messages beyond MAX_MESSAGES_PER_SESSION
    await cleanupOldMessages(familyId, sessionId);

    return {
      id,
      userId,
      userName,
      message,
      timestamp,
    };
  } catch (error) {
    // If table doesn't exist, log but don't crash
    // In production, ensure the table is created via migration
    if ((error as { code?: string }).code === '42P01') {
      console.warn('watch_party_messages table not found. Run migration to enable chat persistence.');
      // Return in-memory message if table doesn't exist
      return {
        id,
        userId,
        userName,
        message,
        timestamp,
      };
    }
    throw error;
  }
}

/**
 * Get recent chat messages for a session (last 100)
 */
export async function getRecentMessages(
  familyId: string,
  sessionId: string,
  limit: number = MAX_MESSAGES_PER_SESSION
): Promise<ChatMessage[]> {
  try {
    const messages = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        user_name as "userName",
        message,
        EXTRACT(EPOCH FROM created_at)::int * 1000 as timestamp
      FROM watch_party_messages
      WHERE family_id = ${familyId}::uuid AND session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return (messages as unknown as ChatMessage[]).reverse();
  } catch (error) {
    // If table doesn't exist, return empty array
    if ((error as { code?: string }).code === '42P01') {
      console.warn('watch_party_messages table not found. Chat history unavailable.');
      return [];
    }
    throw error;
  }
}

/**
 * Get a single message by ID
 */
export async function getMessageById(
  familyId: string,
  messageId: string
): Promise<ChatMessage | null> {
  try {
    const messages = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        user_name as "userName",
        message,
        EXTRACT(EPOCH FROM created_at)::int * 1000 as timestamp
      FROM watch_party_messages
      WHERE id = ${messageId}::uuid AND family_id = ${familyId}::uuid
    `);

    if ((messages as unknown[]).length === 0) {
      return null;
    }

    return (messages as unknown as ChatMessage[])[0];
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a message (soft delete - user can only delete their own messages)
 */
export async function deleteMessage(
  familyId: string,
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      DELETE FROM watch_party_messages
      WHERE id = ${messageId}::uuid 
        AND family_id = ${familyId}::uuid 
        AND user_id = ${userId}
      RETURNING id
    `);

    return (result as unknown[]).length > 0;
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') {
      return false;
    }
    throw error;
  }
}

/**
 * Cleanup old messages beyond the limit
 * Called after each new message to maintain the 100 message cap
 */
async function cleanupOldMessages(
  familyId: string,
  sessionId: string
): Promise<void> {
  try {
    // Delete messages beyond the limit
    await db.execute(sql`
      DELETE FROM watch_party_messages wpm
      WHERE wpm.family_id = ${familyId}::uuid
        AND wpm.session_id = ${sessionId}
        AND wpm.id NOT IN (
          SELECT id FROM watch_party_messages
          WHERE family_id = ${familyId}::uuid AND session_id = ${sessionId}
          ORDER BY created_at DESC
          LIMIT ${MAX_MESSAGES_PER_SESSION}
        )
    `);
  } catch (error) {
    // Non-fatal: log but don't throw
    console.error('Error cleaning up old messages:', error);
  }
}

/**
 * Get message count for a session
 */
export async function getMessageCount(
  familyId: string,
  sessionId: string
): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM watch_party_messages
      WHERE family_id = ${familyId}::uuid AND session_id = ${sessionId}
    `);

    return ((result as { count: number }[])[0]?.count) || 0;
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') {
      return 0;
    }
    throw error;
  }
}
