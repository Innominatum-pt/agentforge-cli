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

describe("logger migration regression guard", () => {
  const indexSource = readFileSync(
    path.join(repoRoot, "src/index.ts"),
    "utf8"
  );

  it("keeps getWorkspaceRoot on logger", () => {
    const region = sliceBetween(
      indexSource,
      "function getWorkspaceRoot(): string {",
      "const program = new Command();"
    );
    expectNoDirectConsole(region);
  });

  it("keeps init command on logger", () => {
    const region = sliceBetween(
      indexSource,
      'program\n  .command("init")',
      "const newCmd = program"
    );
    expectNoDirectConsole(region);
  });

  it("keeps manual and new commands on logger", () => {
    const region = sliceBetween(
      indexSource,
      "const newCmd = program",
      "const buildCmd = program"
    );
    expectNoDirectConsole(region);
  });

  it("keeps build command on logger", () => {
    const region = sliceBetween(
      indexSource,
      "const buildCmd = program",
      "async function getConfig()"
    );
    expectNoDirectConsole(region);
  });

  it("keeps getConfig on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function getConfig()",
      "async function resolveAgentId"
    );
    expectNoDirectConsole(region);
  });

  it("keeps resolveAgentId on logger", () => {
    const region = sliceBetween(
      indexSource,
      "async function resolveAgentId",
      "const deployCmd = program"
    );
    expectNoDirectConsole(region);
  });
});
