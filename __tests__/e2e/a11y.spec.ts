import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "home", path: "/" },
  { name: "admin-login", path: "/admin/login" },
  { name: "services", path: "/services" },
];

for (const p of pages) {
  test(`a11y: ${p.name} 페이지는 WCAG AA 위반 없음`, async ({ page }) => {
    await page.goto(p.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
