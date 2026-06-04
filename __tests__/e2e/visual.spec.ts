import { test, expect } from "@playwright/test";

const snapshots = [
  { name: "home-desktop", path: "/", viewport: { width: 1280, height: 800 } },
  { name: "home-mobile", path: "/", viewport: { width: 390, height: 844 } },
  {
    name: "services-desktop",
    path: "/services",
    viewport: { width: 1280, height: 800 },
  },
];

for (const s of snapshots) {
  test(`visual: ${s.name}`, async ({ page }) => {
    await page.setViewportSize(s.viewport);
    await page.goto(s.path);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${s.name}.png`, { fullPage: true });
  });
}
