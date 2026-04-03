import { Page, Locator, expect } from "@playwright/test";

export class OnboardingPage {
  readonly page: Page;
  readonly branding: Locator;
  readonly logoIcon: Locator;
  readonly getStartedBtn: Locator;
  readonly createAccountLink: Locator;
  readonly backLink: Locator;
  readonly tagline: Locator;

  constructor(page: Page) {
    this.page = page;
    this.branding = page.locator("text=FamilyTV").first();
    this.logoIcon = page.locator("svg[viewBox='0 0 24 24']").first();
    this.getStartedBtn = page.locator("button", { hasText: "Get started" });
    this.createAccountLink = page.getByRole("link", { name: /create an account/i });
    this.backLink = page.locator("a[href='/']").first();
    this.tagline = page.locator("text=You're in!");
  }

  async goto() {
    await this.page.goto("/onboarding", { waitUntil: "networkidle" });
  }

  async clickGetStarted() {
    await this.getStartedBtn.click();
  }

  async clickCreateAccount() {
    await this.createAccountLink.click();
  }

  async clickBackToHome() {
    await this.backLink.click();
  }

  async expectToBeOnSignUpPage() {
    await expect(this.page).toHaveURL(/\/sign-up/);
  }

  async expectToBeOnLandingPage() {
    await expect(this.page).toHaveURL(/\/$/);
  }
}

export class CreateFamilyPage {
  readonly page: Page;
  readonly familyNameInput: Locator;
  readonly createFamilyBtn: Locator;
  readonly backButton: Locator;
  readonly progressDots: Locator;

  constructor(page: Page) {
    this.page = page;
    this.familyNameInput = page.getByLabel(/family name/i).or(page.locator("input[name='familyName']")).or(page.locator("input[placeholder*='family' i]"));
    this.createFamilyBtn = page.getByRole("button", { name: /create family|i create/i });
    this.backButton = page.locator("button[aria-label='Go back']").first();
    this.progressDots = page.locator('[aria-label*="Step"]');
  }

  async goto() {
    await this.page.goto("/onboarding/create-family", { waitUntil: "networkidle" });
  }

  async createFamily(name: string) {
    await this.familyNameInput.fill(name);
    await this.createFamilyBtn.click();
  }

  async expectProgressStep(step: number) {
    // Step indicators like "Step 2 of 3"
    await expect(this.page.locator(`text=Step ${step}`)).toBeVisible();
  }
}

export class InvitePage {
  readonly page: Page;
  readonly inviteLinkContainer: Locator;
  readonly copyLinkBtn: Locator;
  readonly progressDots: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inviteLinkContainer = page.locator('[data-testid="invite-link"]').or(page.locator("text=/http.*invite/i"));
    this.copyLinkBtn = page.getByRole("button", { name: /copy/i });
    this.progressDots = page.locator('[aria-label*="Step"]');
  }

  async goto(familyId: string) {
    await this.page.goto(`/onboarding/invite?familyId=${familyId}`, { waitUntil: "networkidle" });
  }

  async expectToShowInviteLink() {
    // Either shows a link, or a copy button, or a share button
    const hasInviteUI = await this.inviteLinkContainer.isVisible().catch(() => false) ||
                        await this.copyLinkBtn.isVisible().catch(() => false);
    expect(hasInviteUI).toBeTruthy();
  }
}
