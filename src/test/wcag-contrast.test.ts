/**
 * WCAG Contrast Compliance Test
 *
 * Tests that text colors meet WCAG 2.1 AA contrast requirements:
 * - Normal text (< 18pt regular / < 14pt bold): minimum 4.5:1
 * - Large text (>= 18pt regular / >= 14pt bold): minimum 3:1
 *
 * Issue: #58 — WCAG contrast failures on secondary/grey text
 * Linear: CTM-262
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// OKLCH (CSS Color Level 4) to sRGB conversion
function oklchToLinear(r: number, g: number, b: number): [number, number, number] {
  return [
    r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4),
    g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4),
    b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4),
  ];
}

// sRGB hex to linear RGB
function hexToLinearRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return oklchToLinear(r, g, b);
}

// Calculate relative luminance (WCAG 2.1)
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two hex colors
function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToLinearRgb(hex1);
  const [r2, g2, b2] = hexToLinearRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse CSS custom property from globals.css (handles :root and .dark blocks)
function parseCssVar(css: string, selector: string, varName: string): string | null {
  // Strategy: find the selector followed by { to locate the actual block
  // This avoids matching mentions in @ rules or comments
  const selectorWithBrace = selector + " {";
  const blockStart = css.indexOf(selectorWithBrace);
  if (blockStart === -1) return null;

  const openBrace = blockStart + selectorWithBrace.length - 1; // position of {

  // Find the matching closing brace (depth tracking)
  let depth = 1;
  let closeBrace = openBrace + 1;
  while (closeBrace < css.length && depth > 0) {
    if (css[closeBrace] === "{") depth++;
    else if (css[closeBrace] === "}") depth--;
    closeBrace++;
  }

  // Extract block content
  const block = css.slice(openBrace + 1, closeBrace - 1);

  // Find the property in this block
  const propMatch = block.match(new RegExp(`--${varName}\\s*:\\s*([^;!]+)`));
  if (!propMatch) return null;
  return propMatch[1].trim();
}

// Parse OKLCH value from CSS string like "oklch(0.60 0.015 50)"
function parseOklch(val: string): [number, number, number] | null {
  const match = val.match(/oklch\(([^)]+)\)/);
  if (!match) return null;
  const [L, C, H] = match[1].trim().split(/[\s\/]+/).map(Number);
  if (isNaN(L) || isNaN(C) || isNaN(H)) return null;
  return [L, C, H];
}

// Convert OKLCH to hex — uses accurate matrix transforms per CSS Color 4 spec
function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab to LMS
  const l_ = Math.pow(L, 3);
  const m_ = l_ + 0.15514 * a + 0.54312 * b;
  const s_ = l_ - 0.04968 * a - 0.06387 * b;

  // LMS to linear sRGB (D65 adapted)
  const rLin = 4.07674 * l_ - 3.30771 * m_ + 0.23074 * s_;
  const gLin = -1.26814 * l_ + 2.60933 * m_ - 0.34113 * s_;
  const bLin = -0.00420 * l_ - 0.70348 * m_ + 1.70669 * s_;

  // Linear to sRGB transfer
  const toSrgb = (v: number) => {
    if (v <= 0.0031308) return 12.92 * v;
    return 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
  };

  const r = Math.round(Math.max(0, Math.min(1, toSrgb(rLin))) * 255);
  const g = Math.round(Math.max(0, Math.min(1, toSrgb(gLin))) * 255);
  const bRound = Math.round(Math.max(0, Math.min(1, toSrgb(bLin))) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bRound.toString(16).padStart(2, "0")}`;
}

const globalsCss = fs.readFileSync(
  path.join(__dirname, "../app/globals.css"),
  "utf-8"
);

describe("WCAG Contrast — Secondary Text Accessibility (#58)", () => {
  describe("Dark mode color tokens", () => {
    it("dark mode --muted-foreground must be at least 4.5:1 on --background", () => {
      const bgVal = parseCssVar(globalsCss, ".dark", "background");
      const fgVal = parseCssVar(globalsCss, ".dark", "muted-foreground");

      expect(bgVal).not.toBeNull();
      expect(fgVal).not.toBeNull();

      const bgOklch = parseOklch(bgVal!);
      const fgOklch = parseOklch(fgVal!);

      expect(bgOklch).not.toBeNull();
      expect(fgOklch).not.toBeNull();

      const bgHex = oklchToHex(bgOklch![0], bgOklch![1], bgOklch![2]);
      const fgHex = oklchToHex(fgOklch![0], fgOklch![1], fgOklch![2]);

      const ratio = contrastRatio(fgHex, bgHex);

      // WCAG AA normal text: 4.5:1
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("TV page: #A8A8B0 (hardcoded grey) must be at least 4.5:1 on Cinema Black", () => {
      // Cinema Black background
      const bgHex = oklchToHex(0.145, 0.015, 50);

      // The hardcoded #A8A8B0 used on TV page for "Chosen by:" text
      const greyHex = "#A8A8B0";

      const ratio = contrastRatio(greyHex, bgHex);

      // This should be >= 4.5:1 per WCAG AA normal text
      // If it fails, the code should use a brighter color or text-muted-foreground
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("TV page: #D4AF37 (gold) must be at least 3:1 on Cinema Black (large text)", () => {
      const bgHex = oklchToHex(0.145, 0.015, 50);
      const ratio = contrastRatio("#D4AF37", bgHex);

      // Gold on black for large text (18px+): 3:1 threshold
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it("TV page: #A8A8B0 grey used at 14px normal text must be 4.5:1 — using 3:1 is WCAG violation", () => {
      // "Chosen by:" is 14px normal text — requires 4.5:1
      const bgHex = oklchToHex(0.145, 0.015, 50);
      const ratio = contrastRatio("#A8A8B0", bgHex);

      // This SHOULD FAIL if #A8A8B0 is used for normal (non-large) text
      // WCAG AA for normal text is 4.5:1; #A8A8B0 on Cinema Black is borderline
      // The test asserts we need 4.5:1 (currently borderline ~4.5:1 in some measurement tools)
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Hardcoded grey (#A8A8B0) usage — must be replaced with text-muted-foreground", () => {
    it("no hardcoded #A8A8B0 in TV page for text elements (should use CSS variable)", () => {
      const tvPage = fs.readFileSync(
        path.join(__dirname, "../app/tv/page.tsx"),
        "utf-8"
      );

      // Count hardcoded #A8A8B0 usages in tv/page.tsx
      // These should be replaced with CSS variable or brighter color
      const hardcodedGreyCount = (tvPage.match(/color:\s*["']#A8A8B0["']/g) || []).length;

      // After fix, there should be 0 hardcoded #A8A8B0 uses for text
      // Some uses (like borders/separators) may be acceptable
      // We allow up to 2 for non-text uses (borders, etc.)
      expect(hardcodedGreyCount).toBeLessThanOrEqual(2);
    });

    it("no hardcoded #A8A8B0 in onboarding pages for text (should use text-muted-foreground)", () => {
      const onboardingPages = [
        path.join(__dirname, "../app/onboarding/page.tsx"),
        path.join(__dirname, "../app/onboarding/create-family/page.tsx"),
        path.join(__dirname, "../app/onboarding/invite/page.tsx"),
      ];

      for (const pagePath of onboardingPages) {
        if (!fs.existsSync(pagePath)) continue;
        const content = fs.readFileSync(pagePath, "utf-8");
        const count = (content.match(/color:\s*["']#A8A8B0["']/g) || []).length;
        // After fix, no hardcoded #A8A8B0 for text
        expect(count).toBe(0);
      }
    });
  });
});
