/**
 * CTM-38: What's Happening Now — Activity Ranking Engine
 *
 * Implements tiered weighted scoring:
 * - recencyScore × 0.40
 * - engagementScore × 0.35
 * - socialProximity × 0.15
 * - semanticScore × 0.10 (always 0 in v1)
 *
 * Also applies spam suppression and diversity boosting.
 */

// ============================================
// Types
// ============================================

export interface RankedPost {
  id: string;
  type: "post";
  score: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  content: Record<string, unknown>;
  reactionCount?: number;
  commentCount?: number;
}

export interface RankedComment {
  id: string;
  type: "comment";
  score: number;
  createdAt: string;
  postId: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  content: string;
  isOnOwnPost: boolean;
}

export interface RankedMemberJoin {
  id: string;
  type: "member_join";
  score: number;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  invitedBy?: {
    id: string;
    name: string;
  };
}

export interface RankedBirthday {
  id: string;
  type: "birthday";
  score: number;
  createdAt: string;
  person: {
    id: string;
    name: string;
    avatar: string | null;
  };
  displayName: string;
  daysUntil: number;
  isToday: boolean;
  isTomorrow: boolean;
  dateLabel: string;
}

export type RankedActivityItem =
  | RankedPost
  | RankedComment
  | RankedMemberJoin
  | RankedBirthday;

// Score breakdown for debugging/audit
export interface ScoreBreakdown {
  recency: number;
  engagement?: number;
  socialProximity: number;
  semantic?: number; // always 0 in v1
}

// ============================================
// Scoring Constants
// ============================================

const RECENCY_WINDOW_HOURS = 24;
const COMMENT_ENGAGEMENT_MULTIPLIER = 2;

// Weights
const POST_RECENTCY_WEIGHT = 0.40;
const POST_ENGAGEMENT_WEIGHT = 0.35;
const POST_SOCIAL_PROXIMITY_WEIGHT = 0.15;
const POST_SEMANTIC_WEIGHT = 0.10;

const COMMENT_RECENTCY_WEIGHT = 0.50;
const COMMENT_ENGAGEMENT_WEIGHT = 0.30;
const COMMENT_SOCIAL_PROXIMITY_WEIGHT = 0.20;

const MEMBER_RECENTCY_WEIGHT = 0.60;
const MEMBER_SOCIAL_PROXIMITY_WEIGHT = 0.40;

const BIRTHDAY_PROXIMITY_WEIGHT = 0.70;
const BIRTHDAY_RELATIONSHIP_WEIGHT = 0.30;

// Spam suppression
const MAX_POSTS_PER_AUTHOR_PER_WINDOW = 3;
const MAX_BIRTHDAYS_PER_DAY = 3;

// Diversity
const DIVERSITY_BOOST = 0.10;
const DIVERSITY_BOOST_THRESHOLD = 3; // Apply boost when top N are same type

// ============================================
// Post Scoring
// ============================================

export interface PostScoreInput {
  ageInHours: number;
  reactionCount: number;
  commentCount: number;
  isTopInteractor: boolean;
  maxEngagementInWindow: number;
}

/**
 * Compute a 0-1 score for a post.
 * postScore = recencyScore×0.40 + engagementScore×0.35 + socialProximity×0.15 + semanticScore×0.10
 */
export function computePostScore(input: PostScoreInput): number {
  const { ageInHours, reactionCount, commentCount, isTopInteractor, maxEngagementInWindow } = input;

  // Recency: 1.0 at 0h, linearly decays to 0.0 at 24h
  const recencyScore = Math.max(0, 1 - ageInHours / RECENCY_WINDOW_HOURS);

  // Engagement: normalized reaction + comment count vs max in window
  const totalEngagement = reactionCount + commentCount * COMMENT_ENGAGEMENT_MULTIPLIER;
  const engagementScore =
    maxEngagementInWindow > 0
      ? Math.min(1.0, totalEngagement / maxEngagementInWindow)
      : 0;

  // Social proximity: 1.0 for top interactors, 0.5 otherwise
  const socialProximity = isTopInteractor ? 1.0 : 0.5;

  // Semantic: 0 in v1 (embedding integration is future work)
  const semanticScore = 0;

  return Math.min(
    1.0,
    recencyScore * POST_RECENTCY_WEIGHT +
      engagementScore * POST_ENGAGEMENT_WEIGHT +
      socialProximity * POST_SOCIAL_PROXIMITY_WEIGHT +
      semanticScore * POST_SEMANTIC_WEIGHT
  );
}

// ============================================
// Comment Scoring
// ============================================

