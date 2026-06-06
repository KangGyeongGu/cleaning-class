import { test, expect } from "@playwright/test";

test.describe("견적문의 폼", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("폼이 렌더링되고 청소/이사 탭 전환이 동작한다", async ({ page }) => {
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByRole("button", { name: "청소의뢰" })).toBeVisible();
    await expect(page.getByRole("button", { name: "이사의뢰" })).toBeVisible();

    await page.getByRole("button", { name: "이사의뢰" }).click();
    await expect(page.getByText(/출발지/)).toBeVisible();
    await expect(page.getByText(/도착지/)).toBeVisible();

    await page.getByRole("button", { name: "청소의뢰" }).click();
    await expect(page.locator('label[for="name"]')).toBeVisible();
  });

  test("필수 필드 비어있으면 제출 버튼이 비활성", async ({ page }) => {
    const submit = page.getByRole("button", { name: "문의하기" });
    await expect(submit).toBeDisabled();
  });

  test("문의사항 50자 미만이면 제출 버튼 비활성", async ({ page }) => {
    await page.locator("#name").fill("홍길동");
    await page.locator("#phone").fill("010-1234-5678");
    await page.locator("#message").fill("짧은 메시지");
    await expect(page.getByRole("button", { name: "문의하기" })).toBeDisabled();
  });

  test("전화번호 입력 시 자동 포맷팅이 동작한다", async ({ page }) => {
    const phoneInput = page.locator("#phone");
    await phoneInput.fill("01012345678");
    await expect(phoneInput).toHaveValue("010-1234-5678");
  });

  test("서비스 종류 드롭다운에서 옵션을 선택할 수 있다", async ({ page }) => {
    const dropdown = page.getByRole("button", {
      name: /서비스를 선택해주세요/,
    });
    await expect(dropdown).toBeVisible();
    await dropdown.click();
    await page
      .getByRole("button", { name: "거주청소", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /거주청소/ }).first(),
    ).toBeVisible();
  });

  test("주소 외 필수 필드를 모두 채워도 주소가 없으면 제출 버튼은 비활성", async ({
    page,
  }) => {
    await page.locator("#name").fill("홍길동");
    await page.locator("#phone").fill("01012345678");
    await page
      .locator("#message")
      .fill(
        "8평 원룸 주거 청소 견적 문의드립니다. 주방 기름때와 화장실 환풍구까지 청소 부탁드립니다.",
      );
    await page.getByRole("button", { name: /서비스를 선택해주세요/ }).click();
    await page
      .getByRole("button", { name: "거주청소", exact: true })
      .first()
      .click();

    await expect(page.getByRole("button", { name: "문의하기" })).toBeDisabled();
  });
});
