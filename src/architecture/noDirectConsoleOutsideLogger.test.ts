import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcDir = path.join(repoRoot, "src");

const ALLOWED_DIRECT_CONSOLE_FILES = [
  path.join("src", "core", "logger.ts"),
  path.join("src", "core", "logger.test.ts"),
];

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("global console regression guard", () => {
  const files = collectTsFiles(srcDir).filter(
    (f) =>
      !ALLOWED_DIRECT_CONSOLE_FILES.some((allowed) => f.includes(allowed))
  );

  it("has source files to guard", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const relative = path.relative(repoRoot, file);
    it(`has no direct console calls in ${relative}`, () => {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/\bconsole\.(log|warn|error)\b/);
    });
  }
});
