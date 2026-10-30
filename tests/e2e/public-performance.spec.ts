import { expect, test, type Page } from "@playwright/test";

function reviewPage(filter: string | null, page: number) {
  return {
    total: 36,
    page,
    filter,
    reviews: Array.from({ length: 12 }, (_, index) => ({
      id: `fixture-${filter ?? "all"}-${page}-${index}`,
      title: `${filter ?? "전체"} ${page}페이지 사례 ${index + 1}`,
      summary: "공개 목록 탐색 검증용 작업 사례",
      tags: filter ? [filter] : ["거주청소"],
      image_path: "",
      link_url: "",
      is_published: true,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
    })),
  };
}

async function mockReviews(page: Page) {
  await page.route("**/api/reviews?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    await route.fulfill({
      json: reviewPage(params.get("filter"), Number(params.get("page") ?? 1)),
    });
  });
}

test.describe("공개 페이지 초기 렌더링과 목록 탐색", () => {
  test("첫 HTML에 견적 입력 폼과 최대 12개의 작업 사례가 포함됨", async ({
    request,
  }) => {
    const contact = await request.get("/contact");
    expect(contact.ok()).toBe(true);
    const contactHtml = (await contact.text()).replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      "",
    );
    expect(contactHtml).toMatch(/<form\b/);
    expect(contactHtml).toContain('name="serviceType"');
    expect(contactHtml).toContain('name="phone"');

    const reviews = await request.get("/reviews");
    expect(reviews.ok()).toBe(true);
    const html = (await reviews.text()).replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      "",
    );
    const list = html.match(/<ul\b[^>]*role="list"[^>]*>([\s\S]*?)<\/ul>/);
    expect(list).not.toBeNull();
    const cards = list![1].match(/<li\b/g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(12);
  });

  test("기본 목록은 초기 HTML을 사용하며 추가 목록 API 요청을 보내지 않음", async ({
    page,
  }) => {
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/reviews")
        apiRequests.push(request.url());
    });
    await page.goto("/reviews");
    await expect(
      page.getByRole("button", { name: "전체", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("main ul[role=list] > li")).toHaveCount(12);
    await page.waitForLoadState("networkidle");
    expect(apiRequests).toEqual([]);
  });

  test("직접 URL 진입과 필터·페이지 이동·뒤로 가기가 같은 조건의 목록을 표시", async ({
    page,
  }) => {
    await mockReviews(page);
    await page.goto(`/reviews?filter=${encodeURIComponent("거주청소")}`);
    await expect(
      page.getByRole("heading", {
        name: "거주청소 1페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "다음 페이지", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "거주청소 2페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/page=2/);
    await page.getByRole("button", { name: "정기청소", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "정기청소 1페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.has("page")).toBe(false);
    await page.goBack();
    await expect(
      page.getByRole("heading", {
        name: "거주청소 2페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole("heading", {
        name: "거주청소 1페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(`/reviews?filter=${encodeURIComponent("정기청소")}&page=3`);
    await expect(
      page.getByRole("heading", {
        name: "정기청소 3페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "다음 페이지", exact: true }),
    ).toBeDisabled();
  });

  test("목록 조회 실패를 표시하고 재시도하면 요청한 조건을 복원", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("**/api/reviews?*", async (route) => {
      requests++;
      if (requests === 1) {
        await route.fulfill({ status: 503, body: "unavailable" });
        return;
      }
      const params = new URL(route.request().url()).searchParams;
      await route.fulfill({
        json: reviewPage(params.get("filter"), Number(params.get("page"))),
      });
    });
    await page.goto(`/reviews?filter=${encodeURIComponent("상가청소")}&page=2`);
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "목록을 불러오지 못했습니다.",
    );
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "상가청소 2페이지 사례 1",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    expect(requests).toBe(2);
  });

  test("견적 문의의 service URL 조건은 초기 폼 표시 후에도 적용됨", async ({
    page,
  }) => {
    await page.goto(`/contact?service=${encodeURIComponent("거주청소")}`);
    await expect(page.locator('input[name="serviceType"]')).toHaveValue(
      "거주청소",
    );
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });
});
