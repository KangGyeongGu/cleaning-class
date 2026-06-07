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

describe("의존성 방향", () => {
  const projectRoot = process.cwd();

  it("components는 app을 import할 수 없다", () => {
    const componentsDir = join(projectRoot, "src/components");
    const componentFiles = findFiles(componentsDir, /\.(ts|tsx)$/);

    const violations: string[] = [];

    for (const file of componentFiles) {
      const content = readFileSync(file, "utf-8");
      const imports = extractImports(content);

      for (const imp of imports) {
        if (
          imp.includes("@/app") ||
          imp.includes("../app") ||
          imp.includes("../../app")
        ) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("shared는 app/components를 import할 수 없다", () => {
    const sharedDir = join(projectRoot, "src/shared");

    try {
      statSync(sharedDir);
    } catch {
      return;
    }

    const sharedFiles = findFiles(sharedDir, /\.(ts|tsx)$/);
    const violations: string[] = [];

    for (const file of sharedFiles) {
      const content = readFileSync(file, "utf-8");
      const imports = extractImports(content);

      for (const imp of imports) {
        if (
          imp.includes("@/app") ||
          imp.includes("@/components") ||
          imp.includes("../app") ||
          imp.includes("../components") ||
          imp.includes("../../app") ||
          imp.includes("../../components")
        ) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
