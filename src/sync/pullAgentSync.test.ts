import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  buildMemoryPathMap,
  reconstructExtractedContextFiles,
} from "../../src/sync/pullAgentSync";

let tmpDir = "";

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pullagent-"));
});

afterEach(async () => {
  if (tmpDir) await fs.remove(tmpDir);
});

describe("buildMemoryPathMap", () => {
  it("maps memory/foo.md to key memory_foo.md with value memory/foo.md", () => {
    expect(buildMemoryPathMap([{ path: "memory/foo.md" }])).toEqual({
      "memory_foo.md": "memory/foo.md",
    });
  });

  it("maps memory/nested/foo.md to key memory_nested_foo.md", () => {
    expect(buildMemoryPathMap([{ path: "memory/nested/foo.md" }])).toEqual({
      "memory_nested_foo.md": "memory/nested/foo.md",
    });
  });

  it("maps _system/rules.md to key _system_rules.md", () => {
    expect(buildMemoryPathMap([{ path: "_system/rules.md" }])).toEqual({
      "_system_rules.md": "_system/rules.md",
    });
  });

  it("skips documents without path", () => {
    expect(buildMemoryPathMap([{ id: "x" } as any])).toEqual({});
  });

  it("preserves d.path exactly as value", () => {
    const result = buildMemoryPathMap([{ path: "memory\\foo.md" }]);
    expect(result).toEqual({
      "memory_foo.md": "memory\\foo.md",
    });
  });

  it("overwrites earlier entry when flattened keys collide", () => {
    const result = buildMemoryPathMap([
      { path: "memory/foo.md" },
      { path: "memory\\foo.md" },
    ]);
    expect(result).toEqual({
      "memory_foo.md": "memory\\foo.md",
    });
  });
});

describe("reconstructExtractedContextFiles", () => {
  it("removes ghost file whose content is exactly ' '", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "SOUL.md"), " ");

    await reconstructExtractedContextFiles(agentPath, {});

    expect(await fs.pathExists(path.join(contextDir, "SOUL.md"))).toBe(false);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });

  it("removes ghost file whose content is empty", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "HEARTBEAT.md"), "");

    await reconstructExtractedContextFiles(agentPath, {});

    expect(await fs.pathExists(path.join(contextDir, "HEARTBEAT.md"))).toBe(false);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });

  it("moves memory_foo.md to memory/foo.md when pathMap maps it", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "memory_foo.md"), "hello");

    await reconstructExtractedContextFiles(agentPath, {
      "memory_foo.md": "memory/foo.md",
    });

    expect(await fs.pathExists(path.join(agentPath, "memory", "foo.md"))).toBe(true);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });

  it("moves _system_rules.md to _system/rules.md when pathMap maps it", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "_system_rules.md"), "rules");

    await reconstructExtractedContextFiles(agentPath, {
      "_system_rules.md": "_system/rules.md",
    });

    expect(await fs.pathExists(path.join(agentPath, "_system", "rules.md"))).toBe(true);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });

  it("falls back to filename when pathMap has no entry", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "CAPABILITIES.md"), "caps");

    await reconstructExtractedContextFiles(agentPath, {});

    expect(await fs.pathExists(path.join(agentPath, "CAPABILITIES.md"))).toBe(true);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });

  it("removes _system_ and memory_ stubs when pathMap has no entry", async () => {
    const agentPath = path.join(tmpDir, "agents", "test-agent");
    const contextDir = path.join(agentPath, "context_files");
    await fs.ensureDir(contextDir);
    await fs.writeFile(path.join(contextDir, "_system_dreaming.md"), "dream");
    await fs.writeFile(path.join(contextDir, "memory_global.md"), "global");

    await reconstructExtractedContextFiles(agentPath, {});

    expect(await fs.pathExists(path.join(agentPath, "_system_dreaming.md"))).toBe(false);
    expect(await fs.pathExists(path.join(agentPath, "memory_global.md"))).toBe(false);
    expect(await fs.pathExists(contextDir)).toBe(false);
  });
});
