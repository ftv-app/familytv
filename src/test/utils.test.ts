import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base active");
    });

    it("handles falsy values", () => {
      const result = cn("base", false && "hidden", undefined, null);
      expect(result).toBe("base");
    });

    it("handles array input", () => {
      const result = cn(["foo", "bar"]);
      expect(result).toBe("foo bar");
    });

    it("handles mixed input types", () => {
      const result = cn("foo", ["bar", "baz"], { qux: true });
      expect(result).toContain("foo");
      expect(result).toContain("bar");
      expect(result).toContain("baz");
      expect(result).toContain("qux");
    });

    it("handles empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("merges tailwind classes with conflicting prefixes", () => {
      // twMerge handles conflicting tailwind classes (e.g., "bg-red-500 bg-blue-500" → "bg-blue-500")
      const result = cn("bg-red-500 bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("handles objects with boolean values", () => {
      const result = cn("base", { active: true, disabled: false });
      expect(result).toContain("base");
      expect(result).toContain("active");
      expect(result).not.toContain("disabled");
    });
  });
});
