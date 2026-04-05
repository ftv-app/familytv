/**
 * Dashboard Multi-Family Context — Accessibility + UX Tests
 *
 * Issue #5 (P2): Make active family context more prominent for multi-family users
 *
 * The family initial avatar must appear next to the Stats section heading,
 * providing an immediate visual anchor for multi-family users.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const dashboardClientPath = path.join(
  __dirname,
  "../app/(app)/dashboard/dashboard-client.tsx"
);

describe("Family Context — Stats Section Avatar (#5)", () => {
  it("Stats section heading has a family initial avatar for multi-family anchoring", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Extract the Stats section (between "Stats Row" comment and the closing </div>)
    const statsSectionMatch = source.match(
      /Stats Row[\s\S]{0,800}?StatCard[\s\S]{0,200}?<\/div>\s*\) \?:/
    );
    const statsSection = statsSectionMatch ? statsSectionMatch[0] : "";

    // The family initial avatar must appear within/near the Stats section heading
    // Requirements:
    // 1. Extracts first letter of family name (channelName or selectedFamily?.name)
    // 2. Uses rounded-full pill/badge shape
    // 3. Uses BROADCAST_GOLD background or border
    // 4. Appears in the Stats section (within 200 chars of StatCard usage)
    const hasFamilyAvatarInStats =
      statsSection.includes("charAt(0).toUpperCase()") &&
      statsSection.includes("rounded-full") &&
      (statsSection.includes("BROADCAST_GOLD") || statsSection.includes("#D4AF37"));

    expect(hasFamilyAvatarInStats).toBe(true);
  });

  it("Family initial avatar displays the selected family name's first letter", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // The avatar must use channelName or selectedFamily?.name for the initial,
    // not a hardcoded letter. This ensures it updates when the family changes.
    const usesFamilyNameForInitial =
      (source.includes("channelName") || source.includes("selectedFamily")) &&
      source.includes("charAt(0).toUpperCase()");

    expect(usesFamilyNameForInitial).toBe(true);
  });

  it("Family avatar badge is semi-transparent gold (rgba format) for subtle visual weight", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // The gold badge should use rgba for semi-transparency so it doesn't
    // compete with the stats cards themselves.
    // Pattern: rgba(...) with gold color used for the family avatar section
    const hasRgbaGold =
      /rgba\([^)]*212[^)]*175[^)]*55/i.test(source) || // rgba(212,175,55,...)
        /rgba\([^)]*D4AF37/i.test(source); // rgba(...D4AF37...)

    expect(hasRgbaGold).toBe(true);
  });
});
