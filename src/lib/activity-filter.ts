/**
 * Activity Filtering Logic
 * CTM-237: What's Happening Now — proactive family surfacing
 */

import { desc, and, lt, gte, inArray, eq } from "drizzle-orm";
import { posts, comments, reactions, calendarEvents } from "@/db/schema";

// ============================================
// Types
// ============================================

export type ActivityTimeRange = "24h" | "7d" | "all";
export type ActivityType = "post" | "comment" | "reaction" | "event";

export interface ActivityFilterOptions {
  timeRange: ActivityTimeRange;
  types: ActivityType[];
  memberIds: string[] | null;
  limit: number;
  cursor: Date | null;
}

export interface FilteredActivityResult {
  activities: ActivityItem[];
  nextCursor: string | null;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  content: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// Time Range Helpers
// ============================================

/**
 * Get the start date for a time range
 */
export function getTimeRangeStart(timeRange: ActivityTimeRange): Date | null {
  const now = new Date();
  switch (timeRange) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
  }
}

// ============================================
// Activity Type Mapping
// ============================================

/**
 * Check if a type filter includes "post"
 */
export function shouldIncludePosts(types: ActivityType[] | null): boolean {
  return types === null || types.includes("post");
}

/**
 * Check if a type filter includes "comment"
 */
export function shouldIncludeComments(types: ActivityType[] | null): boolean {
  return types === null || types.includes("comment");
}

/**
 * Check if a type filter includes "reaction"
 */
export function shouldIncludeReactions(types: ActivityType[] | null): boolean {
  return types === null || types.includes("reaction");
}

/**
 * Check if a type filter includes "event"
 */
export function shouldIncludeEvents(types: ActivityType[] | null): boolean {
  return types === null || types.includes("event");
}

// ============================================
// Filter Validation
// ============================================

