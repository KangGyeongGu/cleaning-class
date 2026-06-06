import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "home", path: "/" },
  { name: "admin-login", path: "/admin/login" },
  { name: "services", path: "/services" },
  { name: "contact", path: "/contact" },
  { name: "reviews", path: "/reviews" },
  { name: "price", path: "/price" },
  { name: "help", path: "/help" },
];

const DISABLED_RULES = ["color-contrast", "aria-hidden-focus"];

for (const p of pages) {
  test(`a11y: ${p.name} 페이지는 WCAG AA 위반 없음`, async ({ page }) => {
    await page.goto(p.path);
    await page.waitForLoadState("domcontentloaded");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(DISABLED_RULES)
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
