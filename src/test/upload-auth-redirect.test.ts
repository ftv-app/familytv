/**
 * CTM-49: Upload page auth redirect issue
 *
 * Issue: When Clerk's auth() throws (e.g., when accessed via curl without
 * session cookies), the handler was not catching the error properly and
 * would let it propagate instead of returning a 401 Unauthorized response.
 *
 * This test ensures that when auth() throws, we still get a proper 401 response.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { TEST_USER_ID } from "../__tests__/factories";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock Vercel Blob
vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

// Mock db - module level reference
const mockDb = {
  query: {
    familyMemberships: { findFirst: vi.fn() },
  },
};

vi.mock("@/db", () => ({
  db: mockDb,
  familyMemberships: {},
}));

async function getHandler() {
  const mod = await import("@/app/api/upload/route");
  return mod;
}

describe("CTM-49: Upload auth redirect issue", { testTimeout: 30000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when auth() returns null userId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when auth() throws (e.g., no session cookie via curl)", async () => {
    /**
     * This is the core CTM-49 issue:
     * When curl hits the server without session cookies, Clerk's auth() throws
     * instead of returning { userId: null }. The handler should catch this
     * error and return a 401 Unauthorized response, not propagate the error.
     */
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockImplementation(() => {
      throw new Error("Clerk: Cannot read property 'session' of undefined");
    });

    const handler = await getHandler();
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
    formData.append("filename", "test.png");
    formData.append("contentType", "image/png");
    formData.append("familyId", "fam_123");

    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    // The fix: should return 401 instead of throwing
    let didThrow = false;
    let res;
    try {
      res = await handler.POST(req);
    } catch (e) {
      didThrow = true;
    }

    expect(didThrow).toBe(false);
    expect(res?.status).toBe(401);
  });
});
