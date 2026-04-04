import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check page title/heading
    await expect(page.locator("h1")).toContainText("family");
  });

  test("should show FamilyTV branding in header", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Header branding
    await expect(page.locator("text=FamilyTV").first()).toBeVisible();

    // Sign in and get started buttons - use first() to avoid strict mode violation
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("should have hero section with CTA buttons", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Hero text - matches the actual production content
    await expect(page.locator("h1")).toContainText("Your family's");
    await expect(page.locator("h1")).toContainText("private channel");

    // CTA buttons - actual production buttons
    await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  });

  test("should have testimonials section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Testimonials heading
    await expect(page.locator("text=Families love FamilyTV")).toBeVisible();

    // Family names in testimonials
    await expect(page.locator("text=The Richardson Family")).toBeVisible();
    await expect(page.locator("text=The Nakamura Family")).toBeVisible();
    await expect(page.locator("text=The O'Brien Family")).toBeVisible();
  });

  test("should have how it works section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // HOW IT WORKS heading
    await expect(page.locator("text=HOW IT WORKS")).toBeVisible();

    // Step headings
    await expect(page.locator("text=Create your family channel")).toBeVisible();
    await expect(page.locator("text=Invite your family")).toBeVisible();
    await expect(page.locator("text=Share what matters")).toBeVisible();
  });

  test("should have features section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Features heading
    await expect(page.locator("text=YOUR CHANNEL INCLUDES")).toBeVisible();

    // Feature cards
    await expect(page.locator("text=Photo & Video")).toBeVisible();
    await expect(page.locator("text=Live Broadcasting")).toBeVisible();
    await expect(page.locator("text=Family Calendar")).toBeVisible();
  });

  test("should have privacy callout section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("text=Family privacy, guaranteed.")).toBeVisible();
  });

  test("should navigate to sign-in page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: /sign in/i }).first().click();
    await page.waitForURL("**/sign-in", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("should navigate to sign-up page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: /get started/i }).first().click();
    await page.waitForURL("**/sign-up", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("hero and first section below it should not overlap", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Get all sections within main
    const main = page.locator("main");
    const sections = main.locator("> section, > div[style*='height'"]");

    const heroCarousel = sections.nth(0);
    const heroContent = sections.nth(1);
    const socialProof = sections.nth(2);

    // Hero carousel and hero content should not overlap
    const carouselBottom = await heroCarousel.boundingBox();
    const heroContentBox = await heroContent.boundingBox();

    expect(carouselBottom).not.toBeNull();
    expect(heroContentBox).not.toBeNull();

    // Hero content starts exactly where carousel ends (no gap, no overlap)
    expect(heroContentBox!.top).toBe(carouselBottom!.top + carouselBottom!.height);

    // SocialProofSection starts after hero content ends (no overlap)
    const socialProofBox = await socialProof.boundingBox();
    expect(socialProofBox).not.toBeNull();
    expect(socialProofBox!.top).toBe(heroContentBox!.top + heroContentBox!.height);
  });

  test("hero content section has opaque background to prevent carousel show-through", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const main = page.locator("main");
    // Hero content is the second direct child of main (first is carousel div)
    const heroContentSection = main.locator("section").first();

    const bg = await heroContentSection.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Background must not be fully transparent
    const isTransparent = bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
    expect(isTransparent).toBe(false);
  });
});
