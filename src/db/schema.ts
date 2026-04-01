import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// ---- Enums ----
export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "member",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "revoked",
]);

// ---- Tables ----

/**
 * Families table - each row is one family group
 */
export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Family memberships - links a user to a family with a role
 * userId comes from Clerk's auth().userId in server actions
 */
export const familyMemberships = pgTable(
  "family_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: membershipRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    // A user can only have one membership per family
    uniqueIndex("unique_user_family").on(table.userId, table.familyId),
    // Index for looking up membership by userId
    index("memberships_user_idx").on(table.userId),
    // Index for looking up membership by familyId
    index("memberships_family_idx").on(table.familyId),
  ]
);

/**
 * Invites - pending invitations to join a family
 */
export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    // Hashed token for the invite link
    tokenHash: text("token_hash").notNull(),
    // Token expires after 7 days
    expiresAt: timestamp("expires_at").notNull(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by").notNull(), // Clerk userId of inviter
  },
  (table) => [
    // Index for lookups by email + family
    index("invites_email_family_idx").on(table.email, table.familyId),
    // Index for token lookups
    uniqueIndex("invites_token_idx").on(table.tokenHash),
    // Index for pending invites by familyId
    index("invites_family_pending_idx").on(table.familyId, table.status),
  ]
);

/**
 * Posts - family posts with optional media (video, image, or text)
 */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(), // Clerk userId
    authorName: text("author_name").default("Family member").notNull(), // Cached display name from Clerk
    contentType: text("content_type").notNull(),
    mediaUrl: text("media_url"),           // Vercel Blob URL (null for text posts)
    caption: text("caption"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("posts_family_idx").on(table.familyId),
    index("posts_author_idx").on(table.authorId),
    index("posts_created_idx").on(table.familyId, table.createdAt),
  ]
);

/**
 * Calendar events - family calendar events
 */
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),          // null for all-day events
    allDay: boolean("all_day").notNull().default(false),
    createdBy: text("created_by").notNull(), // Clerk userId
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("calendar_events_family_idx").on(table.familyId),
    index("calendar_events_start_idx").on(table.familyId, table.startDate),
  ]
);

// ---- Relations ----

/**
 * Family invites - invite-only family join mechanism (CTM-205)
 * Invite codes are 32-char hex, bcrypt-hashed before storage
 */
export const familyInvites = pgTable(
  "family_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    inviteCodeHash: text("invite_code_hash").notNull(),
    inviteCodeLookupHash: text("invite_code_lookup_hash"),
    createdByUserId: text("created_by_user_id").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("family_invites_family_idx").on(table.familyId),
    index("family_invites_created_by_idx").on(table.createdByUserId),
    index("family_invites_lookup_hash_idx").on(table.inviteCodeLookupHash),
  ]
);

/**
 * Rate limiting for invite creation per family per day
 */
export const familyInviteRateLimits = pgTable(
  "family_invite_rate_limits",
  {
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    createdDate: timestamp("created_date").notNull().defaultNow(),
    inviteCount: integer("invite_count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("family_invite_rl_pk").on(table.familyId, table.createdDate),
  ]
);

export const familiesRelations = relations(families, ({ many }) => ({
  memberships: many(familyMemberships),
  invites: many(invites),
  familyInvites: many(familyInvites),
  posts: many(posts),
  calendarEvents: many(calendarEvents),
}));

export const familyMembershipsRelations = relations(
  familyMemberships,
  ({ one }) => ({
    family: one(families, {
      fields: [familyMemberships.familyId],
      references: [families.id],
    }),
  })
);

export const invitesRelations = relations(invites, ({ one }) => ({
  family: one(families, {
    fields: [invites.familyId],
    references: [families.id],
  }),
}));

export const familyInvitesRelations = relations(familyInvites, ({ one }) => ({
  family: one(families, {
    fields: [familyInvites.familyId],
    references: [families.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  family: one(families, {
    fields: [posts.familyId],
    references: [families.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  family: one(families, {
    fields: [calendarEvents.familyId],
    references: [families.id],
  }),
}));

// Comments table
export const commentStatusEnum = pgEnum("comment_status", ["active", "deleted"]);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reactions table
export const reactions = pgTable("reactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  emoji: text("emoji").notNull(), // 👍 ❤️ 😂 😢
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_user_post_reaction").on(table.userId, table.postId),
]);

/**
 * Watch Party Chat Messages
 * Stores chat messages for watch party sessions
 * Limited to last 100 messages per session
 */
export const watchPartyMessages = pgTable("watch_party_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id").notNull(),
  sessionId: text("session_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_watch_party_session").on(table.familyId, table.sessionId, table.createdAt),
  index("idx_watch_party_cleanup").on(table.familyId, table.sessionId, table.id),
]);
