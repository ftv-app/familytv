import { Page, Locator, expect } from "@playwright/test";

export class FeedPage {
  readonly page: Page;

  // Feed container
  readonly feedPostList: Locator;

  // Post cards
  readonly postCards: Locator;
  readonly firstPostCard: Locator;

  // Create post
  readonly createPostTrigger: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly emptyStatePrimaryCta: Locator;
  readonly emptyStateSecondaryCta: Locator;

  // Load more
  readonly loadMoreContainer: Locator;
  readonly loadMoreButton: Locator;

  // All caught up message
  readonly allCaughtUpMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Feed container
    this.feedPostList = page.locator("[data-testid='feed-post-list']");

    // Post cards
    this.postCards = page.locator("[data-testid='post-card']");
    this.firstPostCard = page.locator("[data-testid='post-card']").first();

    // Create post
    this.createPostTrigger = page.locator("[data-testid='create-post-trigger']");

    // Empty state
    this.emptyState = page.locator("[data-testid='warm-empty-state']");
    this.emptyStateTitle = page.locator("[data-testid='warm-empty-state-title']");
    this.emptyStateDescription = page.locator("[data-testid='warm-empty-state-description']");
    this.emptyStatePrimaryCta = page.locator("[data-testid='warm-empty-state-primary-cta']");
    this.emptyStateSecondaryCta = page.locator("[data-testid='warm-empty-state-secondary-cta']");

    // Load more
    this.loadMoreContainer = page.locator("[data-testid='feed-load-more-container']");
    this.loadMoreButton = page.locator("[data-testid='feed-load-more-button']");

    // All caught up
    this.allCaughtUpMessage = page.locator("[data-testid='feed-all-caught-up']");
  }

  async goto(familyId: string) {
    await this.page.goto(`/app/family/${familyId}/feed`, { waitUntil: "networkidle" });
  }

  async expectFeedLoaded() {
    await expect(this.feedPostList).toBeVisible();
  }

  async expectPostCardsVisible(count?: number) {
    await expect(this.postCards.first()).toBeVisible();
    if (count !== undefined) {
      await expect(this.postCards).toHaveCount(count);
    }
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.emptyStateTitle).toContainText("Your family's story starts here");
    await expect(this.emptyStateDescription).toContainText("When someone shares a moment, it will appear here");
    await expect(this.emptyStatePrimaryCta).toContainText("Share the first moment");
    await expect(this.emptyStateSecondaryCta).toContainText("Invite family members");
  }

  async expectEmptyStatePrimaryCta() {
    await expect(this.emptyStatePrimaryCta).toBeVisible();
    await expect(this.emptyStatePrimaryCta).toContainText("Share the first moment");
  }

  async expectEmptyStateSecondaryCta() {
    await expect(this.emptyStateSecondaryCta).toBeVisible();
    await expect(this.emptyStateSecondaryCta).toContainText("Invite family members");
  }

  async clickEmptyStatePrimaryCta() {
    await this.emptyStatePrimaryCta.click();
  }

  async clickEmptyStateSecondaryCta() {
    await this.emptyStateSecondaryCta.click();
  }

  async expectLoadingSkeletonVisible() {
    // The loading state shows a spinner inside the load more button
    await expect(this.loadMoreButton).toContainText("Loading...");
  }

  async expectLoadMoreButtonVisible() {
    await expect(this.loadMoreButton).toBeVisible();
    await expect(this.loadMoreButton).toContainText("Load more");
  }

  async clickLoadMore() {
    await this.loadMoreButton.click();
  }

  async expectAllCaughtUpMessage() {
    await expect(this.allCaughtUpMessage).toBeVisible();
    await expect(this.allCaughtUpMessage).toContainText("You're all caught up");
  }

  async expectCreatePostTriggerVisible() {
    await expect(this.createPostTrigger).toBeVisible();
  }
}
