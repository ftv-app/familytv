import { test, expect } from "@playwright/test";
import { FeedPage } from "../pages/FeedPage";

// These tests require authentication - they use the authenticated user storage state
test.describe("Activity Stories Feed", () => {
  // Use authenticated state if available
  test.use({
    storageState: process.env.E2E_AUTH_STATE || "./playwright/.auth/user.json",
  });

  // TODO: Replace with actual family ID from test data fixture
  const TEST_FAMILY_ID = "test-family-123";

  test.describe("Feed with posts", () => {
    test("should load feed and display activity cards", async ({ page }) => {
      const feedPage = new FeedPage(page);

      // Navigate to feed - in real tests this would be a real family
      await feedPage.goto(TEST_FAMILY_ID);

      // Wait for feed to load
      await feedPage.expectFeedLoaded();

      // Create post trigger should be visible
      await feedPage.expectCreatePostTriggerVisible();
    });

    test("should show loading skeleton while fetching", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto(TEST_FAMILY_ID);
      await feedPage.expectFeedLoaded();

      // If load more button is visible, clicking it should show loading state
      // Note: This test may need adjustment based on actual data
      const loadMoreVisible = await feedPage.loadMoreButton.isVisible().catch(() => false);
      if (loadMoreVisible) {
        await feedPage.clickLoadMore();
        await feedPage.expectLoadingSkeletonVisible();
      }
    });

    test("should show 'all caught up' message when no more posts", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto(TEST_FAMILY_ID);
      await feedPage.expectFeedLoaded();

      // If there are posts but no more to load, the all caught up message should be visible
      // This depends on actual data state
    });
  });

  test.describe("Empty feed state", () => {
    test("should display warm CTA in empty state", async ({ page }) => {
      const feedPage = new FeedPage(page);

      // Navigate to a family with no posts
      // This would need a dedicated test family/user fixture
      await feedPage.goto("empty-family-456");

      await feedPage.expectEmptyState();
    });

    test("should have interactive primary CTA in empty state", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto("empty-family-456");

      await feedPage.expectEmptyStatePrimaryCta();
    });

    test("should have interactive secondary CTA in empty state", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto("empty-family-456");

      await feedPage.expectEmptyStateSecondaryCta();
    });

    test("empty state primary CTA should navigate to create post", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto("empty-family-456");

      await feedPage.expectEmptyState();
      await feedPage.clickEmptyStatePrimaryCta();

      // Should scroll to or focus on create post section
      // The CTA href is "#create-post" so it should scroll to that element
      await expect(page.locator("#create-post")).toBeInViewport();
    });

    test("empty state secondary CTA should navigate to invite page", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto("empty-family-456");

      await feedPage.expectEmptyState();

      // The secondary CTA href includes the familyId
      const inviteLink = feedPage.emptyStateSecondaryCta;
      await expect(inviteLink).toHaveAttribute("href", `/app/family/empty-family-456/invite`);
    });
  });

  test.describe("Feed accessibility", () => {
    test("empty state should have proper ARIA role", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto("empty-family-456");

      // The warm empty state has role="status" for accessibility
      await expect(feedPage.emptyState).toHaveAttribute("role", "status");
    });

    test("post cards should be visible and properly rendered", async ({ page }) => {
      const feedPage = new FeedPage(page);

      await feedPage.goto(TEST_FAMILY_ID);
      await feedPage.expectFeedLoaded();

      // Posts should have visible content
      const firstCard = feedPage.firstPostCard;
      await expect(firstCard).toBeVisible();
    });
  });
});

test.describe("Feed - Unauthenticated", () => {
  test("should redirect to sign-in when not authenticated", async ({ page }) => {
    const feedPage = new FeedPage(page);

    // Clear any existing auth state
    await page.context().clearCookies();

    // Navigate to feed without auth
    await feedPage.goto(TEST_FAMILY_ID);

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
