import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { deployAgent } from "./deployAgent";

const mockCreateAgent = vi.fn();
const mockUpdateAgent = vi.fn();

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(() => ({
    createAgent: mockCreateAgent,
    updateAgent: mockUpdateAgent,
  })),
}));

vi.mock("../core/agentResolution", () => ({
  resolveAgentId: vi.fn(),
}));

vi.mock("./deployContextFiles", () => ({
  deployContextFiles: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { getWorkspaceRoot } from "../core/workspace";
import { resolveAgentId } from "../core/agentResolution";
import { deployContextFiles } from "./deployContextFiles";
import { logger } from "../core/logger";

describe("deployAgent", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-deploy-agent-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("logs error and returns when agent.json is missing", async () => {
    await fs.ensureDir(path.join(tempDir, "agents", "missing-agent"));

    await deployAgent("missing-agent", { goclaw: { token: "t" } });

    expect(logger.error).toHaveBeenCalledWith(
      `❌ agent.json não encontrado em agents/missing-agent.`
    );
    expect(mockCreateAgent).not.toHaveBeenCalled();
    expect(mockUpdateAgent).not.toHaveBeenCalled();
  });

  it("creates a new agent when resolveAgentId returns null", async () => {
    const agentDir = path.join(tempDir, "agents", "new-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "New Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockCreateAgent.mockResolvedValue({});

    await deployAgent("new-agent", { goclaw: { token: "t" } });

    expect(mockCreateAgent).toHaveBeenCalledWith({ name: "New Agent" });
    expect(logger.info).toHaveBeenCalledWith(`✅ Agente "new-agent" criado.`);
  });

  it("updates an existing agent when resolveAgentId returns an id", async () => {
    const agentDir = path.join(tempDir, "agents", "existing-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "Existing Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-123");
    mockUpdateAgent.mockResolvedValue({});

    await deployAgent("existing-agent", { goclaw: { token: "t" } });

    expect(mockUpdateAgent).toHaveBeenCalledWith("agent-123", { name: "Existing Agent" });
    expect(logger.info).toHaveBeenCalledWith(
      `✅ Configuração de "existing-agent" atualizada.`
    );
  });

  it("calls deployContextFiles(slug, config, agentId) after create/update", async () => {
    const agentDir = path.join(tempDir, "agents", "ctx-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "Ctx Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-456");
    mockUpdateAgent.mockResolvedValue({});

    await deployAgent("ctx-agent", { goclaw: { token: "t" } });

    expect(deployContextFiles).toHaveBeenCalledWith(
      "ctx-agent",
      { goclaw: { token: "t" } },
      "agent-456"
    );
  });

  it("calls deployContextFiles with null agentId when resolveAgentId returns null", async () => {
    const agentDir = path.join(tempDir, "agents", "null-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "Null Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockCreateAgent.mockResolvedValue({});

    await deployAgent("null-agent", { goclaw: { token: "t" } });

    expect(deployContextFiles).toHaveBeenCalledWith(
      "null-agent",
      { goclaw: { token: "t" } },
      null
    );
  });

  it("logs success message after context sync", async () => {
    const agentDir = path.join(tempDir, "agents", "success-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "Success Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-789");
    mockUpdateAgent.mockResolvedValue({});

    await deployAgent("success-agent", { goclaw: { token: "t" } });

    expect(logger.info).toHaveBeenCalledWith(
      `✅ Agente "success-agent" sincronizado com sucesso!`
    );
  });

  it("logs catch error with same multi-argument logger.error semantics", async () => {
    const agentDir = path.join(tempDir, "agents", "fail-agent");
    await fs.ensureDir(agentDir);
    await fs.writeJson(path.join(agentDir, "agent.json"), { name: "Fail Agent" });

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-000");
    mockUpdateAgent.mockRejectedValue(new Error("update fail"));

    await deployAgent("fail-agent", { goclaw: { token: "t" } });

    expect(logger.error).toHaveBeenCalledWith(
      `❌ Erro no deploy de "fail-agent":`,
      "update fail"
    );
  });
});
