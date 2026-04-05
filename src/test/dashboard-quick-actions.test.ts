/**
 * Dashboard Quick Actions — Accessibility + UX Tests
 *
 * Issue #2 (P1): Quick Action Links need focus-visible indicators for keyboard navigation
 * Issue #7 (P2): Quick Actions need loading state to prevent double-taps
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const dashboardClientPath = path.join(
  __dirname,
  "../app/(app)/dashboard/dashboard-client.tsx"
);

describe("Dashboard Quick Actions — Focus Visibility (#2)", () => {
  it("QuickActionButton Link has focus-visible:outline-2 for keyboard navigation", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // The QuickActionButton returns a Link with focus-visible styling
    // Must have focus-visible:outline-2 to meet WCAG 2.4.7 (Focus Visible)
    const hasFocusVisible = source.includes("focus-visible:outline-2");
    expect(hasFocusVisible).toBe(true);
  });

  it("QuickActionButton uses Forest Green (#2D5A4A) for focus outline per design spec", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Design brief requires: Forest green outline (2px, offset 2px) for focus indicators
    // The color is #2D5A4A (or the slightly different #2D5A3D already used in app-shell)
    const hasForestGreenFocus =
      source.includes("focus-visible:outline-[#2D5A4A]") ||
      source.includes("focus-visible:outline-[#2D5A3D]");

    expect(hasForestGreenFocus).toBe(true);
  });
});

describe("Dashboard Quick Actions — Loading State (#7)", () => {
  it("QuickActionButton renders WarmSpinner during navigation state", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // WarmSpinner must be imported and used in QuickActionButton
    // to prevent double-tap issues for elderly users
    const hasWarmSpinner = source.includes("WarmSpinner");
    expect(hasWarmSpinner).toBe(true);
  });

  it("QuickActionButton has aria-busy during navigation", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // aria-busy="true" must be set during navigation to prevent double-taps
    const hasAriaBusy = source.includes("aria-busy");
    expect(hasAriaBusy).toBe(true);
  });

  it("QuickActionButton uses useRouter from next/navigation for navigation state", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Must use useRouter to detect navigation state
    const usesRouter = source.includes("useRouter");
    expect(usesRouter).toBe(true);
  });

  it("QuickActionButton has disabled={isNavigating} to prevent double-tap", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Double-tap prevention: disabled={isNavigating} on a <button>
    // This is the critical fix for elderly users who may double-tap Quick Actions
    const hasDisabledDuringNav = source.includes("disabled={isNavigating}");
    expect(hasDisabledDuringNav).toBe(true);
  });

  it("QuickActionButton uses onClick+router.push for programmatic navigation", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Must use onClick + router.push instead of <Link> to enable disabled state
    const usesOnClick = source.includes("onClick={handleClick}");
    const usesRouterPush = source.includes("router.push(href)");
    expect(usesOnClick).toBe(true);
    expect(usesRouterPush).toBe(true);
  });
});