const VALID_TIME_RANGES: ActivityTimeRange[] = ["24h", "7d", "all"];
const VALID_ACTIVITY_TYPES: ActivityType[] = ["post", "comment", "reaction", "event"];
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTimeRange(value: string | null): ValidationResult {
  if (value === null) {
    return { valid: true }; // null means "all"
  }
  if (VALID_TIME_RANGES.includes(value as ActivityTimeRange)) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Invalid timeRange. Must be one of: ${VALID_TIME_RANGES.join(", ")}`,
  };
}

export function validateActivityTypes(value: string | null): ValidationResult {
  if (value === null) {
    return { valid: true }; // null means all types
  }
  const types = value.split(",");
  for (const type of types) {
    if (!VALID_ACTIVITY_TYPES.includes(type.trim() as ActivityType)) {
      return {
        valid: false,
        error: `Invalid activity type: ${type}. Must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`,
      };
    }
  }
  return { valid: true };
}

export function validateMemberIds(value: string | null): ValidationResult {
  if (value === null) {
    return { valid: true }; // null means all members
  }
  const ids = value.split(",");
  for (const id of ids) {
    if (id.trim().length === 0) {
      return { valid: false, error: "Member IDs cannot be empty strings" };
    }
  }
  return { valid: true };
}

export function validateLimit(value: string | null): ValidationResult {
  if (value === null) {
    return { valid: true };
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > MAX_LIMIT) {
    return {
      valid: false,
      error: `limit must be between 1 and ${MAX_LIMIT}`,
    };
  }
  return { valid: true };
}

export function parseLimit(value: string | null): number {
  if (value === null) {
    return DEFAULT_LIMIT;
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > MAX_LIMIT) {
    return DEFAULT_LIMIT;
  }
  return num;
}

export function parseTimeRange(value: string | null): ActivityTimeRange {
  if (value === null) {
    return "all";
  }
  if (VALID_TIME_RANGES.includes(value as ActivityTimeRange)) {
    return value as ActivityTimeRange;
  }
  return "all";
}

export function parseActivityTypes(value: string | null): ActivityType[] | null {
  if (value === null) {
    return null;
  }
  return value.split(",").map((t) => t.trim() as ActivityType);
}

export function parseMemberIds(value: string | null): string[] | null {
  if (value === null) {
    return null;
  }
  return value.split(",").map((id) => id.trim()).filter((id) => id.length > 0);
}

export function parseCursor(value: string | null): Date | null {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

// ============================================
// Cursor Helpers
// ============================================

/**
 * Check if a cursor date is valid for filtering
 */
export function isValidCursor(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ============================================
// Filter Building Helpers
// ============================================

export interface ActivityWhereClauses {
  postsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | null;
  commentsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof inArray> | null;
  reactionsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof inArray> | null;
  eventsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | null;
  memberIdFilter: string[] | null;
}

/**
 * Build WHERE clauses for activity queries based on filters
 */
export function buildActivityWhereClauses(
  familyId: string,
  filter: ActivityFilterOptions
): ActivityWhereClauses {
  const timeStart = getTimeRangeStart(filter.timeRange);
  const memberIds = filter.memberIds;

  // Build base conditions
  const baseConditions: ReturnType<typeof eq>[] = [eq(posts.familyId, familyId)];
  const baseEventConditions: ReturnType<typeof eq>[] = [eq(calendarEvents.familyId, familyId)];

  // Apply time filter to posts
  let postsTimeCondition: ReturnType<typeof lt> | null = null;
  if (timeStart) {
    postsTimeCondition = gte(posts.createdAt, timeStart);
  }

  // Posts cursor condition
  let postsCursorCondition: ReturnType<typeof lt> | null = null;
  if (filter.cursor) {
    postsCursorCondition = lt(posts.createdAt, filter.cursor);
  }

  // Combine post conditions
  let postsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | null = null;
  if (postsTimeCondition && postsCursorCondition) {
    postsWhere = and(...baseConditions, postsTimeCondition, postsCursorCondition);
  } else if (postsTimeCondition) {
    postsWhere = and(...baseConditions, postsTimeCondition);
  } else if (postsCursorCondition) {
    postsWhere = and(...baseConditions, postsCursorCondition);
  } else {
    postsWhere = eq(posts.familyId, familyId);
  }

  // Events conditions
  let eventsTimeCondition: ReturnType<typeof gte> | null = null;
  if (timeStart) {
    eventsTimeCondition = gte(calendarEvents.startDate, timeStart);
  }

  let eventsCursorCondition: ReturnType<typeof lt> | null = null;
  if (filter.cursor) {
    eventsCursorCondition = lt(calendarEvents.startDate, filter.cursor);
  }

  let eventsWhere: ReturnType<typeof eq> | ReturnType<typeof and> | null = null;
  if (eventsTimeCondition && eventsCursorCondition) {
    eventsWhere = and(...baseEventConditions, eventsTimeCondition, eventsCursorCondition);
  } else if (eventsTimeCondition) {
    eventsWhere = and(...baseEventConditions, eventsTimeCondition);
  } else if (eventsCursorCondition) {
    eventsWhere = and(...baseEventConditions, eventsCursorCondition);
  } else {
    eventsWhere = eq(calendarEvents.familyId, familyId);
  }

  // Comments and reactions conditions are built differently (they use postIds)
  // For now, we build them with cursor/time conditions but will filter by postIds after
  const commentsWhere = filter.cursor
    ? and(lt(comments.createdAt, filter.cursor))
    : null;

  const reactionsWhere = filter.cursor
    ? and(lt(reactions.createdAt, filter.cursor))
    : null;

  return {
    postsWhere,
    commentsWhere,
    reactionsWhere,
    eventsWhere,
    memberIdFilter: memberIds,
  };
}

// ============================================
// Activity Transformation Helpers
// ============================================

export function transformPostToActivity(
  post: typeof posts.$inferSelect
): ActivityItem {
  return {
    id: post.id,
    type: "post",
    actor: {
      id: post.authorId,
      name: post.authorName,
      avatar: null,
    },
    content: {
      contentType: post.contentType,
      mediaUrl: post.mediaUrl,
      caption: post.caption,
    },
    createdAt: post.createdAt.toISOString(),
  };
}

export function transformCommentToActivity(
  comment: typeof comments.$inferSelect
): ActivityItem {
  return {
    id: comment.id,
    type: "comment",
    actor: {
      id: comment.authorId,
      name: comment.authorName,
      avatar: null,
    },
    content: {
      postId: comment.postId,
      content: comment.content,
    },
    createdAt: comment.createdAt.toISOString(),
  };
}

export function transformReactionToActivity(
  reaction: typeof reactions.$inferSelect
): ActivityItem {
  return {
    id: reaction.id,
    type: "reaction",
    actor: {
      id: reaction.userId,
      name: reaction.userId, // We don't store user name for reactions
      avatar: null,
    },
    content: {
      postId: reaction.postId,
      emoji: reaction.emoji,
    },
    createdAt: reaction.createdAt.toISOString(),
  };
}

export function transformEventToActivity(
  event: typeof calendarEvents.$inferSelect
): ActivityItem {
  return {
    id: event.id,
    type: "event",
    actor: {
      id: event.createdBy,
      name: event.createdBy, // We don't have a name lookup here
      avatar: null,
    },
    content: {
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || null,
      allDay: event.allDay,
    },
    createdAt: event.createdAt.toISOString(),
  };
}

// ============================================
// Filtering by Member IDs
// ============================================

/**
 * Filter activities by member IDs
 */
export function filterByMembers(
  activities: ActivityItem[],
  memberIds: string[] | null
): ActivityItem[] {
  if (memberIds === null || memberIds.length === 0) {
    return activities;
  }
  return activities.filter((activity) => memberIds.includes(activity.actor.id));
}

/**
 * Sort activities by createdAt descending
 */
export function sortActivitiesByDate(activities: ActivityItem[]): ActivityItem[] {
  return [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Apply limit and calculate next cursor
 */
export function applyPagination(
  activities: ActivityItem[],
  limit: number
): { items: ActivityItem[]; nextCursor: string | null } {
  const sorted = sortActivitiesByDate(activities);
  const paginated = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;
  const nextCursor =
    hasMore && paginated.length > 0 ? paginated[paginated.length - 1].createdAt : null;
  return { items: paginated, nextCursor };
}
