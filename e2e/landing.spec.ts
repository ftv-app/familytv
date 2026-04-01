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
});
