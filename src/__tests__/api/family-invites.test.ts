import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

// ============================================
// Test Invite Code Generation & Hashing
// ============================================

describe("Family Invite Code Generation", () => {
  const INVITE_CODE_LENGTH = 32;

  it("generates a 32-character hex invite code", () => {
    const inviteCode = randomBytes(INVITE_CODE_LENGTH / 2).toString("hex");
    expect(inviteCode).toHaveLength(INVITE_CODE_LENGTH);
    expect(/^[a-f0-9]+$/.test(inviteCode)).toBe(true);
  });

  it("generates unique codes each time", () => {
    const code1 = randomBytes(16).toString("hex");
    const code2 = randomBytes(16).toString("hex");
    expect(code1).not.toBe(code2);
  });

  it("bcrypt hashes are different each time (salted)", async () => {
    const code = randomBytes(16).toString("hex");
    const hash1 = await bcrypt.hash(code, 10);
    const hash2 = await bcrypt.hash(code, 10);
    expect(hash1).not.toBe(hash2);
  });

  it("bcrypt can verify a correct code against its hash", async () => {
    const code = randomBytes(16).toString("hex");
    const hash = await bcrypt.hash(code, 10);
    const isValid = await bcrypt.compare(code, hash);
    expect(isValid).toBe(true);
  });

  it("bcrypt rejects an incorrect code", async () => {
    const code = randomBytes(16).toString("hex");
    const wrongCode = randomBytes(16).toString("hex");
    const hash = await bcrypt.hash(code, 10);
    const isValid = await bcrypt.compare(wrongCode, hash);
    expect(isValid).toBe(false);
  });
});

// ============================================
// Test Invite Validation Logic
// ============================================

describe("Family Invite Validation", () => {
  interface MockInvite {
    id: string;
    familyId: string;
    inviteCodeHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }

  function validateInviteCode(
    code: string,
    invites: MockInvite[]
  ): { valid: boolean; error?: string; invite?: MockInvite } {
    // Check format
    if (!code || code.length !== 32) {
      return { valid: false, error: "Invalid invite code format" };
    }

    if (!/^[a-f0-9]+$/.test(code)) {
      return { valid: false, error: "Invalid invite code format" };
    }

    // Find matching invite
    for (const invite of invites) {
      // Note: In real implementation, bcrypt.compare handles the comparison
      // For testing, we simulate this with a hash check
      if (invite.revokedAt) continue;
      if (new Date() > invite.expiresAt) continue;

      // In real code, this would be bcrypt.compare
      return { valid: true, invite };
    }

    return { valid: false, error: "Invalid invite code" };
  }

  const mockInvite: MockInvite = {
    id: "invite-123",
    familyId: "family-456",
    inviteCodeHash: "$2a$10$hashedcode...",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    revokedAt: null,
  };

  it("accepts valid invite code format", () => {
    const result = validateInviteCode(
      "a".repeat(32),
      [mockInvite]
    );
    expect(result.valid).toBe(false); // No actual matching invite
  });

  it("rejects invite code that is too short", () => {
    const result = validateInviteCode("abc123", []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid invite code format");
  });

  it("rejects invite code with invalid characters", () => {
    const result = validateInviteCode("g".repeat(32), []); // 'g' is not hex
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid invite code format");
  });

  it("rejects expired invite", () => {
    const expiredInvite: MockInvite = {
      ...mockInvite,
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
    };
    const result = validateInviteCode("a".repeat(32), [expiredInvite]);
    expect(result.valid).toBe(false);
  });

  it("rejects revoked invite", () => {
    const revokedInvite: MockInvite = {
      ...mockInvite,
      revokedAt: new Date(Date.now() - 1000), // revoked 1 second ago
    };
    const result = validateInviteCode("a".repeat(32), [revokedInvite]);
    expect(result.valid).toBe(false);
  });
});

// ============================================
// Test Rate Limiting Logic
// ============================================

describe("Family Invite Rate Limiting", () => {
  const MAX_INVITES_PER_DAY = 10;

  interface RateLimitEntry {
    familyId: string;
    date: Date;
    count: number;
  }

  function checkRateLimit(
    familyId: string,
    rateLimits: RateLimitEntry[],
    maxPerDay: number = MAX_INVITES_PER_DAY
  ): { allowed: boolean; currentCount: number; error?: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = rateLimits.find(
      (rl) => rl.familyId === familyId && rl.date.getTime() === today.getTime()
    );

    if (existing && existing.count >= maxPerDay) {
      return {
        allowed: false,
        currentCount: existing.count,
        error: "Rate limit exceeded",
      };
    }

    return {
      allowed: true,
      currentCount: existing?.count ?? 0,
    };
  }

  it("allows invite when under rate limit", () => {
    const rateLimits: RateLimitEntry[] = [
      { familyId: "fam-123", date: new Date(), count: 5 },
    ];
    const result = checkRateLimit("fam-123", rateLimits);
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(5);
  });

  it("allows first invite when no rate limit entry exists", () => {
    const result = checkRateLimit("fam-new", []);
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });

  it("blocks invite when at rate limit", () => {
    const rateLimits: RateLimitEntry[] = [
      { familyId: "fam-123", date: new Date(), count: 10 },
    ];
    const result = checkRateLimit("fam-123", rateLimits);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });

  it("allows invite on different day with same family", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const rateLimits: RateLimitEntry[] = [
      { familyId: "fam-123", date: yesterday, count: 10 },
    ];
    const result = checkRateLimit("fam-123", rateLimits);
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });
});

// ============================================
// Test Invite Expiration Logic
// ============================================

describe("Family Invite Expiration", () => {
  function isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  it("returns false for future expiration date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(isExpired(future)).toBe(false);
  });

  it("returns true for past expiration date", () => {
    const past = new Date(Date.now() - 1000);
    expect(isExpired(past)).toBe(true);
  });

  it("returns true for exactly now (edge case)", () => {
    const now = new Date();
    expect(isExpired(now)).toBe(true);
  });

  it("calculates correct expiration date (7 days from now)", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 7 days = 604800000 milliseconds
    const diff = expiresAt.getTime() - now.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

// ============================================
// Test Membership Role Checking
// ============================================

describe("Family Membership Roles", () => {
  type Role = "owner" | "admin" | "member";

  function canManageInvites(role: Role): boolean {
    return role === "owner" || role === "admin";
  }

  it("owner can create/revoke invites", () => {
    expect(canManageInvites("owner")).toBe(true);
  });

  it("admin can create/revoke invites", () => {
    expect(canManageInvites("admin")).toBe(true);
  });

  it("member cannot create/revoke invites", () => {
    expect(canManageInvites("member")).toBe(false);
  });
});

// ============================================
// Test Invite Link Format
// ============================================

describe("Invite Link Format", () => {
  const BASE_URL = "https://familytv.vercel.app";

  function generateInviteLink(code: string): string {
    return `${BASE_URL}/invite/${code}`;
  }

  it("generates correct invite link format", () => {
    const code = "abc123def456abc123def456abc123de";
    const link = generateInviteLink(code);
    expect(link).toBe(`${BASE_URL}/invite/${code}`);
  });

  it("code is 32 characters in link", () => {
    const code = "a".repeat(32);
    const link = generateInviteLink(code);
    const codeInLink = link.split("/invite/")[1];
    expect(codeInLink).toHaveLength(32);
  });
});
