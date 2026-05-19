import { describe, it } from "vitest";
import {
  expectNoDirectConsole,
  readIndexSource,
  sliceBetween,
} from "./architectureTestUtils";

describe("logger migration regression guard", () => {
  const indexSource = readIndexSource();

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
