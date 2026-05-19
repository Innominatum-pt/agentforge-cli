import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { createNewAgent } from "./newAgent";

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("../core/config", () => ({
  getConfig: vi.fn(),
}));

import { getWorkspaceRoot } from "../core/workspace";
import { getConfig } from "../core/config";

describe("createNewAgent", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-new-agent-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
    (getConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no config"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("creates expected directory using slugified name", async () => {
    await createNewAgent("My Agent");

    const agentPath = path.join(tempDir, "agents", "my-agent");
    expect(await fs.pathExists(agentPath)).toBe(true);
    expect((await fs.stat(agentPath)).isDirectory()).toBe(true);
  });

  it("creates AGENTS.md from template when template exists", async () => {
    await createNewAgent("Test Agent");

    const agentPath = path.join(tempDir, "agents", "test-agent");
    expect(await fs.pathExists(path.join(agentPath, "AGENTS.md"))).toBe(true);
  });

  it("preserves expected heading/content in generated files", async () => {
    await createNewAgent("Test Agent");

    const agentPath = path.join(tempDir, "agents", "test-agent");
    const soulContent = await fs.readFile(path.join(agentPath, "SOUL.md"), "utf-8");
    expect(soulContent).toContain("Core Truths");

    const heartbeatContent = await fs.readFile(path.join(agentPath, "HEARTBEAT.md"), "utf-8");
    expect(heartbeatContent).toContain("Heartbeat");
  });

  it("slugifies name with lower/strict behaviour", async () => {
    await createNewAgent("My Special Agent!");

    const agentPath = path.join(tempDir, "agents", "my-special-agent");
    expect(await fs.pathExists(agentPath)).toBe(true);
  });

  it("calls process.exit(1) when agent already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "agents", "existing-agent"));

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as any);

    await expect(createNewAgent("existing agent")).rejects.toThrow("process.exit called");
    exitSpy.mockRestore();
  });
});
