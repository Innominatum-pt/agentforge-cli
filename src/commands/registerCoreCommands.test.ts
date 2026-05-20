import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerCoreCommands } from "./registerCoreCommands";

vi.mock("./initWorkspace", () => ({
  initWorkspace: vi.fn(),
}));

vi.mock("./showManual", () => ({
  showManual: vi.fn(),
}));

vi.mock("./newAgent", () => ({
  createNewAgent: vi.fn(),
}));

vi.mock("./newSkill", () => ({
  createNewSkill: vi.fn(),
}));

vi.mock("./buildSkill", () => ({
  buildSkill: vi.fn(),
}));

import { initWorkspace } from "./initWorkspace";
import { showManual } from "./showManual";
import { createNewAgent } from "./newAgent";
import { createNewSkill } from "./newSkill";
import { buildSkill } from "./buildSkill";

describe("registerCoreCommands", () => {
  it("registers init command", () => {
    const program = new Command();
    registerCoreCommands(program);

    const initCmd = program.commands.find((c) => c.name() === "init");
    expect(initCmd).toBeDefined();
  });

  it("preserves init alias start", () => {
    const program = new Command();
    registerCoreCommands(program);

    const initCmd = program.commands.find((c) => c.name() === "init")!;
    expect(initCmd.aliases()).toContain("start");
  });

  it("preserves init description", () => {
    const program = new Command();
    registerCoreCommands(program);

    const initCmd = program.commands.find((c) => c.name() === "init")!;
    expect(initCmd.description()).toBe(
      "Cria a estrutura inicial do workspace de agentes"
    );
  });

  it("init command calls initWorkspace", async () => {
    const program = new Command();
    registerCoreCommands(program);

    await program.parseAsync(["node", "script", "init"]);

    expect(initWorkspace).toHaveBeenCalled();
  });

  it("registers manual command", () => {
    const program = new Command();
    registerCoreCommands(program);

    const manualCmd = program.commands.find((c) => c.name() === "manual");
    expect(manualCmd).toBeDefined();
  });

  it("preserves manual alias help-docs", () => {
    const program = new Command();
    registerCoreCommands(program);

    const manualCmd = program.commands.find((c) => c.name() === "manual")!;
    expect(manualCmd.aliases()).toContain("help-docs");
  });

  it("manual command calls showManual", async () => {
    const program = new Command();
    registerCoreCommands(program);

    await program.parseAsync(["node", "script", "manual"]);

    expect(showManual).toHaveBeenCalled();
  });

  it("registers new command", () => {
    const program = new Command();
    registerCoreCommands(program);

    const newCmd = program.commands.find((c) => c.name() === "new");
    expect(newCmd).toBeDefined();
  });

  it("registers new agent and new skill subcommands", () => {
    const program = new Command();
    registerCoreCommands(program);

    const newCmd = program.commands.find((c) => c.name() === "new")!;
    const names = newCmd.commands.map((c) => c.name());
    expect(names).toContain("agent");
    expect(names).toContain("skill");
  });

  it("preserves new/new agent/new skill descriptions", () => {
    const program = new Command();
    registerCoreCommands(program);

    const newCmd = program.commands.find((c) => c.name() === "new")!;
    expect(newCmd.description()).toBe(
      "Cria novas entidades (agentes, skills, etc)"
    );

    const agentCmd = newCmd.commands.find((c) => c.name() === "agent")!;
    expect(agentCmd.description()).toBe(
      "Cria um novo agente com os ficheiros base da template"
    );

    const skillCmd = newCmd.commands.find((c) => c.name() === "skill")!;
    expect(skillCmd.description()).toBe(
      "Cria uma nova skill usando o template base"
    );
  });

  it("new agent calls createNewAgent(name)", async () => {
    const program = new Command();
    registerCoreCommands(program);

    const newCmd = program.commands.find((c) => c.name() === "new")!;
    await newCmd.parseAsync(["node", "script", "agent", "my-agent"]);

    expect(createNewAgent).toHaveBeenCalledWith(
      "my-agent",
      expect.any(Object),
      expect.any(Command)
    );
  });

  it("new skill calls createNewSkill(name)", async () => {
    const program = new Command();
    registerCoreCommands(program);

    const newCmd = program.commands.find((c) => c.name() === "new")!;
    await newCmd.parseAsync(["node", "script", "skill", "my-skill"]);

    expect(createNewSkill).toHaveBeenCalledWith(
      "my-skill",
      expect.any(Object),
      expect.any(Command)
    );
  });

  it("registers build command", () => {
    const program = new Command();
    registerCoreCommands(program);

    const buildCmd = program.commands.find((c) => c.name() === "build");
    expect(buildCmd).toBeDefined();
  });

  it("registers build skill subcommand", () => {
    const program = new Command();
    registerCoreCommands(program);

    const buildCmd = program.commands.find((c) => c.name() === "build")!;
    const names = buildCmd.commands.map((c) => c.name());
    expect(names).toContain("skill");
  });

  it("preserves build/build skill descriptions", () => {
    const program = new Command();
    registerCoreCommands(program);

    const buildCmd = program.commands.find((c) => c.name() === "build")!;
    expect(buildCmd.description()).toBe(
      "Realiza o build (empacotamento) de entidades"
    );

    const skillCmd = buildCmd.commands.find((c) => c.name() === "skill")!;
    expect(skillCmd.description()).toBe(
      "Empacota uma skill em um arquivo .zip na pasta exports/"
    );
  });

  it("build skill calls buildSkill(slug)", async () => {
    const program = new Command();
    registerCoreCommands(program);

    const buildCmd = program.commands.find((c) => c.name() === "build")!;
    await buildCmd.parseAsync(["node", "script", "skill", "my-skill"]);

    expect(buildSkill).toHaveBeenCalledWith(
      "my-skill",
      expect.any(Object),
      expect.any(Command)
    );
  });
});
