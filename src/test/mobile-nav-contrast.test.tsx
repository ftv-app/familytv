/**
 * CTM-6: WCAG contrast for mobile hamburger nav (seniors)
 *
 * Inactive nav item text (#A8A8B0) on dark sheet (#1A1A1E) = ~3.5:1
 * WCAG AA requires 4.5:1 for normal text. Fix: raise to #BBBBCC or similar.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppShell } from "@/components/app-shell";

// WCAG 2.1 relative luminance
function luminance(hex: string): number {
  const rgb = hex.replace("#", "").match(/[A-Fa-f0-9]{2}/g)?.map((x) => parseInt(x, 16) / 255) ?? [];
  const [r, g, b] = rgb.map((c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

vi.mock("@clerk/nextjs", async () => {
  return {
    useAuth: () => ({ isLoaded: true, userId: "user_123", has: vi.fn() }),
    SignOutButton: ({ children }: { children: React.ReactNode }) => (
      <button>{children}</button>
    ),
    UserButton: () => <div data-testid="user-button">User</div>,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

vi.mock("@/components/ui/sheet", () => {
  const React = require("react");
  return {
    Sheet: ({ children, open }: any) => (
      <div data-testid="sheet" data-open={open}>{children}</div>
    ),
    SheetTrigger: ({ children }: any) => {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button data-testid="open-sheet" onClick={() => setOpen(true)}>Open</button>
          {open && children}
        </div>
      );
    },
    SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
    SheetHeader: ({ children }: any) => <div>{children}</div>,
    SheetTitle: ({ children }: any) => <div>{children}</div>,
  };
});

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return rgb;
  const [, r, g, b] = m;
  return "#" + [r, g, b].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

describe("CTM-6: Mobile hamburger nav WCAG contrast (seniors)", () => {
  // Nav items have transparent background — they sit on the page bg (#0D0D0F or #1A1A1E)
  // NOT the sheet bg (#1A1A1E). Contrast must be checked against what text sits on.

  it("inactive mobile nav item text meets 4.5:1 on dark page bg (#0D0D0F)", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    // Mobile nav has Dashboard, Family, Albums, Calendar — no Settings
    const navItem = container.querySelector('[data-testid="nav-item-dashboard"]') as HTMLElement;
    expect(navItem).toBeTruthy();
    const fg = rgbToHex(getComputedStyle(navItem).color);
    // Contrast against page bg (#0D0D0F)
    const ratio = contrastRatio(fg, "#0D0D0F");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("sign out button text meets 4.5:1 on dark page bg", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const openBtn = container.querySelector('[data-testid="open-sheet"]') as HTMLButtonElement;
    openBtn?.click();
    const signOut = container.querySelector('[data-testid="sign-out-button"]') as HTMLButtonElement;
    expect(signOut).toBeTruthy();
    const fg = rgbToHex(getComputedStyle(signOut).color);
    // Sign out button bg is transparent — sits on #0D0D0F page bg
    const ratio = contrastRatio(fg, "#0D0D0F");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("desktop inactive nav text meets 4.5:1 on dark page bg (#0D0D0F)", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const navItem = container.querySelector('[data-testid="desktop-nav-settings"]') as HTMLElement;
    expect(navItem).toBeTruthy();
    const fg = rgbToHex(getComputedStyle(navItem).color);
    const ratio = contrastRatio(fg, "#0D0D0F");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
