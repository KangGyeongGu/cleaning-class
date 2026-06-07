import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "fs";
import { join, basename } from "path";

const ROUTE_FILENAMES = new Set([
  "page.tsx",
  "layout.tsx",
  "route.ts",
  "error.tsx",
  "not-found.tsx",
  "loading.tsx",
  "default.tsx",
  "template.tsx",
  "sitemap.ts",
  "robots.ts",
  "manifest.ts",
  "opengraph-image.tsx",
  "twitter-image.tsx",
  "icon.tsx",
  "icon.ts",
  "apple-icon.tsx",
  "globals.css",
]);

const ROUTE_PATH_HINTS = ["/feed.xml/", "/auth/callback/", "/api/"];

function walk(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

const COMPONENT_PASCAL = /^[A-Z][A-Za-z0-9]*(?:\.client)?\.tsx$/;
const HOOK_CAMEL = /^use[A-Z][A-Za-z0-9]*\.ts$/;
const MODULE_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/;
const BARREL = /^index\.ts$/;

describe("파일명 컨벤션", () => {
  it("src/ 의 모든 파일은 정해진 명명 규칙을 따른다", () => {
    const root = join(process.cwd(), "src");
    const files = walk(root);
    const violations: string[] = [];

    for (const file of files) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const name = basename(file);
      const rel = file.replace(`${process.cwd()}/`, "");

      if (ROUTE_FILENAMES.has(name)) continue;
      if (ROUTE_PATH_HINTS.some((hint) => rel.includes(hint))) continue;
      if (name.endsWith(".d.ts")) continue;
      if (BARREL.test(name)) continue;

      if (name.endsWith(".tsx")) {
        if (!COMPONENT_PASCAL.test(name)) {
          violations.push(
            `${rel}: 컴포넌트 파일명은 PascalCase[.client].tsx 여야 함`,
          );
        }
        continue;
      }

      if (rel.includes("/hooks/") || name.startsWith("use")) {
        if (!HOOK_CAMEL.test(name)) {
          violations.push(`${rel}: 훅 파일명은 useXxx.ts 여야 함`);
        }
        continue;
      }

      if (!MODULE_KEBAB.test(name)) {
        violations.push(`${rel}: 일반 모듈 파일명은 kebab-case.ts 여야 함`);
      }
    }

    expect(violations).toEqual([]);
  });
});
