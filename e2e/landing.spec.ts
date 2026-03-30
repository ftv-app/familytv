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

    // Sign in and get started buttons
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("should have hero section with CTA buttons", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Hero text
    await expect(page.locator("text=Your family's private place")).toBeVisible();

    // CTA buttons
    await expect(page.getByRole("link", { name: /start your family/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /already have an account/i })).toBeVisible();
  });

  test("should have features section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Features heading
    await expect(page.locator("text=Everything your family needs")).toBeVisible();

    // Feature cards
    await expect(page.locator("text=Share privately")).toBeVisible();
    await expect(page.locator("text=Chronological feed")).toBeVisible();
    await expect(page.locator("text=Shared calendar")).toBeVisible();
  });

  test("should have privacy callout section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("text=Privacy isn't a feature")).toBeVisible();
  });

  test("should navigate to sign-in page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: /sign in/i }).click();
    await page.waitForURL("**/sign-in", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("should navigate to sign-up page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: /get started/i }).click();
    await page.waitForURL("**/sign-up", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/sign-up/);
  });
});
