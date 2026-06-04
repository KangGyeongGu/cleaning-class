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
            "src/**/*.test.{ts,tsx}",
            "__tests__/{architecture,seo,image}/**/*.test.ts",
          ],
          exclude: [
            "__tests__/e2e/**",
            "src/components/**/*.browser.test.tsx",
            "node_modules/**",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/components/**/*.browser.test.tsx"],
          setupFiles: ["./test/browser-setup.ts"],
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
        "**/__tests__/**",
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
      "server-only": new URL("./test/server-only-shim.ts", import.meta.url)
        .pathname,
    },
  },
});
