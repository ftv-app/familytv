import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names with clsx", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("handles tailwind-merge deduplication", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500"); // last wins
  });

  it("handles conditional classes", () => {
    const isActive = true;
    expect(cn("text-gray-900", isActive && "bg-primary")).toBe("text-gray-900 bg-primary");
    expect(cn("text-gray-900", false && "bg-primary")).toBe("text-gray-900");
  });

  it("handles undefined and null", () => {
    expect(cn("text-gray-900", undefined, null, "bg-white")).toBe("text-gray-900 bg-white");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});
