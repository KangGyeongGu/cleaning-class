import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findTsxFiles(fullPath));
    } else if (fullPath.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }

  return results;
}

describe("next/image 정책", () => {
  const projectRoot = process.cwd();
  const componentsDir = join(projectRoot, "src/components");

  it("src/components 내 모든 tsx 파일에서 native <img> 태그를 사용하지 않는다", () => {
    const tsxFiles = findTsxFiles(componentsDir);
    const violations: string[] = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf-8");

      const lines = content.split("\n");
      let hasViolation = false;

      for (let i = 0; i < lines.length; i++) {
        if (/<img\s+[^>]*>/.test(lines[i])) {
          const prevLine = i > 0 ? lines[i - 1] : "";
          if (!prevLine.includes("eslint-disable")) {
            hasViolation = true;
            break;
          }
        }
      }

      if (hasViolation) {
        violations.push(`${file}: native <img> 태그 사용 감지`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("next/image의 fill 사용 시 sizes 속성이 필수로 지정된다", () => {
    const tsxFiles = findTsxFiles(componentsDir);
    const violations: string[] = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf-8");

      const imageWithFillRegex = /<Image[^>]*\bfill\b[^>]*>/g;
      const matches = content.match(imageWithFillRegex);

      if (matches) {
        for (const match of matches) {
          if (!match.includes("sizes=")) {
            violations.push(`${file}: <Image fill> 사용 시 sizes 속성 누락`);
            break;
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("unsplash.com URL이 코드 내에 존재하지 않는다", () => {
    const tsxFiles = findTsxFiles(componentsDir);
    const violations: string[] = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf-8");

      if (content.includes("unsplash.com")) {
        violations.push(`${file}: unsplash.com URL 사용 감지`);
      }
    }

    expect(violations).toEqual([]);
  });
});
