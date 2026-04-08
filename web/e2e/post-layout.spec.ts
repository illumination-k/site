import { expect, test } from "@playwright/test";

test.describe("post page layout", () => {
  test("grid container should have 12 columns at lg viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ja/techblog/1");

    // Navigate to the first post
    const firstPostLink = page
      .locator("article")
      .first()
      .getByRole("link")
      .first();
    await firstPostLink.click();
    await page.waitForURL(/\/ja\/techblog\/post\//);

    const gridContainer = page.locator("#post-content").locator("..");
    const columns = await gridContainer.evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns;
    });

    const columnCount = columns.split(" ").length;
    expect(columnCount).toBe(12);
  });

  test("sidebar should be visible at lg viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ja/techblog/1");

    const firstPostLink = page
      .locator("article")
      .first()
      .getByRole("link")
      .first();
    await firstPostLink.click();
    await page.waitForURL(/\/ja\/techblog\/post\//);

    const sidebar = page.locator("aside, [role='complementary']");
    await expect(sidebar).toBeVisible();
  });
});