export interface CommentScoreInput {
  ageInHours: number;
  isOnOwnPost: boolean;
  parentPostReactionCount: number;
  isTopInteractor: boolean;
  maxReactionsInWindow?: number;
}

/**
 * Compute a 0-1 score for a comment.
 * commentScore = recencyScore×0.50 + engagementScore×0.30 + socialProximity×0.20
 *
 * Note: Comments are surfaced only when they are on the requesting user's own posts.
 * The isOnOwnPost flag in the input is always true for v1 (we only fetch own-post comments).
 */
export function computeCommentScore(input: CommentScoreInput): number {
  const { ageInHours, isOnOwnPost, parentPostReactionCount, isTopInteractor, maxReactionsInWindow = 10 } = input;

  // Recency: same decay as posts
  const recencyScore = Math.max(0, 1 - ageInHours / RECENCY_WINDOW_HOURS);

  // Engagement: based on parent post's reaction count
  const engagementScore = Math.min(1.0, parentPostReactionCount / maxReactionsInWindow);

  // Social proximity: higher if it's on the user's own post (isOnOwnPost=true means
  // someone commented on YOUR post, which is more interesting than a comment on someone else's)
  const socialProximity = isOnOwnPost ? 1.0 : 0.5;

  return Math.min(
    1.0,
    recencyScore * COMMENT_RECENTCY_WEIGHT +
      engagementScore * COMMENT_ENGAGEMENT_WEIGHT +
      socialProximity * COMMENT_SOCIAL_PROXIMITY_WEIGHT
  );
}

// ============================================
// Member Join Scoring
// ============================================

export interface MemberJoinScoreInput {
  ageInHours: number;
  invitedByTopInteractor: boolean;
}

const MEMBER_JOIN_WINDOW_HOURS = 168; // 7 days

/**
 * Compute a 0-1 score for a member join.
 * memberJoinScore = recencyScore×0.60 + socialProximity×0.40
 */
export function computeMemberJoinScore(input: MemberJoinScoreInput): number {
  const { ageInHours, invitedByTopInteractor } = input;

  const recencyScore = Math.max(0, 1 - ageInHours / MEMBER_JOIN_WINDOW_HOURS);
  const socialProximity = invitedByTopInteractor ? 1.0 : 0.5;

  return Math.min(
    1.0,
    recencyScore * MEMBER_RECENTCY_WEIGHT + socialProximity * MEMBER_SOCIAL_PROXIMITY_WEIGHT
  );
}

// ============================================
// Birthday Scoring
// ============================================

export type BirthdayRelationship = "immediate" | "extended" | "non-family";

export interface BirthdayScoreInput {
  daysUntil: number;
  relationship: BirthdayRelationship;
}

const BIRTHDAY_WINDOW_DAYS = 30;

/**
 * Compute a 0-1 score for a birthday.
 * birthdayScore = proximityScore×0.70 + relationshipScore×0.30
 *
 * proximityScore: 1.0 if today, 0.5 if tomorrow, descending linearly
 */
export function computeBirthdayScore(input: BirthdayScoreInput): number {
  const { daysUntil, relationship } = input;

  if (daysUntil > BIRTHDAY_WINDOW_DAYS) return 0;

  // Proximity: today=1.0, tomorrow=0.5, linear decay beyond that
  let proximityScore: number;
  if (daysUntil === 0) {
    proximityScore = 1.0;
  } else if (daysUntil === 1) {
    proximityScore = 0.5;
  } else {
    proximityScore = Math.max(0.1, 1 - daysUntil / BIRTHDAY_WINDOW_DAYS);
  }

  // Relationship score
  let relationshipScore: number;
  switch (relationship) {
    case "immediate":
      relationshipScore = 1.0;
      break;
    case "extended":
      relationshipScore = 0.6;
      break;
    case "non-family":
    default:
      relationshipScore = 0.3;
      break;
  }

  return Math.min(
    1.0,
    proximityScore * BIRTHDAY_PROXIMITY_WEIGHT +
      relationshipScore * BIRTHDAY_RELATIONSHIP_WEIGHT
  );
}

// ============================================
// Birthday Date Helpers
// ============================================

/**
 * Format a birthday item's date label for display.
 */
export function formatBirthdayDateLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today!";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil < 7) return `In ${daysUntil} days`;
  if (daysUntil < 14) return "Next week";
  return `In ${daysUntil} days`;
}

/**
 * Compute days until a birthday from a MMDD integer and current date.
 */
