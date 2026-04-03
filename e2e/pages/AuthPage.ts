import { Page, Locator, expect } from "@playwright/test";

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly signUpLink: Locator;
  readonly branding: Locator;
  readonly welcomeHeading: Locator;
  readonly logo: Locator;
  readonly brandName: Locator;
  readonly subheading: Locator;
  readonly tagline: Locator;
  readonly clerkComponent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("Enter your email address");
    this.passwordInput = page.getByPlaceholder("Enter your password");
    this.submitBtn = page.getByRole("button", { name: /sign in|log in|continue/i }).first();
    this.signUpLink = page.locator("a[href*='sign-up']").first();
    this.branding = page.locator("text=FamilyTV").first();
    this.welcomeHeading = page.getByRole("heading", { name: /welcome back/i });
    // data-testid attributes for WCAG 2.1 AA compliance testing
    this.logo = page.locator('[data-testid="auth-logo"]');
    this.brandName = page.locator('[data-testid="auth-brand-name"]');
    this.subheading = page.locator('[data-testid="auth-subheading"]');
    this.tagline = page.locator('[data-testid="auth-tagline"]');
    this.clerkComponent = page.locator('[data-testid="auth-signin-clerk-component"]');
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

  async expectTestIdAttributes() {
    // Verify WCAG 2.1 AA testid attributes are present
    await expect(this.logo).toBeAttached();
    await expect(this.brandName).toBeAttached();
    await expect(this.welcomeHeading).toBeAttached();
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
  readonly logo: Locator;
  readonly brandName: Locator;
  readonly subheading: Locator;
  readonly tagline: Locator;
  readonly clerkComponent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("Enter your email address");
    this.passwordInput = page.getByPlaceholder("Enter your password");
    this.submitBtn = page.getByRole("button", { name: /sign up|create account|continue/i }).first();
    this.signInLink = page.locator("a[href*='sign-in']").first();
    this.branding = page.locator("text=FamilyTV").first();
    this.taglineNoAds = page.locator("text=No ads");
    this.taglineNoAlgorithms = page.locator("text=no algorithms");
    // data-testid attributes for WCAG 2.1 AA compliance testing
    this.logo = page.locator('[data-testid="auth-logo"]');
    this.brandName = page.locator('[data-testid="auth-brand-name"]');
    this.subheading = page.locator('[data-testid="auth-subheading"]');
    this.tagline = page.locator('[data-testid="auth-tagline"]');
    this.clerkComponent = page.locator('[data-testid="auth-signup-clerk-component"]');
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

  async expectTestIdAttributes() {
    // Verify WCAG 2.1 AA testid attributes are present
    await expect(this.logo).toBeAttached();
    await expect(this.brandName).toBeAttached();
    await expect(this.taglineNoAds).toBeAttached();
  }
}
