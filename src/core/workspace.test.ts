import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { getWorkspaceRoot } from "./workspace";

describe("getWorkspaceRoot", () => {
  const originalCwd = process.cwd;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-workspace-test-"));
    process.cwd = vi.fn().mockReturnValue(tempDir);
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    await fs.remove(tempDir);
  });

  it("returns current directory when agentforge.json exists", async () => {
    await fs.writeFile(path.join(tempDir, "agentforge.json"), "{}");
    expect(getWorkspaceRoot()).toBe(tempDir);
  });

  it("returns current directory when agentforge.yml exists", async () => {
    await fs.writeFile(path.join(tempDir, "agentforge.yml"), "{}");
    expect(getWorkspaceRoot()).toBe(tempDir);
  });

  it("walks up directories to find agentforge.json", async () => {
    const nested = path.join(tempDir, "a", "b", "c");
    await fs.ensureDir(nested);
    await fs.writeFile(path.join(tempDir, "agentforge.json"), "{}");
    process.cwd = vi.fn().mockReturnValue(nested);
    expect(getWorkspaceRoot()).toBe(tempDir);
  });

  it("calls process.exit(1) when workspace root is not found", async () => {
    const nested = path.join(tempDir, "a", "b", "c");
    await fs.ensureDir(nested);
    process.cwd = vi.fn().mockReturnValue(nested);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as any);

    expect(() => getWorkspaceRoot()).toThrow("process.exit called");
    exitSpy.mockRestore();
  });
});
