import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  collectFilesRecursive,
  prepareContextFilesExport,
} from "../../src/sync/contextSync";

let tmpDir = "";

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsync-"));
});

afterEach(async () => {
  if (tmpDir) await fs.remove(tmpDir);
});

describe("collectFilesRecursive", () => {
  it("returns relative slash-normalized paths", async () => {
    const base = path.join(tmpDir, "section");
    await fs.ensureDir(path.join(base, "nested"));
    await fs.writeFile(path.join(base, "a.md"), "a");
    await fs.writeFile(path.join(base, "nested", "b.md"), "b");

    const result = await collectFilesRecursive(base, base);
    expect(result).toContain("a.md");
    expect(result).toContain("nested/b.md");
    expect(result).not.toContain(base);
  });
});

describe("prepareContextFilesExport", () => {
  it("turns memory_foo.md into localFilePaths entry memory/foo.md", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const tempExportDir = path.join(tmpDir, "export");
    const tarPath = path.join(tmpDir, "export.tar.gz");

    await fs.ensureDir(agentPath);
    await fs.writeFile(path.join(agentPath, "memory_foo.md"), "content");

    const result = await prepareContextFilesExport(
      "test-agent",
      agentPath,
      tempExportDir,
      tarPath,
      ["memory_foo.md"]
    );

    expect(result.localFilePaths).toContain("memory/foo.md");
  });

  it("turns _system_rules.md into localFilePaths entry _system/rules.md", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const tempExportDir = path.join(tmpDir, "export");
    const tarPath = path.join(tmpDir, "export.tar.gz");

    await fs.ensureDir(agentPath);
    await fs.writeFile(path.join(agentPath, "_system_rules.md"), "content");

    const result = await prepareContextFilesExport(
      "test-agent",
      agentPath,
      tempExportDir,
      tarPath,
      ["_system_rules.md"]
    );

    expect(result.localFilePaths).toContain("_system/rules.md");
  });

  it("preserves SOUL.md as SOUL.md", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const tempExportDir = path.join(tmpDir, "export");
    const tarPath = path.join(tmpDir, "export.tar.gz");

    await fs.ensureDir(agentPath);
    await fs.writeFile(path.join(agentPath, "SOUL.md"), "content");

    const result = await prepareContextFilesExport(
      "test-agent",
      agentPath,
      tempExportDir,
      tarPath,
      ["SOUL.md"]
    );

    expect(result.localFilePaths).toContain("SOUL.md");
  });

  it("flattens top-level directories one level with flatName = item_sub", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const tempExportDir = path.join(tmpDir, "export");
    const tarPath = path.join(tmpDir, "export.tar.gz");

    await fs.ensureDir(path.join(agentPath, "memory"));
    await fs.writeFile(path.join(agentPath, "memory", "foo.md"), "content");

    const result = await prepareContextFilesExport(
      "test-agent",
      agentPath,
      tempExportDir,
      tarPath,
      ["memory"]
    );

    expect(result.localFilePaths).toContain("memory/foo.md");
  });
});
