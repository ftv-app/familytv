/**
 * CTM-39: Mobile nav polish + loading states
 *
 * Acceptance criteria:
 * - Hamburger icon: 48×48px minimum tap target ✓
 * - Active nav state clearly indicated for seniors ✓
 * - Quick Actions: loading state prevents double-tap (disable + spinner)
 * - Loading states match FamilyTV warmth (brand colors, not white spinner)
 * - All interactive elements have data-testid
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppShell } from "../app-shell";

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

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetTrigger: ({ children }: any) => <div data-testid="sheet-trigger">{children}</div>,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

describe("CTM-39: data-testid on interactive elements", () => {
  it("hamburger menu button has data-testid", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const hamburger = container.querySelector('[data-testid="hamburger-menu"]');
    expect(hamburger).toBeTruthy();
  });

  it("mobile nav items have data-testid", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const navItems = container.querySelectorAll('[data-testid^="nav-item-"]');
    expect(navItems.length).toBeGreaterThanOrEqual(4);
  });

  it("desktop nav items have data-testid", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const navItems = container.querySelectorAll('[data-testid^="desktop-nav-"]');
    expect(navItems.length).toBeGreaterThanOrEqual(4);
  });

  it("sign out button has data-testid", () => {
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const signOut = container.querySelector('[data-testid="sign-out-button"]');
    expect(signOut).toBeTruthy();
  });
});
