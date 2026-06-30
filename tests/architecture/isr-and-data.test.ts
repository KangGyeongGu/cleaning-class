import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractImports(content: string): string[] {
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

describe("ISR 및 데이터 패턴", () => {
  const projectRoot = process.cwd();

  it("공개 페이지는 revalidate를 export해야 한다", () => {
    const publicDir = join(projectRoot, "src/app/(public)");

    const pages = findFiles(publicDir, /page\.tsx$/);

    const violations: string[] = [];

    for (const page of pages) {
      const content = readFileSync(page, "utf-8");
      if (!content.includes("export const revalidate")) {
        violations.push(`${page}: missing export const revalidate`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("server action은 중앙화된 revalidation 패턴을 사용해야 한다", () => {
    const actionsDir = join(projectRoot, "src/shared/actions");
    const actionFiles = findFiles(actionsDir, /\.ts$/);

    const violations: string[] = [];

    for (const file of actionFiles) {
      const content = readFileSync(file, "utf-8");

      if (!content.includes("revalidatePath(")) {
        continue;
      }

      const hasCentralizedPattern =
        content.includes("REVALIDATE_PATHS") ||
        /function\s+revalidate\w*Paths/.test(content);

      if (!hasCentralizedPattern) {
        violations.push(
          `${file}: revalidatePath 호출이 있으나 REVALIDATE_PATHS 상수 패턴 미사용`,
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it("공개 페이지에서 supabase/server를 직접 임포트하면 안 된다", () => {
    const publicDir = join(projectRoot, "src/app/(public)");
    const pages = findFiles(publicDir, /page\.tsx$/);

    const violations: string[] = [];

    for (const page of pages) {
      const content = readFileSync(page, "utf-8");
      const imports = extractImports(content);

      for (const imp of imports) {
        if (imp.includes("@/shared/lib/supabase/server")) {
          violations.push(`${page}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("(public)/layout.tsx는 revalidate를 export해야 한다", () => {
    const layoutPath = join(projectRoot, "src/app/(public)/layout.tsx");

    const violations: string[] = [];

    try {
      const content = readFileSync(layoutPath, "utf-8");
      if (!content.includes("export const revalidate")) {
        violations.push(`${layoutPath}: missing export const revalidate`);
      }
    } catch {
      violations.push(`${layoutPath}: 파일을 찾을 수 없음`);
    }

    expect(violations).toEqual([]);
  });
});
