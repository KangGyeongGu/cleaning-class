import { test, expect } from "@playwright/test";

const REPRESENTATIVE_ROUTES = ["/admin", "/admin/services", "/admin/dashboard"];

test.describe("관리자 인증 게이트", () => {
  for (const path of REPRESENTATIVE_ROUTES) {
    test(`미인증 ${path} 접근 시 /admin/login 으로 리다이렉트`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test("/admin/login 페이지가 정상 렌더링되고 폼 필드 노출", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
  });

  test("잘못된 자격증명으로 로그인 시도해도 /admin/login 머무름", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="email"]').fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: /로그인/ }).click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
