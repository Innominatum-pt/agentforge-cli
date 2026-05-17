import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}

function expectNoDirectConsole(region: string): void {
  expect(region).not.toMatch(/\bconsole\.(log|warn|error)\b/);
}

describe("logger migration regression guard for deploySkill", () => {
  const indexSource = readFileSync(path.join(repoRoot, "src/index.ts"), "utf8");

  it("keeps deploySkill on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function deploySkill",
      'deployCmd\n  .command("skill <slug>")'
    );

    expectNoDirectConsole(region);
  });
});