export function daysUntilBirthday(birthdayMonthDay: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  const birthdayMonth = Math.floor(birthdayMonthDay / 100);
  const birthdayDay = birthdayMonthDay % 100;

  // Compute days until next occurrence
  let birthdayThisYear = new Date(now.getFullYear(), birthdayMonth - 1, birthdayDay);
  let daysUntil: number;

  if (birthdayThisYear > now) {
    // Birthday hasn't happened yet this year
    daysUntil = Math.round((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Birthday already passed this year, use next year's
    const nextBirthday = new Date(now.getFullYear() + 1, birthdayMonth - 1, birthdayDay);
    daysUntil = Math.round((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return daysUntil;
}

// ============================================
// Spam Suppression
// ============================================

interface SpamSuppressorInput {
  posts: RankedPost[];
  birthdays: RankedBirthday[];
}

/**
 * Apply spam suppression rules:
 * 1. Max 3 posts per author in the window
 * 2. Max 3 birthdays per day
 */
export function applySpamSuppression(input: SpamSuppressorInput): SpamSuppressorInput {
  const { posts, birthdays } = input;

  // Suppress posts: keep top N per author
  const authorPostCounts = new Map<string, number>();
  const suppressedPosts: RankedPost[] = [];

  for (const post of posts) {
    const count = authorPostCounts.get(post.author.id) ?? 0;
    if (count < MAX_POSTS_PER_AUTHOR_PER_WINDOW) {
      suppressedPosts.push(post);
      authorPostCounts.set(post.author.id, count + 1);
    }
  }

  // Suppress birthdays: max 3 per day
  const suppressedBirthdays = birthdays.slice(0, MAX_BIRTHDAYS_PER_DAY);

  return { posts: suppressedPosts, birthdays: suppressedBirthdays };
}

// ============================================
// Diversity Boost
// ============================================

/**
 * Apply content type diversity boost: if top N are all same type,
 * boost the highest-scoring item of a different type by 10%.
 */
function applyDiversityBoost(items: RankedActivityItem[]): RankedActivityItem[] {
  if (items.length < DIVERSITY_BOOST_THRESHOLD) return items;

  const topN = items.slice(0, DIVERSITY_BOOST_THRESHOLD);
  const topTypes = new Set(topN.map((i) => i.type));

  if (topTypes.size === 1) {
    // All top N are same type — find the highest-scoring different type item
    const rest = items.slice(DIVERSITY_BOOST_THRESHOLD);
    const differentType = rest.find((item) => !topTypes.has(item.type));

    if (differentType) {
      // Boost its score by 10%
      const boosted = { ...differentType, score: Math.min(1.0, differentType.score + DIVERSITY_BOOST) };
      return [boosted, ...items.slice(0, DIVERSITY_BOOST_THRESHOLD).filter((i) => i.id !== boosted.id), ...rest.filter((i) => i.id !== boosted.id)];
    }
  }

  return items;
}

// ============================================
// Main Ranking Function
// ============================================

export interface RankActivitiesInput {
  posts: RankedPost[];
  comments: RankedComment[];
  memberJoins: RankedMemberJoin[];
  birthdays: RankedBirthday[];
}

/**
 * Merge and rank all activity items.
 *
 * Order of precedence:
 * 1. Posts (highest priority — 24h window)
 * 2. Comments (72h window)
 * 3. Member joins (7d window)
 * 4. Birthdays (30d window)
 *
 * Within each type, items are sorted by score descending, then serverTimestamp descending.
 *
 * Spam suppression is applied before ranking.
 * Content type diversity boost is applied after initial ranking.
 */
export function rankActivities(input: RankActivitiesInput, maxItems = 20): RankedActivityItem[] {
  const { posts, comments, memberJoins, birthdays } = input;

  // 1. Apply spam suppression
  const { posts: filteredPosts, birthdays: filteredBirthdays } = applySpamSuppression({
    posts,
    birthdays,
  });

  // 2. Sort each type by score descending, then by createdAt descending
  const sortByScoreAndTime = <T extends { score: number; createdAt: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const sortedPosts = sortByScoreAndTime(filteredPosts);
  const sortedComments = sortByScoreAndTime(comments);
  const sortedMemberJoins = sortByScoreAndTime(memberJoins);
  const sortedBirthdays = sortByScoreAndTime(filteredBirthdays);

  // 3. Merge all into single ranked list
  const allItems: RankedActivityItem[] = [
    ...sortedPosts,
    ...sortedComments,
    ...sortedMemberJoins,
    ...sortedBirthdays,
  ];

  // 4. Sort by score desc, then time desc
  const ranked = sortByScoreAndTime(allItems);

  // 5. Apply diversity boost
  const withDiversity = applyDiversityBoost(ranked);

  // 6. Apply maxItems limit
  return withDiversity.slice(0, maxItems);
}
