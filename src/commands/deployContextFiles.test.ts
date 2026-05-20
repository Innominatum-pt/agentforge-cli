import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { deployContextFiles } from "./deployContextFiles";

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("../core/agentResolution", () => ({
  resolveAgentId: vi.fn(),
}));

vi.mock("../sync/contextSync", () => ({
  prepareContextFilesExport: vi.fn(),
  injectGhostPlaceholders: vi.fn(),
  createContextTarball: vi.fn(),
  importContextArchive: vi.fn(),
  cleanupContextSyncTempFiles: vi.fn(),
}));

vi.mock("../sync/memorySync", () => ({
  forceUpdateLocalMemoryDocuments: vi.fn(),
  pruneOrphanMemoryDocuments: vi.fn(),
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
import {
  prepareContextFilesExport,
  injectGhostPlaceholders,
  createContextTarball,
  importContextArchive,
  cleanupContextSyncTempFiles,
} from "../sync/contextSync";
import {
  forceUpdateLocalMemoryDocuments,
  pruneOrphanMemoryDocuments,
} from "../sync/memorySync";
import { logger } from "../core/logger";

describe("deployContextFiles", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-deploy-ctx-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("throws when agent folder does not exist", async () => {
    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      deployContextFiles("missing-agent", { goclaw: { token: "t" } })
    ).rejects.toThrow("Agente não encontrado em agents/missing-agent");
  });

  it("returns and logs when there is nothing to sync except agent.json/README.md", async () => {
    const agentDir = path.join(tempDir, "agents", "empty-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "agent.json"), "{}");
    await fs.writeFile(path.join(agentDir, "README.md"), "# Readme");

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("resolved-id");

    await deployContextFiles("empty-agent", { goclaw: { token: "t" } });

    expect(logger.info).toHaveBeenCalledWith(
      `Nenhum ficheiro de contexto ou memória encontrado para "empty-agent".`
    );
    expect(prepareContextFilesExport).not.toHaveBeenCalled();
  });

  it("resolves agent id using resolvedId when provided and does not call resolveAgentId", async () => {
    const agentDir = path.join(tempDir, "agents", "provided-id-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "SKILL.md"), "# Skill");

    (prepareContextFilesExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sectionDir: "section",
      sectionsArray: [],
      localFilePaths: [],
    });

    await deployContextFiles("provided-id-agent", { goclaw: { token: "t" } }, "explicit-id");

    expect(resolveAgentId).not.toHaveBeenCalled();
    expect(prepareContextFilesExport).toHaveBeenCalledWith(
      "provided-id-agent",
      agentDir,
      path.join(tempDir, "temp_export_provided-id-agent"),
      path.join(tempDir, "temp_export_provided-id-agent.tar.gz"),
      ["SKILL.md"]
    );
  });

  it("falls back to resolveAgentId when resolvedId is not provided", async () => {
    const agentDir = path.join(tempDir, "agents", "fallback-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "SOUL.md"), "# Soul");

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("resolved-id");
    (prepareContextFilesExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sectionDir: "section",
      sectionsArray: [],
      localFilePaths: [],
    });

    await deployContextFiles("fallback-agent", { goclaw: { token: "t" } });

    expect(resolveAgentId).toHaveBeenCalledWith("fallback-agent", { goclaw: { token: "t" } });
  });

  it("falls back to slug when resolveAgentId returns null", async () => {
    const agentDir = path.join(tempDir, "agents", "slug-fallback");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "HEARTBEAT.md"), "# Heartbeat");

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prepareContextFilesExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sectionDir: "section",
      sectionsArray: [],
      localFilePaths: [],
    });

    await deployContextFiles("slug-fallback", { goclaw: { token: "t" } });

    expect(injectGhostPlaceholders).toHaveBeenCalledWith(
      "slug-fallback",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it("calls sync helpers in the same order with the same arguments", async () => {
    const agentDir = path.join(tempDir, "agents", "order-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "AGENTS.md"), "# Agents");

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-id");
    (prepareContextFilesExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sectionDir: "section-dir",
      sectionsArray: ["a", "b"],
      localFilePaths: ["f1", "f2"],
    });

    await deployContextFiles("order-agent", { goclaw: { token: "t" } });

    expect(prepareContextFilesExport).toHaveBeenCalled();
    expect(injectGhostPlaceholders).toHaveBeenCalledWith(
      "agent-id",
      { goclaw: { token: "t" } },
      path.join(tempDir, "temp_export_order-agent"),
      ["a", "b"],
      ["f1", "f2"]
    );
    expect(createContextTarball).toHaveBeenCalledWith(
      path.join(tempDir, "temp_export_order-agent"),
      path.join(tempDir, "temp_export_order-agent.tar.gz"),
      ["a", "b"]
    );
    expect(importContextArchive).toHaveBeenCalledWith(
      "agent-id",
      { goclaw: { token: "t" } },
      path.join(tempDir, "temp_export_order-agent.tar.gz"),
      ["a", "b"]
    );
    expect(forceUpdateLocalMemoryDocuments).toHaveBeenCalledWith(
      "agent-id",
      { goclaw: { token: "t" } },
      ["f1", "f2"],
      "section-dir"
    );
    expect(pruneOrphanMemoryDocuments).toHaveBeenCalledWith(
      "agent-id",
      { goclaw: { token: "t" } },
      ["f1", "f2"]
    );

  });

  it("always calls cleanupContextSyncTempFiles in finally when a sync helper throws", async () => {
    const agentDir = path.join(tempDir, "agents", "throw-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "MEMORY.md"), "# Memory");

    (resolveAgentId as ReturnType<typeof vi.fn>).mockResolvedValue("agent-id");
    (prepareContextFilesExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sectionDir: "section",
      sectionsArray: [],
      localFilePaths: [],
    });
    (createContextTarball as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("tarball fail"));

    await expect(
      deployContextFiles("throw-agent", { goclaw: { token: "t" } })
    ).rejects.toThrow("tarball fail");

    expect(cleanupContextSyncTempFiles).toHaveBeenCalledWith(
      path.join(tempDir, "temp_export_throw-agent"),
      path.join(tempDir, "temp_export_throw-agent.tar.gz")
    );
  });
});
