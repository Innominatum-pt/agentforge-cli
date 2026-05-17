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

describe("logger migration regression guard for deploy command wrappers", () => {
  const indexSource = readFileSync(
    path.join(repoRoot, "src/index.ts"),
    "utf8"
  );

  it("keeps deploy skill command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("skill <slug>")',
      "async function deployContextFiles"
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy context command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("context <slug>")',
      'deployCmd\n  .command("agent <slug>")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy agent command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("agent <slug>")',
      "async function deployAllAgents"
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy agents command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("agents")',
      'deployCmd\n  .command("skills")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy skills command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("skills")',
      'deployCmd\n  .command("all")'
    );
    expectNoDirectConsole(region);
  });

  it("keeps deploy all command wrapper on logger", () => {
    const region = sliceBetween(
      indexSource,
      'deployCmd\n  .command("all")',
      "const pullCmd = program"
    );
    expectNoDirectConsole(region);
  });
});
