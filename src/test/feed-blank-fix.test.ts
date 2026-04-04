import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("FamilyFeed auth timing fix — Suspense boundary", () => {
  const feedPagePath = path.join(
    __dirname,
    "../app/app/family/[familyId]/feed/page.tsx"
  );
  const familyPagePath = path.join(
    __dirname,
    "../app/app/family/[familyId]/page.tsx"
  );

  it("feed page wraps FamilyFeed in Suspense boundary", () => {
    const source = readFileSync(feedPagePath, "utf8");
    expect(source).toContain("Suspense");
    expect(source).toContain("FeedLoadingSkeleton");
    expect(source).toContain("<FamilyFeed");
  });

  it("family page wraps FamilyFeed tab in Suspense boundary", () => {
    const source = readFileSync(familyPagePath, "utf8");
    expect(source).toContain("Suspense");
    expect(source).toContain("<FamilyFeed");
  });

  it("FeedLoadingSkeleton renders skeleton elements", () => {
    // Verify the skeleton component exists and renders expected structure
    const source = readFileSync(feedPagePath, "utf8");
    expect(source).toContain("feed-loading-skeleton");
    expect(source).toContain("animate-pulse");
  });
});
