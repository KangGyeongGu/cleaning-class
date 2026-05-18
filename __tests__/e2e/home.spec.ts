import { test, expect } from "@playwright/test";

test.describe("홈페이지", () => {
  test("페이지가 정상 로드된다", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main")).toBeVisible();
  });

  test("네비게이션이 존재한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("히어로 섹션이 렌더링된다", async ({ page }) => {
    await page.goto("/");

    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();
  });

  test("푸터가 존재한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
