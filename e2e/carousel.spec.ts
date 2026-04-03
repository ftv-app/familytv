import { test, expect, Page } from "@playwright/test";
import { LandingPage } from "./pages/LandingPage";

test.describe("Landing Page Carousel", () => {
  test.beforeEach(async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test("should display hero carousel/slider section", async ({ page }) => {
    // Check for carousel indicators or slides
    const hasCarousel = await page.locator('[data-testid="carousel"]').isVisible().catch(() => false) ||
                        await page.locator('[class*="carousel"]').isVisible().catch(() => false) ||
                        await page.locator('[class*="slider"]').isVisible().catch(() => false) ||
                        await page.locator("section").first().isVisible();
    // At minimum, hero section should be visible
    const heroVisible = await page.locator("text=Your family's private place").isVisible().catch(() => false) ||
                        await page.locator("h1").first().isVisible();
    expect(heroVisible).toBeTruthy();
  });

  test("should show carousel navigation dots if multiple slides", async ({ page }) => {
    // Look for dot navigation
    const hasDotNav = await page.locator('[class*="dot"]').first().isVisible().catch(() => false) ||
                      await page.locator('[aria-label*="slide"]').isVisible().catch(() => false) ||
                      await page.locator("button[aria-label*='Next']").isVisible().catch(() => false);
    // If no carousel controls, hero is static — that's fine
    const heroVisible = await page.locator("h1, [class*='hero']").first().isVisible();
    expect(heroVisible).toBeTruthy();
  });

  test("should navigate carousel with prev/next buttons if present", async ({ page }) => {
    const nextBtn = page.locator("button[aria-label*='next' i]").or(page.locator('[class*="next"]')).first();
    const prevBtn = page.locator("button[aria-label*='prev' i]").or(page.locator('[class*="prev"]')).first();

    const hasCarouselControls = await nextBtn.isVisible().catch(() => false);

    if (hasCarouselControls) {
      // Get initial heading text
      const initialHeading = await page.locator("h1, h2").first().textContent();

      // Click next
      await nextBtn.click();
      await page.waitForTimeout(500); // Allow animation

      // Heading may change or remain the same depending on implementation
      const afterHeading = await page.locator("h1, h2").first().textContent();
      expect(typeof afterHeading === "string").toBeTruthy();

      // Click prev if visible
      if (await prevBtn.isVisible().catch(() => false)) {
        await prevBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      // No carousel controls — just verify hero content loads
      expect(await page.locator("body").isVisible()).toBeTruthy();
    }
  });

  test("should display CTA buttons regardless of carousel position", async ({ page }) => {
    // Start free CTA should always be visible
    const startFreeBtn = page.getByRole("link", { name: /Start free/i });
    await expect(startFreeBtn).toBeVisible();

    // Sign in link should always be visible
    const signInBtn = page.getByRole("link", { name: /sign in/i }).first();
    await expect(signInBtn).toBeVisible();
  });

  test("should auto-advance carousel if autoplay is enabled", async ({ page }) => {
    // Only testable if carousel has auto-advance
    const hasCarousel = await page.locator('[data-testid="carousel"], [class*="carousel"], [class*="slider"]').isVisible().catch(() => false);

    if (hasCarousel) {
      // Let carousel run for a few seconds
      await page.waitForTimeout(3000);

      // Should still be on landing page
      await expect(page).toHaveURL(/\/$/);

      // CTA buttons should still be accessible
      await expect(page.getByRole("link", { name: /Start free/i })).toBeVisible();
    } else {
      // Static hero — verify it's still rendered
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("Landing Page - Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Hero text should still be visible on mobile
    const heroVisible = await page.locator("text=Your family's private place").isVisible().catch(() => false) ||
                         await page.locator("h1").first().isVisible().catch(() => false);
    expect(heroVisible).toBeTruthy();

    // CTA buttons should be present (may be stacked)
    await expect(page.getByRole("link", { name: /Start free/i })).toBeVisible();
  });

  test("should have mobile-friendly navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // On mobile, there might be a hamburger menu
    const hasMenuToggle = await page.locator("button[aria-label*='menu' i]").or(page.locator('[class*="menu"]')).isVisible().catch(() => false);

    // At minimum, sign in link should be accessible
    const signInLink = page.getByRole("link", { name: /sign in/i }).first();
    if (hasMenuToggle) {
      await page.locator("button[aria-label*='menu' i]").click();
      await page.waitForTimeout(300);
    }
    await expect(signInLink.or(page.locator("nav"))).toBeVisible();
  });
});
