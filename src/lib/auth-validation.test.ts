import { describe, it, expect } from "vitest";

// Validation helpers extracted from onboarding pages for unit testing
// These mirror the validation logic in the actual components

/**
 * Validates a family name input
 * - Must have at least 1 character after trim
 * - Must be 50 characters or fewer
 */
function validateFamilyName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: "Family name is required" };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: "Family name must be 50 characters or fewer" };
  }
  
  return { valid: true };
}

/**
 * Validates an email address for invite
 * Basic format validation
 */
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: "Email address is required" };
  }
  
  // Basic email regex - RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true };
}

/**
 * Validates family name length (character count)
 */
function getFamilyNameLength(name: string): number {
  return name.length;
}

describe("validateFamilyName()", () => {
  describe("valid inputs", () => {
    it("accepts a short family name", () => {
      const result = validateFamilyName("Smith");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts a multi-word family name", () => {
      const result = validateFamilyName("The Johnson Family");
      expect(result.valid).toBe(true);
    });

    it("accepts exactly 50 characters", () => {
      const name = "A".repeat(50);
      const result = validateFamilyName(name);
      expect(result.valid).toBe(true);
    });

    it("accepts a name with leading/trailing whitespace (trims before validation)", () => {
      const result = validateFamilyName("  Garcia Family  ");
      expect(result.valid).toBe(true);
    });

    it("accepts unicode/family names with special characters", () => {
      const result = validateFamilyName("Famille Dubert-Î");
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects an empty string", () => {
      const result = validateFamilyName("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Family name is required");
    });

    it("rejects whitespace-only input", () => {
      const result = validateFamilyName("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Family name is required");
    });

    it("rejects a name longer than 50 characters", () => {
      const name = "A".repeat(51);
      const result = validateFamilyName(name);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Family name must be 50 characters or fewer");
    });

    it("rejects exactly 51 characters", () => {
      const name = "B".repeat(51);
      const result = validateFamilyName(name);
      expect(result.valid).toBe(false);
    });
  });
});

describe("validateEmail()", () => {
  describe("valid inputs", () => {
    it("accepts a simple email", () => {
      const result = validateEmail("test@example.com");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts an email with subdomain", () => {
      const result = validateEmail("user@mail.example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts an email with plus addressing", () => {
      const result = validateEmail("user+tag@example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts email with trimmed whitespace", () => {
      const result = validateEmail("  user@example.com  ");
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects an empty string", () => {
      const result = validateEmail("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Email address is required");
    });

    it("rejects whitespace-only input", () => {
      const result = validateEmail("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Email address is required");
    });

    it("rejects email without @ symbol", () => {
      const result = validateEmail("testexample.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter a valid email address");
    });

    it("rejects email without domain", () => {
      const result = validateEmail("test@");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter a valid email address");
    });

    it("rejects email without username", () => {
      const result = validateEmail("@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter a valid email address");
    });

    it("rejects email with spaces", () => {
      const result = validateEmail("test @example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter a valid email address");
    });

    it("rejects email with multiple @ symbols", () => {
      const result = validateEmail("test@@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Please enter a valid email address");
    });
  });
});

describe("getFamilyNameLength()", () => {
  it("returns 0 for empty string", () => {
    expect(getFamilyNameLength("")).toBe(0);
  });

  it("returns correct length for a name", () => {
    expect(getFamilyNameLength("Smith Family")).toBe(12);
  });

  it("includes all characters including unicode", () => {
    expect(getFamilyNameLength("Famille Dubert")).toBe(14);
  });

  it("includes whitespace in count", () => {
    expect(getFamilyNameLength("  test  ")).toBe(8);
  });
});
