/**
 * @file config/playwright.config.ts
 * @description 데스크톱·모바일 E2E 브라우저·서버·재시도·결과물 저장 설정
 * @activation 직접 실행: npm run test:e2e
 * @activation Agent Skill: verify:full, /cut-release
 * @activation Git Hook: 적용하지 않음
 */
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const hostname = new URL(baseURL).hostname;
const isLocalTarget = hostname === "localhost" || hostname === "127.0.0.1";

if (!isLocalTarget && process.env.ALLOW_REMOTE_E2E !== "true") {
  throw new Error("원격 E2E 실행에는 ALLOW_REMOTE_E2E=true 설정이 필요합니다.");
}

export default defineConfig({
  testDir: "../tests/e2e",
  globalSetup: "../tests/e2e/global-setup.ts",
  outputDir: "../test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? "github" : "html",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
  webServer: isLocalTarget
    ? {
        cwd: resolve(__dirname, ".."),
        command: "npm run build && npm run start:standalone",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : undefined,
});
