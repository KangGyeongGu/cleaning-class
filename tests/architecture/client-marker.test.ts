import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const ROUTE_FILENAMES = new Set([
  "page.tsx",
  "layout.tsx",
  "error.tsx",
  "not-found.tsx",
  "loading.tsx",
  "default.tsx",
  "template.tsx",
  "opengraph-image.tsx",
  "twitter-image.tsx",
  "icon.tsx",
]);

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

function hasUseClientDirective(content: string): boolean {
  const first = content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return false;
  return first === '"use client";' || first === "'use client';";
}

describe("*.client.tsx 마커 일치성", () => {
  const root = join(process.cwd(), "src");
  const files = walk(root).filter((f) => f.endsWith(".tsx"));

  it('.client.tsx 접미사 파일은 첫 줄에 "use client" 지시문을 가진다', () => {
    const violations: string[] = [];
    for (const file of files) {
      if (!file.endsWith(".client.tsx")) continue;
      const content = readFileSync(file, "utf-8");
      if (!hasUseClientDirective(content)) {
        const rel = file.replace(`${process.cwd()}/`, "");
        violations.push(
          `${rel}: .client.tsx 접미사가 있지만 "use client" 지시문 없음`,
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it('"use client" 지시문을 가진 파일은 .client.tsx 접미사를 가진다 (Next.js 라우트 예외)', () => {
    const violations: string[] = [];
    for (const file of files) {
      if (file.endsWith(".client.tsx")) continue;
      if (ROUTE_FILENAMES.has(basename(file))) continue;
      const content = readFileSync(file, "utf-8");
      if (hasUseClientDirective(content)) {
        const rel = file.replace(`${process.cwd()}/`, "");
        violations.push(
          `${rel}: "use client" 지시문이 있지만 .client.tsx 접미사 없음`,
        );
      }
    }
    expect(violations).toEqual([]);
  });
});
