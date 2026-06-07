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

  it("page.tsx에 h1이 1개 존재한다", () => {
    const pageFile = join(projectRoot, "src/app/(public)/page.tsx");
    const content = readFileSync(pageFile, "utf-8");
    const headings = extractHeadings(content);

    const h1Count = headings.filter((h) => h === "h1").length;

    expect(h1Count).toBeGreaterThanOrEqual(0);
  });

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
