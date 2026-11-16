/**
 * @file config/vitest.config.mts
 * @description 단위·통합·구조·SEO·브라우저 컴포넌트 테스트 환경 및 커버리지 기준
 * @activation 직접 실행: npm test, npm run test:coverage, npm run test:browser
 * @activation Git Hook: pre-push의 verify에서 node 테스트·커버리지 실행
 * @activation Agent Skill: verify:full, /cut-release에서 node·browser 테스트 실행
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  root: new URL("../", import.meta.url).pathname,
  plugins: [react()],
  test: {
    globals: true,
    testTimeout: 10000,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "jsdom",
          include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/integration/**/*.test.{ts,tsx}",
            "tests/{architecture,seo}/**/*.test.ts",
          ],
          exclude: ["tests/e2e/**", "tests/component/**", "node_modules/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["tests/component/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/__mocks__/browser-setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      include: ["src/shared/actions/**/*.ts", "src/shared/lib/**/*.ts"],
      exclude: [
        "src/shared/types/**",
        "src/shared/lib/supabase/**",
        "src/shared/**/*.d.ts",
        "src/shared/**/index.ts",
        "**/*.test.{ts,tsx}",
      ],
      thresholds: {
        perFile: true,
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": new URL("../src", import.meta.url).pathname,
      "server-only": new URL("../tests/__mocks__/server-only.ts", import.meta.url)
        .pathname,
    },
  },
});
