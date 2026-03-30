// Test data factories for FamilyTV tests

export function createMockUser(overrides = {}) {
  return {
    id: `user_${Math.random().toString(36).slice(2, 10)}`,
    clerk_id: `clerk_${Math.random().toString(36).slice(2, 10)}`,
    email: "test@family.com",
    name: "Test User",
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockFamily(overrides = {}) {
  return {
    id: `fam_${Math.random().toString(36).slice(2, 10)}`,
    name: "The Smith Family",
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockMembership(overrides = {}) {
  return {
    id: `mem_${Math.random().toString(36).slice(2, 10)}`,
    family_id: createMockFamily().id,
    user_id: createMockUser().id,
    role: "member" as const,
    joined_at: new Date(),
    ...overrides,
  };
}

export function createMockPost(overrides = {}) {
  return {
    id: `post_${Math.random().toString(36).slice(2, 10)}`,
    familyId: createMockFamily().id,
    authorId: createMockUser().id,
    authorName: "Test Author",
    contentType: "text" as const,
    mediaUrl: null,
    caption: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockComment(overrides = {}) {
  return {
    id: `comment_${Math.random().toString(36).slice(2, 10)}`,
    postId: createMockPost().id,
    authorId: createMockUser().id,
    authorName: "Commenter",
    content: "This is a test comment",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockEvent(overrides = {}) {
  return {
    id: `event_${Math.random().toString(36).slice(2, 10)}`,
    familyId: createMockFamily().id,
    title: "Family Birthday",
    description: "Grandma's birthday party",
    startDate: new Date(),
    endDate: null,
    allDay: false,
    createdBy: createMockUser().id,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockInvite(overrides = {}) {
  return {
    id: `invite_${Math.random().toString(36).slice(2, 10)}`,
    familyId: createMockFamily().id,
    email: "invitee@family.com",
    tokenHash: "hashed_token_value",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending" as const,
    createdAt: new Date(),
    createdBy: createMockUser().id,
    ...overrides,
  };
}

export function createMockReaction(overrides = {}) {
  return {
    id: `reaction_${Math.random().toString(36).slice(2, 10)}`,
    postId: createMockPost().id,
    userId: createMockUser().id,
    emoji: "👍",
    createdAt: new Date(),
    ...overrides,
  };
}

export const TEST_USER_ID = "test_user_123";
export const TEST_TOKEN = "test_clerk_token";

export function createClerkMock(userOverrides = {}) {
  return {
    userId: TEST_USER_ID,
    getToken: () => Promise.resolve(TEST_TOKEN),
    ...userOverrides,
  };
}
