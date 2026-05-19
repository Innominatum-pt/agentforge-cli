import { expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

export const repoRoot = process.cwd();

export function readSourceFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

export function readIndexSource(): string {
  return readSourceFile("src/index.ts");
}

export function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}

export function expectNoDirectConsole(region: string): void {
  expect(region).not.toMatch(/\bconsole\.(log|warn|error)\b/);
}
