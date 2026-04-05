/**
 * CTM-11: ARIA labels + screen reader semantic structure
 *
 * Accessibility audit item from familytv/design/dashboard-ux-audit.md:
 * - P3 issue #11: StatCard icons need aria-hidden="true" (decorative)
 * - P3 issue #12: Nav items need aria-current="page" on active state
 * - Dashboard family selector: aria-label on DropdownMenuTrigger
 *
 * These tests verify WCAG 1.3.1 (Info and Relationships) compliance.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppShell } from "./app-shell";

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

describe("CTM-11: aria-current on active nav items", () => {
  it("desktop nav active item has aria-current='page' for screen reader users", () => {
    // Screen reader users cannot see color changes. aria-current="page" announces
    // which nav item is currently active so users know where they are.
    // Use data-testid to scope specifically to desktop nav links (not mobile nav).
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const desktopNavLinks = container.querySelectorAll("[data-testid^='desktop-nav-']");
    expect(desktopNavLinks.length).toBeGreaterThan(0);
    const activeDesktopLinks = Array.from(desktopNavLinks).filter(
      (link) => link.getAttribute("aria-current") === "page"
    );
    // Exactly 1 desktop nav item should be active (pathname is /app)
    expect(activeDesktopLinks.length).toBe(1);
    const activeLink = activeDesktopLinks[0] as HTMLAnchorElement;
    expect(activeLink.getAttribute("href")).toBe("/app");
  });

  it("desktop nav inactive items do NOT have aria-current", () => {
    // Only the active page should have aria-current; others return null
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const familyLink = container.querySelector(
      "[data-testid='desktop-nav-family']"
    ) as HTMLAnchorElement;
    expect(familyLink).toBeTruthy();
    expect(familyLink.getAttribute("aria-current")).toBeNull();
  });

  it("desktop nav inactive items have no aria-current attribute", () => {
    // Covers desktop nav items for /app/family, /app/calendar, /app/settings
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const inactiveLinks = container.querySelectorAll(
      "[data-testid='desktop-nav-family'], [data-testid='desktop-nav-calendar'], [data-testid='desktop-nav-settings']"
    );
    inactiveLinks.forEach((link) => {
      expect(link.getAttribute("aria-current")).toBeNull();
    });
  });
});

describe("CTM-11: decorative icons have aria-hidden", () => {
  it("nav icons in desktop nav are aria-hidden (decorative)", () => {
    // Nav item icons are purely decorative — they convey visual state only.
    // Screen readers should skip them and rely on the link text instead.
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const desktopNavLinks = container.querySelectorAll("[data-testid^='desktop-nav-']");
    expect(desktopNavLinks.length).toBeGreaterThan(0);
    desktopNavLinks.forEach((link) => {
      const icons = link.querySelectorAll("svg");
      icons.forEach((icon) => {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
      });
    });
  });

  it("hamburger menu icon is aria-hidden (decorative)", () => {
    // The hamburger/menu icon is visual-only; screen readers use the button label
    const { container } = render(<AppShell><div>Test</div></AppShell>);
    const hamburger = container.querySelector('[data-testid="sheet-trigger"]');
    expect(hamburger).toBeTruthy();
    const icons = hamburger!.querySelectorAll("svg");
    icons.forEach((icon) => {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
