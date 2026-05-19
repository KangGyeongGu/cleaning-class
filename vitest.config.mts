import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["__tests__/e2e/**", "node_modules/**", ".claude/worktrees/**"],
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/shared/actions/**/*.ts", "src/shared/lib/**/*.ts"],
      exclude: [
        "src/shared/types/**",
        "src/shared/lib/supabase/**",
        "**/*.d.ts",
      ],
      thresholds: {
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
