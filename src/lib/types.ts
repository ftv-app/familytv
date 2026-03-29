// FamilyTV TypeScript Interfaces

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  created_at: Date;
}

export interface Family {
  id: string;
  name: string;
  created_at: Date;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: Date;
}

export interface Invite {
  id: string;
  family_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: Date;
  created_at: Date;
}

export interface ActivityLog {
  id: string;
  family_id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// Query result types with member counts
export interface FamilyWithMemberCount extends Family {
  member_count: number;
}

export interface FamilyMemberWithUser extends FamilyMember {
  user_name: string | null;
  user_email: string;
}

// Event types for family calendar
export type EventType = 'birthday' | 'gathering' | 'reminder' | 'other';

export interface Event {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  event_date: Date;
  start_time: string | null; // HH:MM format
  end_time: string | null; // HH:MM format
  all_day: boolean;
  type: EventType;
  created_by: string;
  created_at: Date;
}

export interface EventWithCreator extends Event {
  creator_name: string | null;
  creator_email: string;
}

// Post types for family media feed
export type MediaType = 'image' | 'video';

export interface Post {
  id: string;
  family_id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  created_at: Date;
}

export interface PostWithAuthor extends Post {
  author_name: string | null;
  author_email: string;
}

// Notification types
export type NotificationType = 'post_created' | 'event_reminder' | 'invite_received';

export interface Notification {
  id: string;
  user_id: string;
  family_id: string;
  type: NotificationType;
  related_id: string | null;
  message: string;
  read: boolean;
  created_at: Date;
}

export interface NotificationWithDetails extends Notification {
  related_title?: string | null;
}
