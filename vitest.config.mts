import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
            "tests/{architecture,seo,image}/**/*.test.ts",
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
      "@": "/src",
      "server-only": new URL("./tests/__mocks__/server-only.ts", import.meta.url)
        .pathname,
    },
  },
});
