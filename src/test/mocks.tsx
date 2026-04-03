import { vi } from "vitest";
import React from "react";

// Define MockUser type inline (avoids import from non-existent factories file)
interface MockUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}

// Mock next/navigation
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const mockUseRouter = () => mockRouter;

export const mockUseSearchParams = () => new URLSearchParams();

// Mock Clerk user
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: "user_test123",
  firstName: "Test",
  lastName: "User",
  emailAddresses: [{ emailAddress: "test@example.com" }],
  ...overrides,
});

// Mock useUser hook
export const createMockUseUser = (user: MockUser | null = createMockUser()) => ({
  user,
  isLoaded: true,
  isSignedIn: !!user,
});

// Wrapper for rendering with providers
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
