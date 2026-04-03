/**
 * Data factories for FamilyTV tests.
 * Generates realistic, typed test fixtures for all DB entities.
 *
 * Usage:
 *   import { factories } from '@/test/fixtures';
 *   const user = factories.user();
 *   const family = factories.family();
 *   const post = factories.post({ familyId: family.id, authorId: user.id });
 */

function generateUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const factories = {
  /**
   * Creates a mock user object (Clerk auth object shape).
   */
  user(overrides?: Partial<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    emailAddresses: Array<{ emailAddress: string }>;
    publicMetadata: Record<string, unknown>;
  }>) {
    return {
      id: `user_${generateUUID().slice(0, 8)}`,
      firstName: "Test",
      lastName: "User",
      email: "test@familytv.test",
      emailAddresses: [{ emailAddress: "test@familytv.test" }],
      publicMetadata: {},
      ...overrides,
    };
  },

  /**
   * Creates a family DB row.
   */
  family(overrides?: Partial<{
    id: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>) {
    return {
      id: generateUUID(),
      name: "The Test Family",
      avatarUrl: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates a family membership DB row.
   */
  membership(overrides?: Partial<{
    id: string;
    familyId: string;
    userId: string;
    role: "owner" | "member";
    joinedAt: Date;
  }>) {
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      userId: `user_${generateUUID().slice(0, 8)}`,
      role: "member" as const,
      joinedAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates a post DB row.
   */
  post(overrides?: Partial<{
    id: string;
    familyId: string;
    authorId: string;
    authorName: string;
    contentType: string;
    mediaUrl: string | null;
    caption: string | null;
    createdAt: Date;
    updatedAt: Date;
    serverTimestamp: Date;
  }>) {
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      authorId: `user_${generateUUID().slice(0, 8)}`,
      authorName: "Family Member",
      contentType: "text",
      mediaUrl: null,
      caption: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      serverTimestamp: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates a comment DB row.
   */
  comment(overrides?: Partial<{
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }>) {
    return {
      id: generateUUID(),
      postId: generateUUID(),
      authorId: `user_${generateUUID().slice(0, 8)}`,
      authorName: "Family Member",
      content: "This is a test comment",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates a reaction DB row.
   */
  reaction(overrides?: Partial<{
    id: string;
    postId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
  }>) {
    return {
      id: generateUUID(),
      postId: generateUUID(),
      userId: `user_${generateUUID().slice(0, 8)}`,
      emoji: "👍",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates an invite DB row (legacy table).
   */
  invite(overrides?: Partial<{
    id: string;
    familyId: string;
    email: string;
    tokenHash: string;
    status: "pending" | "accepted" | "revoked";
    expiresAt: Date;
    createdAt: Date;
    createdBy: string;
  }>) {
    const token = generateUUID().replace(/-/g, "");
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      email: "invitee@familytv.test",
      tokenHash: token,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      createdBy: `user_${generateUUID().slice(0, 8)}`,
      ...overrides,
    };
  },

  /**
   * Creates a familyInvite DB row.
   */
  familyInvite(overrides?: Partial<{
    id: string;
    familyId: string;
    inviteCodeHash: string;
    lookupHash: string;
    createdByUserId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }>) {
    const code = generateUUID().replace(/-/g, "");
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      inviteCodeHash: code,
      lookupHash: code,
      createdByUserId: `user_${generateUUID().slice(0, 8)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Creates a calendar event DB row.
   */
  calendarEvent(overrides?: Partial<{
    id: string;
    familyId: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    allDay: boolean;
    createdBy: string;
    createdAt: Date;
    serverTimestamp: Date;
  }>) {
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      title: "Family BBQ",
      description: "Annual family barbecue",
      startDate: new Date("2026-07-04T12:00:00Z"),
      endDate: new Date("2026-07-04T18:00:00Z"),
      allDay: false,
      createdBy: `user_${generateUUID().slice(0, 8)}`,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      serverTimestamp: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },

  /**
   * Creates a family sync state DB row.
   */
  familySyncState(overrides?: Partial<{
    familyId: string;
    lastServerTime: Date;
    lastSyncedAt: Date;
    driftMs: number;
    updatedAt: Date;
  }>) {
    const now = new Date();
    return {
      familyId: generateUUID(),
      lastServerTime: now,
      lastSyncedAt: now,
      driftMs: 0,
      updatedAt: now,
      ...overrides,
    };
  },

  /**
   * Creates an album DB row (CTM-237).
   */
  album(overrides?: Partial<{
    id: string;
    familyId: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>) {
    return {
      id: generateUUID(),
      familyId: generateUUID(),
      name: "Summer Vacation 2026",
      description: "Photos from our family trip",
      coverUrl: null,
      createdBy: `user_${generateUUID().slice(0, 8)}`,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    };
  },
};

// Named exports for convenience
export const user = factories.user;
export const family = factories.family;
export const membership = factories.membership;
export const post = factories.post;
export const comment = factories.comment;
export const reaction = factories.reaction;
export const invite = factories.invite;
export const familyInvite = factories.familyInvite;
export const calendarEvent = factories.calendarEvent;
export const familySyncState = factories.familySyncState;
export const album = factories.album;
