/**
 * API route test helpers for FamilyTV.
 *
 * Provides utilities for:
 * - Mocking Clerk auth in API routes
 * - Creating test DB rows (use factories from @/test/fixtures)
 * - Calling API routes with auth headers (fetch-based, supertest-style)
 * - Asserting on API responses
 *
 * Usage:
 *   import { createMockAuth, apiFetch, expectStatus } from '@/test/api-helpers';
 *
 *   // Set up authenticated user context
 *   createMockAuth(userId);
 *
 *   // Make an authenticated API request
 *   const res = await apiFetch('/api/posts?familyId=xxx');
 *   expectStatus(res, 200);
 */

import { factories } from "@/test/fixtures";

// ---- Auth mocking ----

/**
 * Mock Clerk's `auth()` to return a specific userId.
 * Use in `beforeEach` or inline with the handler.
 *
 * @example
 * beforeEach(() => createMockAuth('user_abc123'));
 * afterEach(() => restoreAuth());
 */
export function createMockAuth(userId: string | null): () => void {
  // We dynamically mock the module by setting process.env
  // The actual auth() call reads from Clerk's server-side utils.
  // Since the app uses @clerk/nextjs/server's auth(), we patch it at the import level.
  let restore: (() => void) | null = null;

  // Attempt module-level patch via vi.mock replacement approach
  // For real isolation, prefer integration tests with a test Clerk instance.
  // Here we provide a function that test authors call inside their mocks.
  if (typeof globalThis !== "undefined") {
    // Store on global for tests to consume
    (globalThis as Record<string, unknown>).__FAMILYTV_TEST_USER_ID__ = userId;
  }

  return () => {
    if (typeof globalThis !== "undefined") {
      delete (globalThis as Record<string, unknown>).__FAMILYTV_TEST_USER_ID__;
    }
  };
}

/**
 * Returns the test user ID set by `createMockAuth`.
 * Returns null if no mock auth has been set.
 */
export function getMockUserId(): string | null {
  return (globalThis as Record<string, unknown>).__FAMILYTV_TEST_USER_ID__ as string | null ?? null;
}

// ---- API route fetch helper ----

export interface ApiFetchOptions extends RequestInit {
  /**
   * Automatically include mock auth headers (x-test-user-id).
   * Requires the API route handler to check this header in tests.
   * Set to false when testing unauthenticated routes.
   * @default true
   */
  auth?: boolean;
  /**
   * Override the userId for auth. Uses mock auth if not provided.
   */
  userId?: string;
}

const TEST_AUTH_HEADER = "x-test-user-id";

/**
 * Makes a fetch request to a Next.js API route with optional auth.
 * Works for both absolute URLs (http://localhost:3000) and
 * relative paths (which are resolved against NEXT_PUBLIC_APP_URL or http://localhost:3000).
 *
 * @example
 * const res = await apiFetch('/api/posts?familyId=xxx', { method: 'POST', body: JSON.stringify({ ... }) });
 */
export async function apiFetch(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { auth = true, userId, ...fetchOptions } = options;

  let url: string;
  if (typeof input === "string" || input instanceof URL) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const path = input instanceof URL ? input.pathname : input;
    const search = input instanceof URL ? input.search : "";
    url = `${base}${path}${search}`;
  } else {
    url = input.url;
  }

  const headers = new Headers(fetchOptions.headers);

  if (auth) {
    const uid = userId ?? getMockUserId() ?? "user_unauthenticated";
    headers.set(TEST_AUTH_HEADER, uid);
  }

  // Serialize body if it's an object
  let body = fetchOptions.body;
  if (body !== undefined && !(body instanceof FormData) && !(body instanceof URLSearchParams) && typeof body === "object") {
    body = JSON.stringify(body);
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
    body,
  });
}

// ---- Response assertions (no external deps) ----

/**
 * Assert that a Response has the expected status code.
 * Throws a descriptive error if it doesn't match.
 *
 * @example
 * expectStatus(res, 201);
 */
export function expectStatus(res: Response, expected: number): void {
  if (res.status !== expected) {
    const body = res.headers.get("content-type")?.includes("json")
      ? res.text().catch(() => "")
      : "";
    throw new Error(
      `Expected HTTP ${expected}, got HTTP ${res.status}\nBody: ${body}`
    );
  }
}

/**
 * Parse response body as JSON. Throws if not JSON.
 */
export async function jsonBody<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON response, got:\n${text}`);
  }
}

/**
 * Assert that a JSON response body contains the expected key-value pairs.
 * Partial match (expects at least the provided keys to match).
 *
 * @example
 * const body = await jsonBody<{posts: unknown[]}>(res);
 * expectJson(body, { posts: expect.any(Array) });
 */
export function expectJson<T extends object>(
  actual: T,
  expected: Partial<Record<keyof T, unknown>>
): void {
  for (const [key, value] of Object.entries(expected)) {
    if (key in actual === false) {
      throw new Error(`Expected key "${key}" in response body`);
    }
    if (value !== actual[key as keyof T]) {
      throw new Error(
        `Expected body.${key} = ${JSON.stringify(value)}, got ${JSON.stringify(actual[key as keyof T])}`
      );
    }
  }
}

// ---- Test DB row helpers ----
// These require a real DB connection (use in integration tests with a test DB).

/**
 * Insert a user membership row for a given family + user.
 * Returns the inserted membership row.
 *
 * NOTE: This inserts directly into the DB. Use only in integration tests
 * that have DATABASE_URL set to a test database.
 *
 * @example
 * const membership = await insertMembership(db, { familyId: family.id, userId: user.id });
 */
export async function insertMembership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  data: { familyId: string; userId: string; role?: "owner" | "member" }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { familyMemberships } = await import("@/db/schema");
  const row = factories.membership(data);
  await db.insert(familyMemberships).values(row);
  return row;
}

/**
 * Insert a family row. Returns the inserted family row.
 */
export async function insertFamily(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Partial<Parameters<typeof factories.family>[0]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { families } = await import("@/db/schema");
  const row = factories.family(data);
  await db.insert(families).values(row);
  return row;
}

/**
 * Insert a post row. Returns the inserted post row.
 */
export async function insertPost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Partial<Parameters<typeof factories.post>[0]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { posts } = await import("@/db/schema");
  const row = factories.post(data);
  await db.insert(posts).values(row);
  return row;
}
