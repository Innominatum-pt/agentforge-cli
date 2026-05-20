import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { createProgram } from "./cli";
import pkg from "../package.json";

describe("createProgram", () => {
  it("returns a Commander Command instance", () => {
    const program = createProgram();
    expect(program).toBeInstanceOf(Command);
  });

  it("has name agentforge", () => {
    const program = createProgram();
    expect(program.name()).toBe("agentforge");
  });

  it("preserves description", () => {
    const program = createProgram();
    expect(program.description()).toBe(
      "CLI para gerir agentes, equipas e templates de agentes"
    );
  });

  it("uses package.json version", () => {
    const program = createProgram();
    expect(program.version()).toBe(pkg.version);
  });

  it("registers expected top-level commands", () => {
    const program = createProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("init");
    expect(names).toContain("manual");
    expect(names).toContain("new");
    expect(names).toContain("build");
    expect(names).toContain("deploy");
    expect(names).toContain("pull");
  });
});
