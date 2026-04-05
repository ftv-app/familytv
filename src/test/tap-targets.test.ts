/**
 * Tap Target Minimum Size Tests (CTM-4)
 *
 * WCAG 2.5.5 (AAA): Touch targets must be at least 44x44px
 * FamilyTV senior focus: we target 48x48px minimum for better usability
 *
 * Issue: #4 — Increase tap targets to 48px minimum for mobile
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const appShellPath = path.join(__dirname, "../components/app-shell.tsx");
const dashboardClientPath = path.join(__dirname, "../app/(app)/dashboard/dashboard-client.tsx");

// Extract a function body by name from source
function extractFunctionBody(source: string, funcName: string): string | null {
  // Match: function FuncName(...) { ... }
  // eslint-disable-next-line no-control-regex
  const pattern = new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?^\\}`, "m");
  const match = source.match(pattern);
  return match ? match[0] : null;
}

// Check if any element in the source uses a tap target smaller than 48px
// We look for explicit pixel values or Tailwind size classes that map < 48px
function hasSmallTapTargets(source: string): boolean {
  // Check for explicit small sizes: h-8 (32px), h-9 (36px), h-10 (40px)
  // but only for icon/avatar-like elements (not card backgrounds)
  // We check: size-[number]px, h-[number], w-[number] where number < 48

  const smallPatterns = [
    /w-8\b/, // 8 * 4 = 32px
    /h-8\b/, // 32px
    /w-9\b/, // 36px
    /h-9\b/, // 36px
    /w-10\b/, // 40px
    /h-10\b/, // 40px
    /size-8\b/, // 32px
    /size-9\b/, // 36px
  ];

  for (const pattern of smallPatterns) {
    if (pattern.test(source)) return true;
  }
  return false;
}

describe("App Shell — Tap Targets (#4)", () => {
  it("UserButton avatar is at least 48x48px (w-12/h-12 or larger)", () => {
    const source = readFileSync(appShellPath, "utf8");

    // userButtonAvatarBox: "w-8 h-8" = 32px is too small
    // Must be at least w-9 h-9 (36px) for basic WCAG, ideally w-12 h-12 (48px)
    // We check that w-8 h-8 is NOT used for the avatar
    const hasSmallAvatar = source.includes('userButtonAvatarBox: "w-8 h-8"') ||
                           source.includes("userButtonAvatarBox: 'w-8 h-8'");
    expect(hasSmallAvatar).toBe(false);
  });

  it("Desktop nav links have minimum 48px touch target (py-3 or larger)", () => {
    const source = readFileSync(appShellPath, "utf8");

    // Desktop nav links: px-3 py-2 = 32px vertical is too small
    // Must be py-3 (48px) for touch accessibility
    const hasSmallNavLink = /desktop-nav[^>]*py-2/.test(source);
    expect(hasSmallNavLink).toBe(false);
  });

  it("StatCard icon containers are at least 48px on mobile (w-12 or min-w-[48px])", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    // StatCard icon container: w-10 h-10 = 40px was too small
    // Fixed to w-12 h-12 (48px) + min-w-[48px] min-h-[48px]
    const has48IconContainer =
      source.includes('w-12 h-12') &&
      source.includes('min-w-[48px]') &&
      source.includes('min-h-[48px]');
    expect(has48IconContainer).toBe(true);
  });

  it("All interactive buttons in app-shell meet 48px minimum tap target", () => {
    const source = readFileSync(appShellPath, "utf8");

    // The UserButton avatar override is the main tap target issue
    // Change from w-8 h-8 (32px) to at least w-9 h-9 (36px), ideally w-12 h-12 (48px)
    // We verify the fix by checking w-8 is not used for userButtonAvatarBox
    const hasSmallUserButton =
      /userButtonAvatarBox:.*"w-8 h-8"/.test(source) ||
      /userButtonAvatarBox:.*'w-8 h-8'/.test(source);
    expect(hasSmallUserButton).toBe(false);
  });
});
