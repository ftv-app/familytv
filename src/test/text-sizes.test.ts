/**
 * Text Size Tests for Senior Accessibility (CTM-3)
 *
 * Issue: #3 — Increase text sizes for older users (text-xs at 12px too small)
 * WCAG 1.4.4: Text must be resizable up to 200% without loss of content/functionality
 * Design brief Section 3.3: Body text 15-16px minimum, labels 13-14px
 *
 * Target: text-xs (12px) should be text-sm (14px) minimum for readability
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const dashboardPath = path.join(__dirname, "../app/(app)/dashboard/dashboard-client.tsx");
const appShellPath = path.join(__dirname, "../components/app-shell.tsx");
const activityFeedPath = path.join(__dirname, "../components/feed/ActivityFeed.tsx");

describe("Text Sizes — Senior Accessibility (#3)", () => {
  it("dashboard-client: PresenceDot avatar initial should be text-sm (14px), not text-xs (12px)", () => {
    const source = readFileSync(dashboardPath, "utf8");
    // PresenceDot uses "text-xs font-semibold" in avatar circle — too small for seniors
    // Avatar initial should be at least text-sm (14px)
    const hasSmallAvatarText = /PresenceDot[^}]+text-xs font-semibold/.test(source);
    expect(hasSmallAvatarText).toBe(false);
  });

  it("dashboard-client: StatCard sublabels should be text-sm (14px) not text-xs (12px)", () => {
    const source = readFileSync(dashboardPath, "utf8");
    // The StatCard component passes sublabel prop — it should render at text-sm minimum
    // Check the component uses text-sm or larger for all label text
    // If sublabel prop renders with text-xs, that's a failure
    const hasSmallStatSublabel = source.includes("text-xs") &&
      /sublabel[^)]*\)/.test(source);
    // More specific: look for text-xs usage that would affect readable labels
    const lines = source.split("\n");
    const textXsLines = lines.filter(l => l.includes("text-xs") && !l.includes("//"));
    // No text-xs should appear in dashboard content areas
    expect(textXsLines.length).toBe(0);
  });

  it("app-shell: Breadcrumb/Sidebar text should be text-sm minimum (no text-xs in nav)", () => {
    const source = readFileSync(appShellPath, "utf8");
    // Nav items should not use text-xs — that's 12px, too small for seniors
    // Desktop nav links use text-sm already, check no text-xs snuck in
    const navSection = source.substring(source.indexOf("nav className"));
    const hasSmallNavText = navSection.includes("text-xs");
    expect(hasSmallNavText).toBe(false);
  });

  it("ActivityFeed: event date timestamp should be text-sm (14px) minimum, not text-xs (12px)", () => {
    // WCAG 1.4.4 + ticket #3: event dates are readable metadata
    // Must be at least text-sm (14px) for senior accessibility
    const source = readFileSync(activityFeedPath, "utf8");
    // Check for text-xs in event date rendering — the <p> containing Clock icon
    const hasSmallEventDate = /className="text-xs flex items-center gap-1"/.test(source);
    expect(hasSmallEventDate).toBe(false);
  });

  it("ActivityFeed: card timestamp (<time>) should be text-sm (14px) minimum, not text-xs (12px)", () => {
    // The <time> element in ActivityFeed cards must be at least text-sm (14px)
    // 12px timestamps are too small for seniors per WCAG 1.4.4
    const source = readFileSync(activityFeedPath, "utf8");
    // Find the <time ... className="text-xs block"> pattern used for timestamps
    const hasSmallTime = /<time[^>]*className="text-xs/.test(source);
    expect(hasSmallTime).toBe(false);
  });

  it("dashboard-client: QuickActionButton descriptions should be text-base (16px) for readability", () => {
    // Ticket #3: ActionButton descriptions should be text-base (16px) per design brief
    // Body text should be 15-16px minimum for senior legibility
    const source = readFileSync(dashboardPath, "utf8");
    // QuickActionButton renders {description} in a <span> — must be text-base or larger
    // The span with text-sm that contains {description} is the description element
    const hasSmallDesc = /\{description\}[^<]*<\/span>\s*<\/div>/.test(source) &&
      /text-sm[^\n]*<span/.test(source);
    // More direct: check that in QuickActionButton, the description span uses text-sm
    // by looking at the rendered output section of the file
    const quickActionSection = source.substring(source.indexOf("function QuickActionButton"));
    const descSpanPattern = /<span[^>]*text-sm[^>]*>\s*\{description\}/;
    expect(descSpanPattern.test(quickActionSection)).toBe(false);
  });
});
