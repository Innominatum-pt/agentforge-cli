import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import path from "path";
import { registerPullCommands } from "./registerPullCommands";

vi.mock("../core/config", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("./pullConfirmation", () => ({
  confirmPullOverwrite: vi.fn(),
}));

vi.mock("./pullAllSkills", () => ({
  pullAllSkills: vi.fn(),
}));

vi.mock("./pullAllAgents", () => ({
  pullAllAgents: vi.fn(),
}));

vi.mock("./runPullAll", () => ({
  runPullAll: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("fs-extra", () => ({
  default: {
    emptyDir: vi.fn(),
  },
  emptyDir: vi.fn(),
}));

import { getConfig } from "../core/config";
import { getWorkspaceRoot } from "../core/workspace";
import { confirmPullOverwrite } from "./pullConfirmation";
import { pullAllSkills } from "./pullAllSkills";
import { pullAllAgents } from "./pullAllAgents";
import { runPullAll } from "./runPullAll";
import { logger } from "../core/logger";
import fs from "fs-extra";

describe("registerPullCommands", () => {
  let program: Command;
  let mockExit: any;

  beforeEach(() => {
    program = new Command();
    registerPullCommands(program);
    mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    vi.restoreAllMocks();
  });

  it("registers pull command and all expected subcommands", () => {
    const pullCmd = program.commands.find((c) => c.name() === "pull");
    expect(pullCmd).toBeDefined();

    const names = pullCmd!.commands.map((c) => c.name());
    expect(names).toContain("skills");
    expect(names).toContain("agents");
    expect(names).toContain("all");
  });

  it("preserves pull command description", () => {
    const pullCmd = program.commands.find((c) => c.name() === "pull");
    expect(pullCmd!.description()).toBe(
      "Sincroniza entidades do GoClaw para o workspace local"
    );
  });

  it("preserves skills subcommand description", () => {
    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    const skillsCmd = pullCmd.commands.find((c) => c.name() === "skills");
    expect(skillsCmd!.description()).toBe(
      "Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente"
    );
  });

  it("pull skills wrapper validates missing token with exact error and process.exit(1)", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: {} });

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await expect(
      pullCmd.parseAsync(["node", "script", "skills"])
    ).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull."
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("pull skills wrapper uses confirmPullOverwrite('skills')", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "skills"]);

    expect(confirmPullOverwrite).toHaveBeenCalledWith("skills");
  });

  it("pull skills wrapper cancellation does not call pullAllSkills", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "skills"]);

    expect(pullAllSkills).not.toHaveBeenCalled();
  });

  it("pull skills wrapper calls pullAllSkills(config) on confirmation", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "skills"]);

    expect(pullAllSkills).toHaveBeenCalledWith({ goclaw: { token: "t" } });
  });

  it("pull skills wrapper logs final success message", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "skills"]);

    expect(logger.info).toHaveBeenCalledWith(
      "✅ Pull de skills concluído com sucesso! As skills foram atualizadas localmente."
    );
  });

  it("pull skills wrapper on HTTP error logs correct status line", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue({ response: { status: 403 } });

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "skills"]);

    expect(logger.error).toHaveBeenCalledWith("❌ Erro durante o pull das skills:");
    expect(logger.error).toHaveBeenCalledWith("Status HTTP 403");
  });

  it("pull agents wrapper validates missing token with exact error and process.exit(1)", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: {} });

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await expect(
      pullCmd.parseAsync(["node", "script", "agents"])
    ).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull."
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("pull agents wrapper uses confirmPullOverwrite('agentes')", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(confirmPullOverwrite).toHaveBeenCalledWith("agentes");
  });

  it("pull agents wrapper cancellation does not call pullAllAgents", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(pullAllAgents).not.toHaveBeenCalled();
  });

  it("pull agents wrapper logs local agents cleanup message", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(logger.info).toHaveBeenCalledWith("🧹 Limpando a pasta local de agentes...");
  });

  it("pull agents wrapper calls fs.emptyDir for agents cleanup", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(fs.emptyDir).toHaveBeenCalledWith(path.join("/ws", "agents"));
  });

  it("pull agents wrapper calls pullAllAgents(config)", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(pullAllAgents).toHaveBeenCalledWith({ goclaw: { token: "t" } });
  });

  it("pull agents wrapper logs final success message", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(logger.info).toHaveBeenCalledWith("✅ Pull de agentes concluído com sucesso!");
  });

  it("pull agents wrapper on HTTP error logs exact long message", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue({ response: { status: 401 } });

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "agents"]);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull dos agentes: HTTP 401 - Verifique suas credenciais e permissões no agentforge.json (username deve ser o dono do agente)."
    );
  });

  it("pull all wrapper uses confirmPullOverwrite('TUDO (agentes e skills)')", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (runPullAll as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "all"]);

    expect(confirmPullOverwrite).toHaveBeenCalledWith("TUDO (agentes e skills)");
  });

  it("pull all wrapper cancellation does not call runPullAll", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "all"]);

    expect(runPullAll).not.toHaveBeenCalled();
  });

  it("pull all wrapper calls runPullAll(config) on confirmation", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (runPullAll as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "all"]);

    expect(runPullAll).toHaveBeenCalledWith({ goclaw: { token: "t" } });
  });

  it("pull all wrapper does NOT call fs.emptyDir for agents cleanup", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    (confirmPullOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (runPullAll as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const pullCmd = program.commands.find((c) => c.name() === "pull")!;
    await pullCmd.parseAsync(["node", "script", "all"]);

    expect(fs.emptyDir).not.toHaveBeenCalled();
  });
});
