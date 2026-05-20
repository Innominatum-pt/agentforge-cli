import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { pullAgent } from "./pullAgent";

const mockExportAgentArchive = vi.fn();
const mockListMemoryDocuments = vi.fn();

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(() => ({
    exportAgentArchive: mockExportAgentArchive,
    listMemoryDocuments: mockListMemoryDocuments,
  })),
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("../sync/pullAgentSync", () => ({
  buildMemoryPathMap: vi.fn(),
  reconstructExtractedContextFiles: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("tar", () => ({
  x: vi.fn(),
}));

import { createGoclawClientFromConfig } from "../goclaw/client";
import { getWorkspaceRoot } from "../core/workspace";
import { buildMemoryPathMap, reconstructExtractedContextFiles } from "../sync/pullAgentSync";
import { logger } from "../core/logger";
import * as tar from "tar";

describe("pullAgent", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-pull-agent-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("logs download start message", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "my-agent");
    await fs.ensureDir(agentDir);

    await pullAgent("my-agent", "agent-123", { goclaw: { token: "t" } });

    expect(logger.info).toHaveBeenCalledWith("📦 Baixando agente: my-agent...");
  });

  it("creates GoClaw client and calls exportAgentArchive(agentId)", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-a");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-a", "id-1", { goclaw: { token: "t" } });

    expect(createGoclawClientFromConfig).toHaveBeenCalledWith({ goclaw: { token: "t" } });
    expect(mockExportAgentArchive).toHaveBeenCalledWith("id-1");
  });

  it("writes export stream to temp tar path", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-b");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-b", "id-2", { goclaw: { token: "t" } });

    const expectedTarPath = path.join(tempDir, "temp_agent_agent-b.tar.gz");
    expect(await fs.pathExists(expectedTarPath)).toBe(false); // cleaned up in finally
  });

  it("empties existing local agent directory", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "existing-agent");
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, "old.json"), "{}");

    await pullAgent("existing-agent", "id-3", { goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(agentDir, "old.json"))).toBe(false);
  });

  it("creates missing local agent directory", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    await pullAgent("new-agent", "id-4", { goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(tempDir, "agents", "new-agent"))).toBe(true);
  });

  it("calls listMemoryDocuments(agentId)", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([{ id: "doc1" }]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-c");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-c", "id-5", { goclaw: { token: "t" } });

    expect(mockListMemoryDocuments).toHaveBeenCalledWith("id-5");
  });

  it("calls buildMemoryPathMap(memoryDocs)", async () => {
    const stream = Readable.from(["tar content"]);
    const docs = [{ id: "d1" }];
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue(docs);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map([["k", "v"]]));
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-d");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-d", "id-6", { goclaw: { token: "t" } });

    expect(buildMemoryPathMap).toHaveBeenCalledWith(docs);
  });

  it("extracts tar with filter preserving only agent.json and context_files/", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-e");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-e", "id-7", { goclaw: { token: "t" } });

    expect(tar.x).toHaveBeenCalled();
    const tarCall = (tar.x as any).mock.calls[0][0];
    expect(tarCall.file).toBe(path.join(tempDir, "temp_agent_agent-e.tar.gz"));
    expect(tarCall.cwd).toBe(agentDir);
    expect(tarCall.strip).toBe(0);

    const filter = tarCall.filter;
    expect(filter("agent.json")).toBe(true);
    expect(filter("context_files/SOUL.md")).toBe(true);
    expect(filter("other.txt")).toBe(false);
  });

  it("calls reconstructExtractedContextFiles(agentPath, pathMap)", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    const map = new Map([["p1", "v1"]]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(map);
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-f");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-f", "id-8", { goclaw: { token: "t" } });

    expect(reconstructExtractedContextFiles).toHaveBeenCalledWith(agentDir, map);
  });

  it("removes temp tar in finally when extraction succeeds", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockResolvedValue([]);
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());
    (tar.x as any).mockResolvedValue(undefined);

    const agentDir = path.join(tempDir, "agents", "agent-g");
    await fs.ensureDir(agentDir);

    await pullAgent("agent-g", "id-9", { goclaw: { token: "t" } });

    const tarPath = path.join(tempDir, "temp_agent_agent-g.tar.gz");
    expect(await fs.pathExists(tarPath)).toBe(false);
  });

  it("removes temp tar in finally when extraction fails", async () => {
    const stream = Readable.from(["tar content"]);
    mockExportAgentArchive.mockResolvedValue(stream);
    mockListMemoryDocuments.mockRejectedValue(new Error("list fail"));
    (buildMemoryPathMap as ReturnType<typeof vi.fn>).mockReturnValue(new Map());

    const agentDir = path.join(tempDir, "agents", "agent-h");
    await fs.ensureDir(agentDir);

    await expect(
      pullAgent("agent-h", "id-10", { goclaw: { token: "t" } })
    ).rejects.toThrow("list fail");

    const tarPath = path.join(tempDir, "temp_agent_agent-h.tar.gz");
    expect(await fs.pathExists(tarPath)).toBe(false);
  });
});
