import { Page, Locator, expect } from "@playwright/test";

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly signUpLink: Locator;
  readonly branding: Locator;
  readonly welcomeHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i).or(page.locator("input[name='email']"));
    this.passwordInput = page.getByLabel(/password/i).or(page.locator("input[name='password']"));
    this.submitBtn = page.getByRole("button", { name: /sign in|log in|continue/i });
    this.signUpLink = page.locator("a[href*='sign-up']").first();
    this.branding = page.locator("text=FamilyTV").first();
    this.welcomeHeading = page.getByRole("heading", { name: /welcome back/i });
  }

  async goto() {
    await this.page.goto("/sign-in", { waitUntil: "networkidle" });
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }

  async expectToBeOnSignUpPage() {
    await expect(this.page).toHaveURL(/\/sign-up/);
  }

  async expectBrandingVisible() {
    await expect(this.branding).toBeVisible();
  }
}

export class SignUpPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly signInLink: Locator;
  readonly branding: Locator;
  readonly taglineNoAds: Locator;
  readonly taglineNoAlgorithms: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i).or(page.locator("input[name='email']"));
    this.passwordInput = page.getByLabel(/password/i).or(page.locator("input[name='password']"));
    this.submitBtn = page.getByRole("button", { name: /sign up|create account|continue/i });
    this.signInLink = page.locator("a[href*='sign-in']").first();
    this.branding = page.locator("text=FamilyTV").first();
    this.taglineNoAds = page.locator("text=No ads");
    this.taglineNoAlgorithms = page.locator("text=no algorithms");
  }

  async goto() {
    await this.page.goto("/sign-up", { waitUntil: "networkidle" });
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  async expectToBeOnSignInPage() {
    await expect(this.page).toHaveURL(/\/sign-in/);
  }
}
