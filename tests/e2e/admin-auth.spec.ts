import { test, expect } from "@playwright/test";

test.describe("관리자 인증", () => {
  test("미인증 상태로 /admin 접근 시 /admin/login으로 리다이렉트", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("미인증 상태로 /admin/services 접근 시 /admin/login으로 리다이렉트", async ({
    page,
  }) => {
    await page.goto("/admin/services");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("/admin/login 페이지가 정상 렌더링된다", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/login/);

    await expect(
      page.locator('form, input[type="email"], input[type="password"]').first(),
    ).toBeVisible();
  });
});
