import { test, expect } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("모바일 CTA 동작", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("홈에서는 하단 고정 전화 버튼이 보인다", async ({ page }) => {
    await page.goto("/");
    const cta = page
      .locator('a[href^="tel:"], div:has(a[href^="tel:"])')
      .filter({ has: page.locator("text=/상담/") });
    await expect(cta.first()).toBeVisible();
  });

  test("/contact 페이지에서는 하단 고정 전화 버튼이 보이지 않는다", async ({
    page,
  }) => {
    await page.goto("/contact");
    const fixedTelButton = page.locator(
      'div.fixed:has(a[href^="tel:"]), a.fixed[href^="tel:"]',
    );
    await expect(fixedTelButton).toHaveCount(0);
  });

  test("햄버거 메뉴를 열고 닫을 수 있다", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.getByRole("button", { name: "메뉴 열기/닫기" });
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");

    await hamburger.click();
    await expect(hamburger).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("dialog", { name: "내비게이션 메뉴" });
    await expect(menu).toBeVisible();

    await hamburger.click();
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("format-detection 메타 (iOS 자동 전화 감지 차단)", () => {
  test("모든 페이지 head 에 format-detection: telephone=no 가 존재", async ({
    page,
  }) => {
    await page.goto("/");
    const meta = page.locator(
      'meta[name="format-detection"][content="telephone=no"]',
    );
    await expect(meta).toHaveCount(1);
  });
});
