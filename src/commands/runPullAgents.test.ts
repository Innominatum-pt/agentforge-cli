import { describe, expect, it, vi, beforeEach } from "vitest";
import path from "path";
import { runPullAgents } from "./runPullAgents";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("./pullAllAgents", () => ({
  pullAllAgents: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    emptyDir: vi.fn(),
  },
  emptyDir: vi.fn(),
}));

import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { pullAllAgents } from "./pullAllAgents";
import fs from "fs-extra";

describe("runPullAgents", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/ws");
  });

  it("logs exact cleanup message", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAgents(config);

    expect(logger.info).toHaveBeenCalledWith("🧹 Limpando a pasta local de agentes...");
  });

  it("calls fs.emptyDir for agents cleanup", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAgents(config);

    expect(fs.emptyDir).toHaveBeenCalledWith(path.join("/ws", "agents"));
  });

  it("calls pullAllAgents(config)", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAgents(config);

    expect(pullAllAgents).toHaveBeenCalledWith(config);
  });

  it("logs exact success message when pullAllAgents succeeds", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAgents(config);

    expect(logger.info).toHaveBeenCalledWith("✅ Pull de agentes concluído com sucesso!");
  });

  it("logs exact HTTP credentials/perms message when error.response.status exists", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 401 },
    });

    await runPullAgents(config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull dos agentes: HTTP 401 - Verifique suas credenciais e permissões no agentforge.json (username deve ser o dono do agente)."
    );
  });

  it("logs exact HTTP credentials/perms message when error.status exists", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue({
      status: 403,
    });

    await runPullAgents(config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull dos agentes: HTTP 403 - Verifique suas credenciais e permissões no agentforge.json (username deve ser o dono do agente)."
    );
  });

  it("logs non-status error with multi-argument logger.error", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );

    await runPullAgents(config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull dos agentes:",
      "network down"
    );
  });

  it("does not throw on failure", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );

    await expect(runPullAgents(config)).resolves.toBeUndefined();
  });

  it("cleans up before calling pullAllAgents", async () => {
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAgents(config);

    expect(fs.emptyDir).toHaveBeenCalledBefore(pullAllAgents as any);
  });
});
