import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { initWorkspace } from "./initWorkspace";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from "../core/logger";

describe("initWorkspace", () => {
  let tempDir: string;
  const originalCwd = process.cwd;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-init-test-"));
    process.cwd = () => tempDir;
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    await fs.remove(tempDir);
    vi.clearAllMocks();
  });

  it("creates expected folders", async () => {
    await initWorkspace();

    expect(await fs.pathExists(path.join(tempDir, "agents"))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, "documents"))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, "templates/default-agent"))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, "exports"))).toBe(true);
  });

  it("writes agentforge.json with expected config", async () => {
    await initWorkspace();

    const configPath = path.join(tempDir, "agentforge.json");
    expect(await fs.pathExists(configPath)).toBe(true);

    const config = await fs.readJson(configPath);
    expect(config.workspace).toBe("agentforge");
    expect(config.version).toBe(1);
  });

  it("writes config with version 1 and default GoClaw values", async () => {
    await initWorkspace();

    const config = await fs.readJson(path.join(tempDir, "agentforge.json"));
    expect(config.goclaw.api_url).toBe("http://localhost:18790");
    expect(config.goclaw.username).toBe("system");
    expect(config.goclaw.token).toBe("");
    expect(config.goclaw.default_provider).toBe("ollama-cloud");
    expect(config.goclaw.default_model).toBe("deepseek-v4-pro");
    expect(config.goclaw.skills_import_endpoint).toBe("/v1/skills/import");
    expect(config.goclaw.skills_export_endpoint).toBe("/v1/skills/export");
  });

  it("writes config with JSON spaces: 2", async () => {
    await initWorkspace();

    const raw = await fs.readFile(path.join(tempDir, "agentforge.json"), "utf-8");
    const lines = raw.split("\n");
    expect(lines.some((l) => l.startsWith("  "))).toBe(true);
  });

  it("creates README.md", async () => {
    await initWorkspace();

    const readmePath = path.join(tempDir, "README.md");
    expect(await fs.pathExists(readmePath)).toBe(true);
  });

  it("logs success message", async () => {
    await initWorkspace();

    expect(logger.info).toHaveBeenCalledWith("Workspace de agentes criado com sucesso.");
  });
});
