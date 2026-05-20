import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { deployAllAgents } from "./deployAllAgents";

vi.mock("./deployAgent", () => ({
  deployAgent: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { deployAgent } from "./deployAgent";
import { logger } from "../core/logger";

describe("deployAllAgents", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-deploy-all-agents-test-"));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("logs 'Nenhum agente encontrado em agents/.' when agents directory is missing", async () => {
    await deployAllAgents({ goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith("Nenhum agente encontrado em agents/.");
    expect(deployAgent).not.toHaveBeenCalled();
  });

  it("logs batch count using total entries returned by fs.readdir", async () => {
    const agentsDir = path.join(tempDir, "agents");
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(path.join(agentsDir, "agent-a"));
    await fs.ensureDir(path.join(agentsDir, "agent-b"));
    await fs.writeFile(path.join(agentsDir, "file.txt"), "not a dir");

    await deployAllAgents({ goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith("🚀 Iniciando deploy em lote de 3 agentes...");
  });

  it("calls deployAgent only for directories", async () => {
    const agentsDir = path.join(tempDir, "agents");
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(path.join(agentsDir, "agent-a"));
    await fs.ensureDir(path.join(agentsDir, "agent-b"));
    await fs.writeFile(path.join(agentsDir, "file.txt"), "not a dir");

    await deployAllAgents({ goclaw: { token: "t" } }, tempDir);

    expect(deployAgent).toHaveBeenCalledWith("agent-a", { goclaw: { token: "t" } });
    expect(deployAgent).toHaveBeenCalledWith("agent-b", { goclaw: { token: "t" } });
    expect(deployAgent).toHaveBeenCalledTimes(2);
  });

  it("preserves iteration over slugs", async () => {
    const agentsDir = path.join(tempDir, "agents");
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(path.join(agentsDir, "z-last"));
    await fs.ensureDir(path.join(agentsDir, "a-first"));

    await deployAllAgents({ goclaw: { token: "t" } }, tempDir);

    const calls = (deployAgent as ReturnType<typeof vi.fn>).mock.calls;
    // fs.readdir returns alphabetical order
    expect(calls[0][0]).toBe("a-first");
    expect(calls[1][0]).toBe("z-last");
  });
});
