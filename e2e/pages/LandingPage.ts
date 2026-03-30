import { Page, Locator, expect } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly header: Locator;
  readonly signInLink: Locator;
  readonly getStartedLink: Locator;
  readonly heroText: Locator;
  readonly startFamilyBtn: Locator;
  readonly alreadyHaveAccountLink: Locator;
  readonly featuresHeading: Locator;
  readonly privacyCallout: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("header");
    this.signInLink = page.getByRole("link", { name: /sign in/i });
    this.getStartedLink = page.getByRole("link", { name: /get started/i });
    this.heroText = page.locator("text=Your family's private place");
    this.startFamilyBtn = page.getByRole("link", { name: /start your family/i });
    this.alreadyHaveAccountLink = page.getByRole("link", { name: /already have an account/i });
    this.featuresHeading = page.locator("text=Everything your family needs");
    this.privacyCallout = page.locator("text=Privacy isn't a feature");
  }

  async goto() {
    await this.page.goto("/", { waitUntil: "networkidle" });
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  async clickGetStarted() {
    await this.getStartedLink.click();
  }

  async expectToBeOnSignInPage() {
    await expect(this.page).toHaveURL(/\/sign-in/);
  }

  async expectToBeOnSignUpPage() {
    await expect(this.page).toHaveURL(/\/sign-up/);
  }

  async expectBrandingVisible() {
    await expect(this.page.locator("text=FamilyTV").first()).toBeVisible();
  }
}
