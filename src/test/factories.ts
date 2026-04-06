// Simple UUID generator that works in both Node.js and browser environments
function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback: simple UUID-like string
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---- Factory functions for test data ----

export function createMockUser(overrides?: Partial<{
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  created_at: Date;
}>) {
  return {
    id: generateUUID(),
    clerk_id: `user_${generateUUID().slice(0, 8)}`,
    email: "test@example.com",
    name: "Test User",
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockFamily(overrides?: Partial<{
  id: string;
  name: string;
  created_at: Date;
}>) {
  return {
    id: generateUUID(),
    name: "The Smith Family",
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockFamilyMembership(overrides?: Partial<{
  id: string;
  familyId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}>) {
  return {
    id: generateUUID(),
    familyId: generateUUID(),
    userId: `user_${generateUUID().slice(0, 8)}`,
    role: "member" as const,
    joinedAt: new Date(),
    ...overrides,
  };
}

export function createMockInvite(overrides?: Partial<{
  id: string;
  familyId: string;
  email: string;
  token: string;
  tokenHash: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
}>) {
  const token = generateUUID().replace(/-/g, "");
  return {
    id: generateUUID(),
    familyId: generateUUID(),
    email: "invitee@example.com",
    token,
    tokenHash: token, // in real code it's sha256, but for mocks it's fine
    status: "pending" as const,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: `user_${generateUUID().slice(0, 8)}`,
    ...overrides,
  };
}

export function createMockPost(overrides?: Partial<{
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  contentType: string;
  mediaUrl: string | null;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;
}>) {
  return {
    id: generateUUID(),
    familyId: generateUUID(),
    authorId: `user_${generateUUID().slice(0, 8)}`,
    authorName: "Family Member",
    contentType: "text",
    mediaUrl: null,
    caption: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockComment(overrides?: Partial<{
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
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockReaction(overrides?: Partial<{
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
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockCalendarEvent(overrides?: Partial<{
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  createdBy: string;
  createdAt: Date;
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
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockAlbum(overrides?: Partial<{
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
    name: "Summer 2025",
    description: null,
    coverUrl: null,
    createdBy: `user_${generateUUID().slice(0, 8)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
