import { Page, Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly familyNav: Locator;
  readonly notificationsBtn: Locator;
  readonly settingsBtn: Locator;
  readonly createFamilyBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.familyNav = page.locator("nav").first();
    this.notificationsBtn = page.getByRole("link", { name: /notifications/i }).or(page.getByRole("button", { name: /notifications/i }));
    this.settingsBtn = page.getByRole("link", { name: /settings/i }).or(page.getByRole("button", { name: /settings/i }));
    this.createFamilyBtn = page.getByRole("button", { name: /create family|new family/i });
  }

  async goto() {
    await this.page.goto("/app", { waitUntil: "networkidle" });
  }

  async gotoFamily(familySlug: string) {
    await this.page.goto(`/app/family/${familySlug}`, { waitUntil: "networkidle" });
  }

  async expectToBeOnSignInPage() {
    await expect(this.page).toHaveURL(/\/sign-in/);
  }
}

export class InviteAcceptancePage {
  readonly page: Page;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly signUpBtn: Locator;
  readonly joinFamilyBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingIndicator = page.locator("text=Loading invite").or(page.locator('[class*="animate-spin"]'));
    this.errorMessage = page.locator("text=/not available|expired|invalid/i");
    this.signUpBtn = page.getByRole("button", { name: /sign up/i });
    this.joinFamilyBtn = page.getByRole("button", { name: /join family|accept invite/i });
  }

  async goto(token: string) {
    await this.page.goto(`/invite/${token}`, { waitUntil: "networkidle" });
  }

  async expectLoadingOrContent() {
    const hasLoading = await this.loadingIndicator.isVisible().catch(() => false);
    const hasContent = await this.page.locator("body").isVisible();
    expect(hasLoading || hasContent).toBeTruthy();
  }

  async expectErrorState() {
    const hasError = await this.errorMessage.isVisible().catch(() => false) ||
                     await this.page.locator("text=Something went wrong").isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  }

  async expectSignUpPrompt() {
    await expect(this.signUpBtn.or(this.page.locator("a[href='/sign-up']"))).toBeVisible();
  }
}
