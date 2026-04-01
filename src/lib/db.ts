import { neon } from '@neondatabase/serverless';
import {
  User,
  Family,
  FamilyMember,
  Invite,
  ActivityLog,
  FamilyWithMemberCount,
  FamilyMemberWithUser,
  Post,
  PostWithAuthor,
  MediaType,
  Event,
  EventWithCreator,
  EventType,
  Notification,
  NotificationWithDetails,
  NotificationType,
} from './types';

import type { NeonQueryFunction } from '@neondatabase/serverless';
type SqlClient = NeonQueryFunction<false, false>;

// Lazy database client - only initialized at runtime (not during Next.js build)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: SqlClient | null = null;

function getSql(): SqlClient {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export const sql = ((): SqlClient => {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}) as unknown as SqlClient;

// ============================================
// User Queries
// ============================================

export async function upsertUser(clerkId: string, email: string, name: string | null): Promise<User[]> {
  return getSql()`
    INSERT INTO users (clerk_id, email, name)
    VALUES (${clerkId}, ${email}, ${name})
    ON CONFLICT (clerk_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name)
    RETURNING *
  ` as unknown as User[];
}

export async function getUserByClerkId(clerkId: string): Promise<User[]> {
  return getSql()`
    SELECT * FROM users WHERE clerk_id = ${clerkId}
  ` as unknown as User[];
}

export async function getUserById(id: string): Promise<User[]> {
  return getSql()`
    SELECT * FROM users WHERE id = ${id}
  ` as unknown as User[];
}

// ============================================
// Family Queries
// ============================================

export async function createFamily(name: string, ownerId: string): Promise<Family[]> {
  return getSql()`
    WITH new_family AS (
      INSERT INTO families (name)
      VALUES (${name})
      RETURNING *
    ),
    owner_member AS (
      INSERT INTO family_members (family_id, user_id, role)
      SELECT id, ${ownerId}, 'owner' FROM new_family
    )
    SELECT * FROM new_family
  ` as unknown as Family[];
}

export async function getFamiliesByUserId(userId: string): Promise<FamilyWithMemberCount[]> {
  return getSql()`
    SELECT 
      f.id,
      f.name,
      f.created_at,
      COUNT(fm.id)::int AS member_count
    FROM families f
    INNER JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = ${userId}
    GROUP BY f.id, f.name, f.created_at
    ORDER BY f.created_at DESC
  ` as unknown as FamilyWithMemberCount[];
}

export async function getFamilyById(id: string): Promise<Family[]> {
  return getSql()`
    SELECT * FROM families WHERE id = ${id}
  ` as unknown as Family[];
}

// ============================================
// Family Member Queries
// ============================================

export async function addFamilyMember(
  familyId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<FamilyMember[]> {
  return getSql()`
    INSERT INTO family_members (family_id, user_id, role)
    VALUES (${familyId}, ${userId}, ${role})
    ON CONFLICT (family_id, user_id) DO NOTHING
    RETURNING *
  ` as unknown as FamilyMember[];
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]> {
  return getSql()`
    SELECT 
      fm.id,
      fm.family_id,
      fm.user_id,
      fm.role,
      fm.joined_at,
      u.name AS user_name,
      u.email AS user_email
    FROM family_members fm
    INNER JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ${familyId}
    ORDER BY 
      CASE fm.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        ELSE 3 
      END,
      fm.joined_at ASC
  ` as unknown as FamilyMemberWithUser[];
}

export async function getUserFamilyRole(
  familyId: string,
  userId: string
): Promise<FamilyMember[]> {
  return getSql()`
    SELECT * FROM family_members 
    WHERE family_id = ${familyId} AND user_id = ${userId}
  ` as unknown as FamilyMember[];
}

export async function removeFamilyMember(familyId: string, userId: string): Promise<void> {
  await getSql()`
    DELETE FROM family_members 
    WHERE family_id = ${familyId} AND user_id = ${userId}
  `;
}

// ============================================
// Invite Queries
// ============================================

export async function createInvite(
  familyId: string,
  email: string,
  token: string
): Promise<Invite[]> {
  return getSql()`
    INSERT INTO invites (family_id, email, token)
    VALUES (${familyId}, ${email}, ${token})
    RETURNING *
  ` as unknown as Invite[];
}

export async function getInviteByToken(token: string): Promise<Invite[]> {
  return getSql()`
    SELECT * FROM invites 
    WHERE token = ${token} 
    AND status = 'pending' 
    AND expires_at > NOW()
  ` as unknown as Invite[];
}

export async function acceptInvite(token: string, userId: string): Promise<void> {
  await getSql()`
    UPDATE invites SET status = 'accepted'
    WHERE token = ${token}
  `;
  
  const invite = await getInviteByToken(token);
  if (invite.length > 0) {
    await addFamilyMember(invite[0].family_id, userId, 'member');
  }
}

// ============================================
// Activity Log Queries
// ============================================

export async function logActivity(
  familyId: string,
  actorId: string | null,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<ActivityLog[]> {
  return getSql()`
    INSERT INTO activity_logs (family_id, actor_id, action, metadata)
    VALUES (${familyId}, ${actorId}, ${action}, ${JSON.stringify(metadata)})
    RETURNING *
  ` as unknown as ActivityLog[];
}

export async function getRecentActivity(
  familyId: string,
  limit: number = 20
): Promise<ActivityLog[]> {
  return getSql()`
    SELECT * FROM activity_logs 
    WHERE family_id = ${familyId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as unknown as ActivityLog[];
}

// ============================================
// Post / Feed Queries
// ============================================

export async function createPost(
  familyId: string,
  authorId: string,
  content: string | null,
  mediaUrl: string | null,
  mediaType: MediaType | null
): Promise<Post[]> {
  return getSql()`
    INSERT INTO posts (family_id, author_id, content, media_url, media_type)
    VALUES (${familyId}, ${authorId}, ${content}, ${mediaUrl}, ${mediaType})
    RETURNING *
  ` as unknown as Post[];
}

export async function getPostsByFamilyId(
  familyId: string,
  limit: number = 50
): Promise<PostWithAuthor[]> {
  return getSql()`
    SELECT 
      p.id,
      p.family_id,
      p.author_id,
      p.content,
      p.media_url,
      p.media_type,
      p.created_at,
      u.name AS author_name,
      u.email AS author_email
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    WHERE p.family_id = ${familyId}
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  ` as unknown as PostWithAuthor[];
}

// ============================================
// Event Queries
// ============================================

export async function createEvent(
  familyId: string,
  title: string,
  eventDate: Date,
  createdBy: string,
  type: EventType,
  description: string | null = null,
  startTime: string | null = null,
  endTime: string | null = null,
  allDay: boolean = false
): Promise<Event[]> {
  return getSql()`
    INSERT INTO events (family_id, title, description, event_date, start_time, end_time, all_day, type, created_by)
    VALUES (${familyId}, ${title}, ${description}, ${eventDate}, ${startTime}, ${endTime}, ${allDay}, ${type}, ${createdBy})
    RETURNING *
  ` as unknown as Event[];
}

export async function getEventsByFamilyId(familyId: string): Promise<EventWithCreator[]> {
  return getSql()`
    SELECT 
      e.id,
      e.family_id,
      e.title,
      e.description,
      e.event_date,
      e.start_time,
      e.end_time,
      e.all_day,
      e.type,
      e.created_by,
      e.created_at,
      u.name AS creator_name,
      u.email AS creator_email
    FROM events e
    INNER JOIN users u ON u.id = e.created_by
    WHERE e.family_id = ${familyId}
    ORDER BY e.event_date ASC
  ` as unknown as EventWithCreator[];
}

export async function deleteEvent(eventId: string): Promise<void> {
  await getSql()`
    DELETE FROM events WHERE id = ${eventId}
  `;
}

export async function updateEvent(
  eventId: string,
  title: string,
  eventDate: Date,
  type: EventType,
  description: string | null = null,
  startTime: string | null = null,
  endTime: string | null = null,
  allDay: boolean = false
): Promise<Event[]> {
  return getSql()`
    UPDATE events 
    SET title = ${title}, 
        description = ${description}, 
        event_date = ${eventDate}, 
        start_time = ${startTime}, 
        end_time = ${endTime}, 
        all_day = ${allDay}, 
        type = ${type}
    WHERE id = ${eventId}
    RETURNING *
  ` as unknown as Event[];
}

// ============================================
// Notification Queries
// ============================================

export async function createNotification(
  userId: string,
  familyId: string,
  type: NotificationType,
  message: string,
  relatedId: string | null = null
): Promise<Notification[]> {
  return getSql()`
    INSERT INTO notifications (user_id, family_id, type, message, related_id)
    VALUES (${userId}, ${familyId}, ${type}, ${message}, ${relatedId})
    RETURNING *
  ` as unknown as Notification[];
}

export async function getNotificationsByUserId(
  userId: string,
  limit: number = 50
): Promise<NotificationWithDetails[]> {
  return getSql()`
    SELECT 
      n.id,
      n.user_id,
      n.type,
      n.related_id,
      n.message,
      n.read,
      n.created_at,
      CASE 
        WHEN n.type = 'post_created' THEN p.content
        WHEN n.type = 'event_reminder' THEN e.title
        ELSE NULL
      END AS related_title
    FROM notifications n
    LEFT JOIN posts p ON n.type = 'post_created' AND n.related_id = p.id
    LEFT JOIN events e ON n.type = 'event_reminder' AND n.related_id = e.id
    WHERE n.user_id = ${userId}
    ORDER BY n.created_at DESC
    LIMIT ${limit}
  ` as unknown as NotificationWithDetails[];
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await getSql()`
    UPDATE notifications 
    SET read = TRUE 
    WHERE id = ${notificationId} AND user_id = ${userId}
  `;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getSql()`
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = ${userId} AND read = FALSE
  `;
}
