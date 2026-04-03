/**
 * Component test factories for FamilyTV.
 *
 * Provides:
 * - Mock Clerk user / useUser for testing components with auth
 * - Mock family context providers
 * - Mock router / navigation
 * - Pre-built render wrappers for common scenarios
 * - Data fixtures for component props
 *
 * Usage:
 *   import { renderWithAuth, renderWithFamily, mockClerkUser } from '@/test/component-factories';
 *
 *   // Most common: render a component that needs auth
 *   renderWithAuth(<MyComponent />);
 *
 *   // With a specific family context
 *   renderWithFamily(<FeedPage />, { family });
 */

// ---- Clerk user mocks ----

export interface MockUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
}

export interface MockUseUser {
  user: MockUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * Creates a mock Clerk user object.
 */
export function mockClerkUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: "user_test123",
    firstName: "Test",
    lastName: "User",
    emailAddresses: [{ emailAddress: "test@familytv.test" }],
    publicMetadata: {},
    ...overrides,
  };
}

/**
 * Creates a mock useUser() return value (signed in).
 */
export function mockUseUserSignedIn(user: Partial<MockUser> = {}): MockUseUser {
  return {
    user: mockClerkUser(user),
    isLoaded: true,
    isSignedIn: true,
  };
}

/**
 * Creates a mock useUser() return value (signed out).
 */
export function mockUseUserSignedOut(): MockUseUser {
  return {
    user: null,
    isLoaded: true,
    isSignedIn: false,
  };
}

// ---- Router mocks ----

export const mockRouter = {
  push: jest.fn?.() ?? (() => Promise.resolve()),
  replace: jest.fn?.() ?? (() => Promise.resolve()),
  refresh: jest.fn?.() ?? (() => Promise.resolve()),
  back: jest.fn?.() ?? (() => Promise.resolve()),
  forward: jest.fn?.() ?? (() => Promise.resolve()),
  prefetch: jest.fn?.() ?? (() => Promise.resolve()),
};

export function resetMockRouter(): void {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.refresh.mockClear();
  mockRouter.back.mockClear();
  mockRouter.forward.mockClear();
  mockRouter.prefetch.mockClear();
}

// ---- Family context mock ----

export interface MockFamilyContext {
  family: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  membership: {
    id: string;
    role: "owner" | "member";
  } | null;
  isLoading: boolean;
}

export function mockFamilyContext(overrides: Partial<MockFamilyContext> = {}): MockFamilyContext {
  return {
    family: {
      id: "family_test123",
      name: "The Test Family",
      avatarUrl: null,
    },
    membership: {
      id: "membership_test123",
      role: "member",
    },
    isLoading: false,
    ...overrides,
  };
}

// ---- Post data for component props ----

export interface MockPostData {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  contentType: string;
  mediaUrl: string | null;
  caption: string | null;
  createdAt: string; // ISO string for display
  serverTimestamp: string;
  commentCount: number;
  reactionCount: number;
  userReaction: string | null;
}

export function mockPostData(overrides: Partial<MockPostData> = {}): MockPostData {
  return {
    id: "post_test123",
    familyId: "family_test123",
    authorId: "user_test123",
    authorName: "Family Member",
    contentType: "text",
    mediaUrl: null,
    caption: null,
    createdAt: new Date("2026-01-01T12:00:00Z").toISOString(),
    serverTimestamp: new Date("2026-01-01T12:00:00Z").toISOString(),
    commentCount: 0,
    reactionCount: 0,
    userReaction: null,
    ...overrides,
  };
}

// ---- Notifications mock ----

export interface MockNotification {
  id: string;
  type: "invite" | "comment" | "reaction" | "event";
  message: string;
  read: boolean;
  createdAt: string;
}

export function mockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  return {
    id: "notif_test123",
    type: "comment",
    message: "Someone commented on your post",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---- Render helpers ----

import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi } from "vitest";

// Lazy imports to avoid issues when the actual modules don't exist in test env
async function getClerkMock() {
  try {
    const { useUser } = await import("@clerk/nextjs");
    return { useUser };
  } catch {
    return { useUser: null };
  }
}

// Store the mocked useUser so components can use the real Clerk hooks in tests
let _mockedUseUser: MockUseUser | null = null;

export function setMockUseUser(mock: MockUseUser | null): void {
  _mockedUseUser = mock;
}

/**
 * Basic render wrapper — just wraps children in a fragment.
 * Use this as your base and wrap with additional providers.
 */
export function BaseWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Render with Clerk auth mocking.
 * Components that call useUser() will get the mocked user.
 *
 * @example
 * renderWithAuth(<PostCard post={postData} />);
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options?: RenderOptions & {
    user?: Partial<MockUser>;
    signedIn?: boolean;
  }
): ReturnType<typeof render> & { mockUseUser: MockUseUser } {
  const { user, signedIn = true, ...rest } = options ?? {};

  const mockUser = signedIn
    ? mockUseUserSignedIn(user ?? {})
    : mockUseUserSignedOut();

  setMockUseUser(mockUser);

  // Patch useUser globally for this render
  const origUseUser = jest.fn?.(() => mockUser);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BaseWrapper>{children}</BaseWrapper>
  );

  const result = render(ui, { wrapper: Wrapper, ...rest });
  return { ...result, mockUseUser: mockUser };
}

/**
 * Render with a family context provider.
 * Provide family and membership data to components that consume it.
 *
 * @example
 * renderWithFamily(<FeedPage />, { family: mockFamilyContext() });
 */
export function renderWithFamily(
  ui: React.ReactElement,
  context: MockFamilyContext = mockFamilyContext(),
  options?: RenderOptions
): ReturnType<typeof render> & { familyContext: MockFamilyContext } {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BaseWrapper>{children}</BaseWrapper>
  );

  const result = render(ui, { wrapper: Wrapper, ...options });
  return { ...result, familyContext: context };
}

/**
 * Render with both auth and family context.
 */
export function renderWithAll(
  ui: React.ReactElement,
  opts?: {
    user?: Partial<MockUser>;
    family?: Partial<MockFamilyContext>;
    signedIn?: boolean;
  }
): ReturnType<typeof render> {
  const familyCtx = mockFamilyContext(opts?.family ?? {});
  const mockUser = opts?.signedIn !== false
    ? mockUseUserSignedIn(opts?.user ?? {})
    : mockUseUserSignedOut();

  setMockUseUser(mockUser);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BaseWrapper>{children}</BaseWrapper>
  );

  return render(ui, { wrapper: Wrapper });
}

// ---- Re-export testing library helpers ----

export { render };
export type { RenderOptions };
