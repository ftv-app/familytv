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
const albumFormPath = path.join(__dirname, "../components/album-form.tsx");
const appShellPath = path.join(__dirname, "../components/app-shell.tsx");

describe("Dashboard Quick Actions — Focus Visibility (#2)", () => {
  it("QuickActionButton button has focus-visible:outline-2 for keyboard navigation", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // The QuickActionButton returns a button with focus-visible styling
    // Must have focus-visible:outline-2 to meet WCAG 2.4.7 (Focus Visible)
    const hasFocusVisible = source.includes("focus-visible:outline-2");
    expect(hasFocusVisible).toBe(true);
  });

  it("QuickActionButton uses Forest Green (#2D5A3D) for focus outline per design spec", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // Design brief requires: Forest green outline (2px, offset 2px) for focus indicators
    // The color is #2D5A4A (or the slightly different #2D5A3D already used in app-shell)
    const hasForestGreenFocus =
      source.includes("focus-visible:outline-[#2D5A4A]") ||
      source.includes("focus-visible:outline-[#2D5A3D]");

    expect(hasForestGreenFocus).toBe(true);
  });
});

describe("App-wide Focus Indicators — Keyboard Navigation (#2)", () => {
  it("Album form inputs use focus-visible (not focus:) to avoid mouse-click rings", () => {
    const source = readFileSync(albumFormPath, "utf8");

    // album-form inputs use focus:border-[#7c2d2d] which shows ring on EVERY click
    // Must use focus-visible:border-[#7c2d2d] so ring only shows for keyboard users
    // WCAG 2.4.7: visible focus only required for keyboard navigation
    const hasWrongFocus = /className.*focus:border-|focus:ring-/.test(source);
    const hasFocusVisible = /focus-visible:border-|focus-visible:ring-/.test(source);

    // Either the wrong pattern is gone, or the right pattern is present
    expect(hasWrongFocus && !hasFocusVisible).toBe(false);
  });

  it("App shell mobile nav items have focus-visible outline", () => {
    const source = readFileSync(appShellPath, "utf8");

    // Mobile nav items (sheet nav) must have focus-visible styling for keyboard users
    const hasFocusVisibleNav =
      source.includes("focus-visible:outline-2") ||
      source.includes("focus-visible:outline-[#2D5A3D]");
    expect(hasFocusVisibleNav).toBe(true);
  });

  it("Desktop nav links have focus-visible outline", () => {
    const source = readFileSync(appShellPath, "utf8");

    // Desktop nav links must have focus-visible:outline-2 for WCAG 2.4.7
    const hasDesktopNavFocusVisible =
      source.includes("desktop-nav") && source.includes("focus-visible:outline");
    expect(hasDesktopNavFocusVisible).toBe(true);
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
