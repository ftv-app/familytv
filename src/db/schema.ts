import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// ---- Relations ----

export const familiesRelations = relations(families, ({ many }) => ({
  memberships: many(familyMemberships),
  invites: many(invites),
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
