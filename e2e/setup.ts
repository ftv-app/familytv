import { test as setup, chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, "playwright/.auth/user.json");

// Clerk test user credentials - set via environment variables
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "playwright.test@familytv.dev";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "TestPassword123!";

async function globalSetup() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const baseURL = process.env.BASE_URL || "https://familytv.vercel.app";

  if (!clerkPublishableKey) {
    console.log("⚠️  No Clerk key found — skipping auth setup. Authenticated tests may fail.");
    return;
  }

  // Ensure the auth directory exists
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🔐 Setting up authenticated test user...");

    // Go to sign-in page
    await page.goto(`${baseURL}/sign-in`, { waitUntil: "networkidle" });

    // Click on sign up link if we see it (create test account)
    const signUpLink = page.getByRole("link", { name: /sign up|get started/i });
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForURL("**/sign-up", { waitUntil: "networkidle" });
    }

    // Fill in Clerk's sign-up form
    // Clerk renders its own form inside a div with specific structure
    const emailInput = page.locator('input[name="emailAddress"]').first();
    const passwordInput = page.locator('input[name="password"]').first();
    const firstNameInput = page.locator('input[name="firstName"]').first();
    const lastNameInput = page.locator('input[name="lastName"]').first();

    // If sign-in page, use email link or password
    if (await page.url().includes("sign-in")) {
      // Try "Sign in with email" flow
      const emailField = page.locator('input[id="identifier"]').first();
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailField.fill(TEST_EMAIL);
        // Click continue
        await page.getByRole("button", { name: /continue/i }).click();
        await page.waitForTimeout(2000);

        // Check for password field or email link option
        const passwordField = page.locator('input[name="password"]').first();
        if (await passwordField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await passwordField.fill(TEST_PASSWORD);
          await page.getByRole("button", { name: /sign in/i }).click();
        }
      }
    } else {
      // Sign-up page
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(TEST_EMAIL);
        await page.locator('button:has-text("Continue")').first().click().catch(() => {});
        await page.waitForTimeout(2000);
      }

      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill(TEST_PASSWORD);
      }

      if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstNameInput.fill("Playwright");
      }
      if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lastNameInput.fill("Test");
      }
    }

    // Wait for redirect to dashboard or family creation
    await page.waitForURL(/\/(dashboard|app|sign-up|create-family)/, { timeout: 15000 }).catch(() => {});

    // Save auth state
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log("✅ Auth state saved to", STORAGE_STATE_PATH);
  } catch (error) {
    console.error("❌ Auth setup failed:", error);
    // Don't fail hard - some tests can still run without auth
  } finally {
    await browser.close();
  }
}

export { globalSetup, TEST_EMAIL, TEST_PASSWORD };
