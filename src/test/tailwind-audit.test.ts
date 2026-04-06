/**
 * Tailwind Theme Audit — Focus Ring Color Consistency (#12)
 *
 * Verifies:
 * - globals.css and brand.css use the same focus ring hex color (#2D5A4A per CTM-221)
 * - dashboard-client.tsx FOREST_GREEN constant matches its focus-visible usage
 * - No conflicting focus ring hex values across the design system
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FOREST_GREEN_SPEC = "#2D5A4A"; // CTM-221 design spec

describe("#12 Tailwind theme audit — focus ring color consistency", () => {
  it("globals.css and brand.css use the same focus ring hex color", () => {
    const globalsCss = fs.readFileSync(
      path.join(__dirname, "../app/globals.css"),
      "utf-8"
    );
    const brandCss = fs.readFileSync(
      path.join(__dirname, "../app/brand.css"),
      "utf-8"
    );

    // Extract focus-visible hex colors from both files
    const globalsMatch = globalsCss.match(
      /\*:focus-visible\s*\{[^}]*outline:\s*2px\s*solid\s*(#[0-9A-Fa-f]{6})/
    );
    const brandMatch = brandCss.match(
      /\*:focus-visible\s*\{[^}]*outline:\s*2px\s*solid\s*(#[0-9A-Fa-f]{6})/
    );

    const globalsColor = globalsMatch ? globalsMatch[1] : null;
    const brandColor = brandMatch ? brandMatch[1] : null;

    expect(globalsColor).not.toBeNull();
    expect(brandColor).not.toBeNull();
    expect(globalsColor).toBe(
      brandColor,
      `globals.css focus ring (${globalsColor}) must match brand.css (${brandColor})`
    );
  });

  it("focus ring color matches CTM-221 spec (#2D5A4A)", () => {
    const globalsCss = fs.readFileSync(
      path.join(__dirname, "../app/globals.css"),
      "utf-8"
    );
    const brandCss = fs.readFileSync(
      path.join(__dirname, "../app/brand.css"),
      "utf-8"
    );

    // Both files must use #2D5A4A for focus-visible outline
    const globalsMatch = globalsCss.match(
      /\*:focus-visible\s*\{[^}]*outline:\s*2px\s*solid\s*(#[0-9A-Fa-f]{6})/
    );
    const brandMatch = brandCss.match(
      /\*:focus-visible\s*\{[^}]*outline:\s*2px\s*solid\s*(#[0-9A-Fa-f]{6})/
    );

    const globalsColor = globalsMatch ? globalsMatch[1] : null;
    const brandColor = brandMatch ? brandMatch[1] : null;

    expect(globalsColor).toBe(
      FOREST_GREEN_SPEC,
      `globals.css must use #2D5A4A (got ${globalsColor})`
    );
    expect(brandColor).toBe(
      FOREST_GREEN_SPEC,
      `brand.css must use #2D5A4A (got ${brandColor})`
    );
  });

  it("dashboard FOREST_GREEN constant matches its focus-visible usage", () => {
    const dashboardClient = fs.readFileSync(
      path.join(__dirname, "../app/(app)/dashboard/dashboard-client.tsx"),
      "utf-8"
    );

    // The constant says FOREST_GREEN = "#2D5A4A"
    // But the focus-visible class must use the SAME color
    const constMatch = dashboardClient.match(
      /FOREST_GREEN\s*=\s*"(#[0-9A-Fa-f]{6})"/
    );
    const focusMatch = dashboardClient.match(
      /focus-visible:outline-\[(#[0-9A-Fa-f]{6})\]/
    );

    expect(constMatch).not.toBeNull();
    expect(focusMatch).not.toBeNull();
    expect(constMatch[1]).toBe(
      focusMatch[1],
      `FOREST_GREEN constant (${constMatch[1]}) must match focus-visible usage (${focusMatch[1]})`
    );
    expect(constMatch[1]).toBe(
      FOREST_GREEN_SPEC,
      `dashboard FOREST_GREEN must be #2D5A4A per CTM-221`
    );
  });
});
