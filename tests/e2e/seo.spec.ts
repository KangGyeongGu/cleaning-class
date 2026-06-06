import { test, expect } from "@playwright/test";

test.describe("SEO 핵심 자산", () => {
  test("/sitemap.xml 이 200 으로 응답하며 urlset 을 포함", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/contact");
    expect(body).toContain("/reviews");
  });

  test("/robots.txt 가 200 으로 응답하며 sitemap 참조를 포함", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent|User-agent/i);
    expect(body.toLowerCase()).toContain("sitemap");
  });

  test("홈에 LocalBusiness JSON-LD 가 삽입된다", async ({ page }) => {
    await page.goto("/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const merged = scripts.join("\n");
    expect(merged).toContain("LocalBusiness");
    expect(merged).toContain("청소클라쓰");
  });

  test("홈에 WebSite JSON-LD 가 삽입된다", async ({ page }) => {
    await page.goto("/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(scripts.join("\n")).toContain('"WebSite"');
  });

  test("홈 페이지에 title 과 description 메타가 존재한다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/청소클라쓰/);
    const desc = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(desc?.length ?? 0).toBeGreaterThan(20);
    expect(desc?.length ?? 0).toBeLessThanOrEqual(160);
  });

  test("홈 페이지에 Open Graph 메타가 존재한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /청소클라쓰/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      /cleaningclass\.co\.kr/,
    );
  });

  test("/feed.xml 이 200 으로 응답한다", async ({ request }) => {
    const res = await request.get("/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/xml/);
  });
});
