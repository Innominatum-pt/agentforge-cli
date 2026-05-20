import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerDeployCommands } from "./registerDeployCommands";

vi.mock("../core/config", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("./deploySkill", () => ({
  deploySkill: vi.fn(),
}));

vi.mock("./runDeployContext", () => ({
  runDeployContext: vi.fn(),
}));

vi.mock("./deployAgent", () => ({
  deployAgent: vi.fn(),
}));

vi.mock("./deployAllAgents", () => ({
  deployAllAgents: vi.fn(),
}));

vi.mock("./deployAllSkills", () => ({
  deployAllSkills: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { getConfig } from "../core/config";
import { getWorkspaceRoot } from "../core/workspace";
import { deploySkill } from "./deploySkill";
import { runDeployContext } from "./runDeployContext";
import { deployAgent } from "./deployAgent";
import { deployAllAgents } from "./deployAllAgents";
import { deployAllSkills } from "./deployAllSkills";
import { logger } from "../core/logger";

describe("registerDeployCommands", () => {
  let program: Command;
  let mockExit: any;

  beforeEach(() => {
    program = new Command();
    registerDeployCommands(program);
    mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    vi.restoreAllMocks();
  });

  it("registers deploy command and all expected subcommands", () => {
    const deployCmd = program.commands.find((c) => c.name() === "deploy");
    expect(deployCmd).toBeDefined();

    const names = deployCmd!.commands.map((c) => c.name());
    expect(names).toContain("skill");
    expect(names).toContain("context");
    expect(names).toContain("agent");
    expect(names).toContain("agents");
    expect(names).toContain("skills");
    expect(names).toContain("all");
  });

  it("preserves deploy command description", () => {
    const deployCmd = program.commands.find((c) => c.name() === "deploy");
    expect(deployCmd!.description()).toBe(
      "Faz o deploy de entidades para a plataforma GoClaw"
    );
  });

  it("deploy skill wrapper validates missing token with exact error and process.exit(1)", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: {} });

    const deployCmd = program.commands.find((c) => c.name() === "deploy")!;
    await expect(
      deployCmd.parseAsync(["node", "script", "skill", "my-skill"])
    ).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy."
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("deploy skill wrapper calls getWorkspaceRoot and deploySkill with correct args", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
    (deploySkill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const deployCmd = program.commands.find((c) => c.name() === "deploy")!;
    await deployCmd.parseAsync(["node", "script", "skill", "my-skill"]);

    expect(getConfig).toHaveBeenCalled();
    expect(getWorkspaceRoot).toHaveBeenCalled();
    expect(deploySkill).toHaveBeenCalledWith("my-skill", { goclaw: { token: "t" } }, "/workspace");
  });

  it("deploy context wrapper calls runDeployContext(slug, config)", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (runDeployContext as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const deployCmd = program.commands.find((c) => c.name() === "deploy")!;
    await deployCmd.parseAsync(["node", "script", "context", "my-agent"]);

    expect(runDeployContext).toHaveBeenCalledWith("my-agent", { goclaw: { token: "t" } });
  });

  it("deploy agent wrapper calls deployAgent with slug and config", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (deployAgent as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const deployCmd = program.commands.find((c) => c.name() === "deploy")!;
    await deployCmd.parseAsync(["node", "script", "agent", "my-agent"]);

    expect(deployAgent).toHaveBeenCalledWith("my-agent", { goclaw: { token: "t" } });
  });

  it("deploy all wrapper calls deployAllAgents then deployAllSkills", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const deployCmd = program.commands.find((c) => c.name() === "deploy")!;
    await deployCmd.parseAsync(["node", "script", "all"]);

    expect(deployAllAgents).toHaveBeenCalledWith({ goclaw: { token: "t" } }, "/workspace");
    expect(deployAllSkills).toHaveBeenCalledWith({ goclaw: { token: "t" } }, "/workspace");
    expect(deployAllAgents).toHaveBeenCalledBefore(deployAllSkills as any);
    expect(logger.info).toHaveBeenCalledWith("🏁 Deploy completo (agentes e skills) concluído!");
  });
});
