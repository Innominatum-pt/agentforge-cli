import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { buildSkill } from "./buildSkill";

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

import { getWorkspaceRoot } from "../core/workspace";

describe("buildSkill", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-build-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("builds a zip under exports when skill exists", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "my-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "my-skill", "SKILL.md"), "# Skill");

    await buildSkill("my-skill");

    const zipPath = path.join(tempDir, "exports", "my-skill.zip");
    expect(await fs.pathExists(zipPath)).toBe(true);
  });

  it("creates exports directory if missing", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "test-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "test-skill", "SKILL.md"), "# Skill");

    expect(await fs.pathExists(path.join(tempDir, "exports"))).toBe(false);

    await buildSkill("test-skill");

    expect(await fs.pathExists(path.join(tempDir, "exports"))).toBe(true);
  });

  it("calls process.exit(1) when skill does not exist", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as any);

    await expect(buildSkill("missing-skill")).rejects.toThrow("process.exit called");
    exitSpy.mockRestore();
  });

  it("preserves zip filename as `${slug}.zip`", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "special-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "special-skill", "SKILL.md"), "# Skill");

    await buildSkill("special-skill");

    const zipPath = path.join(tempDir, "exports", "special-skill.zip");
    expect(await fs.pathExists(zipPath)).toBe(true);
  });
});
