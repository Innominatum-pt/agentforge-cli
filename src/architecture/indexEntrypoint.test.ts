import { describe, expect, it } from "vitest";
import {
  expectNoDirectConsole,
  readSourceFile,
} from "./architectureTestUtils";

describe("index entrypoint contract", () => {
  const indexSource = readSourceFile("src/index.ts");

  it("keeps the shebang", () => {
    expect(indexSource.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  it("imports createProgram from ./cli", () => {
    expect(indexSource).toContain('import { createProgram } from "./cli"');
  });

  it("calls createProgram().parse()", () => {
    expect(indexSource).toContain("createProgram().parse()");
  });

  it("does not import registerCoreCommands directly", () => {
    expect(indexSource).not.toContain("registerCoreCommands");
  });

  it("does not import registerDeployCommands directly", () => {
    expect(indexSource).not.toContain("registerDeployCommands");
  });

  it("does not import registerPullCommands directly", () => {
    expect(indexSource).not.toContain("registerPullCommands");
  });

  it("does not import package.json directly", () => {
    expect(indexSource).not.toContain("../package.json");
  });
});
