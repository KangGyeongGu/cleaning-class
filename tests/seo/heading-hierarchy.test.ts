import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function extractHeadings(content: string): string[] {
  const headingRegex = /<(h[1-6])[^>]*>/gi;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].toLowerCase());
  }

  return headings;
}

function extractHeadingsFromComponents(
  componentsDir: string,
): Map<string, string[]> {
  const componentHeadings = new Map<string, string[]>();

  function scan(dir: string) {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (/\.(tsx|jsx)$/.test(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        const headings = extractHeadings(content);
        if (headings.length > 0) {
          componentHeadings.set(fullPath, headings);
        }
      }
    }
  }

  scan(componentsDir);
  return componentHeadings;
}

describe("SEO: 헤딩 계층", () => {
  const projectRoot = process.cwd();

  // 단일 h1 규칙은 페이지가 h1을 자식 컴포넌트(Hero 등)로 렌더하므로
  // 정적 검사로는 정확히 셀 수 없어 E2E(tests/e2e/seo.spec.ts, 실제 DOM)에서 강제한다.

  it("헤딩 순서가 h1→h2→h3 규칙을 준수한다 (컴포넌트별)", () => {
    const componentsDir = join(projectRoot, "src/components");
    const componentHeadings = extractHeadingsFromComponents(componentsDir);

    const violations: string[] = [];

    for (const [file, headings] of componentHeadings) {
      const levels = headings.map((h) => parseInt(h.replace("h", "")));

      for (let i = 1; i < levels.length; i++) {
        const prev = levels[i - 1];
        const curr = levels[i];

        if (curr > prev + 1) {
          violations.push(
            `${file}: h${prev} → h${curr} (점프가 너무 큼, 순차적으로 h${prev + 1}을 사용해야 함)`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("각 컴포넌트 파일에 h1이 1개 이하만 존재한다", () => {
    const componentsDir = join(projectRoot, "src/components");
    const componentHeadings = extractHeadingsFromComponents(componentsDir);
    const violations: string[] = [];

    for (const [file, headings] of componentHeadings) {
      const h1Count = headings.filter((h) => h === "h1").length;
      if (h1Count > 1) {
        violations.push(`${file}: h1 ${h1Count}개 (1개 이하만 허용)`);
      }
    }

    expect(violations).toEqual([]);
  });
});
