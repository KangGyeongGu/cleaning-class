import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function findPagesRecursive(root: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else if (item === "page.tsx") results.push(full);
    }
  }

  walk(root);
  return results;
}

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = join(PROJECT_ROOT, "src/app/(public)");

// noindex 페이지(robots.index:false)는 검색 노출 대상이 아니므로
// canonical / openGraph / title 고유성 요구에서 제외한다. metadata export 자체는 필수.
function isNoIndex(content: string): boolean {
  return /robots\s*:\s*\{[^}]*index\s*:\s*false/.test(content);
}

describe("SEO: 공개 페이지 메타데이터", () => {
  const publicPages = findPagesRecursive(PUBLIC_DIR);

  it("모든 공개 페이지가 metadata 또는 generateMetadata 를 export", () => {
    const violations: string[] = [];
    for (const file of publicPages) {
      const content = readFileSync(file, "utf-8");
      const hasStatic = /export\s+const\s+metadata\s*:/.test(content);
      const hasGenerator =
        /export\s+(async\s+)?function\s+generateMetadata/.test(content);
      if (!hasStatic && !hasGenerator) {
        violations.push(`${file}: metadata 또는 generateMetadata export 누락`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("인덱싱 대상 공개 페이지는 canonical alternates 를 정의", () => {
    const violations: string[] = [];
    for (const file of publicPages) {
      const content = readFileSync(file, "utf-8");
      if (isNoIndex(content)) continue;
      if (!/canonical\s*:/.test(content)) {
        violations.push(`${file}: alternates.canonical 정의 누락`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("인덱싱 대상 공개 페이지는 openGraph 를 정의", () => {
    const violations: string[] = [];
    for (const file of publicPages) {
      const content = readFileSync(file, "utf-8");
      if (isNoIndex(content)) continue;
      if (!/openGraph\s*:/.test(content)) {
        violations.push(`${file}: openGraph 정의 누락`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("공개 페이지 title 이 페이지별로 고유 (중복 없음)", () => {
    const titles = new Map<string, string>();
    const duplicates: string[] = [];

    for (const file of publicPages) {
      const content = readFileSync(file, "utf-8");
      if (isNoIndex(content)) continue;

      const absoluteMatch = content.match(
        /title\s*:\s*\{[\s\S]*?absolute\s*:\s*["'`]([^"'`]+)["'`]/,
      );
      const stringMatch = content.match(/title\s*:\s*["'`]([^"'`]+)["'`]/);
      const constMatch = content.match(
        /const\s+title\s*=\s*["'`]([^"'`]+)["'`]/,
      );

      const title =
        absoluteMatch?.[1] ?? stringMatch?.[1] ?? constMatch?.[1] ?? null;
      if (!title) continue;

      const existing = titles.get(title);
      if (existing) {
        duplicates.push(`title "${title}" — ${existing} 와 ${file} 에서 중복`);
      } else {
        titles.set(title, file);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("admin layout 은 robots.index/follow false 를 정의", () => {
    const adminLayout = join(PROJECT_ROOT, "src/app/admin/layout.tsx");
    const content = readFileSync(adminLayout, "utf-8");
    expect(content).toMatch(/robots\s*:\s*\{[^}]*index\s*:\s*false/);
    expect(content).toMatch(/robots\s*:\s*\{[^}]*follow\s*:\s*false/);
  });

  it("루트 layout 의 verification 메타에 Google + Naver 가 모두 설정", () => {
    const rootLayout = join(PROJECT_ROOT, "src/app/layout.tsx");
    const content = readFileSync(rootLayout, "utf-8");
    expect(content).toMatch(/verification\s*:/);
    expect(content).toMatch(/google\s*:\s*["'`][\w-]+["'`]/);
    expect(content).toMatch(/naver-site-verification/);
  });
});
