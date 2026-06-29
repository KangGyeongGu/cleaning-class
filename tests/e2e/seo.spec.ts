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

  test("/sitemap.xml 의 모든 entry 가 url + lastmod 보유", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    const body = await res.text();
    const urlMatches = body.match(/<url>([\s\S]*?)<\/url>/g) ?? [];
    expect(urlMatches.length).toBeGreaterThanOrEqual(7);
    for (const entry of urlMatches) {
      expect(entry).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/);
      expect(entry).toMatch(
        /<lastmod>\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?<\/lastmod>/,
      );
    }
  });

  test("/sitemap.xml 에 핵심 공개 페이지 모두 포함", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const body = await res.text();
    const requiredPaths = [
      "/",
      "/services",
      "/reviews",
      "/contact",
      "/help",
      "/price",
      "/policy/privacy",
      "/policy/terms",
    ];
    for (const path of requiredPaths) {
      const matcher =
        path === "/"
          ? "<loc>https://www.cleaningclass.co.kr</loc>"
          : `<loc>https://www.cleaningclass.co.kr${path}</loc>`;
      expect(body).toContain(matcher);
    }
  });

  test("/robots.txt 가 200 으로 응답하며 sitemap 참조와 /admin 차단을 포함", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent|User-agent/i);
    expect(body.toLowerCase()).toContain("sitemap");
    expect(body).toMatch(/Disallow:\s*\/admin/i);
  });

  test("홈에 LocalBusiness JSON-LD 가 삽입되고 파싱 가능", async ({ page }) => {
    await page.goto("/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    const parsed = scripts.map((s) => JSON.parse(s));
    const localBusiness = parsed.find((p) =>
      Array.isArray(p["@type"])
        ? p["@type"].includes("LocalBusiness")
        : p["@type"] === "LocalBusiness",
    );
    expect(localBusiness).toBeDefined();
    expect(localBusiness["@context"]).toBe("https://schema.org");
    expect(localBusiness.name).toContain("청소클라쓰");
    expect(localBusiness.address).toBeDefined();
    expect(localBusiness.geo).toBeDefined();
  });

  test("홈에 WebSite JSON-LD 가 삽입되고 파싱 가능", async ({ page }) => {
    await page.goto("/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const parsed = scripts.map((s) => JSON.parse(s));
    const website = parsed.find((p) => p["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website.url).toMatch(/^https?:\/\//);
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

  test("홈에 Google 검색 콘솔 verification 메타가 존재한다", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator('meta[name="google-site-verification"]'),
    ).toHaveAttribute("content", /.+/);
  });

  test("홈에 Naver 서치어드바이저 verification 메타가 존재한다", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator('meta[name="naver-site-verification"]'),
    ).toHaveAttribute("content", /.+/);
  });

  test("/admin/login 페이지에 noindex,nofollow 메타가 출력된다", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robots).toMatch(/noindex/);
    expect(robots).toMatch(/nofollow/);
  });

  test("/manifest.webmanifest 가 200 으로 응답하고 PWA 필수 필드를 보유", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBeDefined();
    expect(body.short_name).toBeDefined();
    expect(body.start_url).toBe("/");
    expect(body.display).toBeDefined();
    expect(Array.isArray(body.icons)).toBe(true);
    expect((body.icons as unknown[]).length).toBeGreaterThan(0);
  });

  test("/opengraph-image 가 200 으로 응답하고 이미지를 반환", async ({
    request,
  }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(
      /image\/(png|webp|jpe?g)/,
    );
  });

  test("/feed.xml 이 200 으로 응답한다", async ({ request }) => {
    const res = await request.get("/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/xml/);
  });

  // 단일 h1 규칙: 페이지가 h1 을 자식 컴포넌트로 렌더하므로 정적 검사 대신
  // 실제 DOM 에서 공개 라우트별 h1 이 정확히 1개인지 강제한다.
  const PUBLIC_ROUTES = [
    "/",
    "/contact",
    "/services",
    "/price",
    "/reviews",
    "/help",
    "/review/write",
    "/policy/privacy",
    "/policy/terms",
  ];
  for (const route of PUBLIC_ROUTES) {
    test(`${route} 에 h1 이 정확히 1개 존재한다`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }
});
