import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { createNewSkill } from "./newSkill";

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

import { getWorkspaceRoot } from "../core/workspace";

describe("createNewSkill", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-new-skill-test-"));
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("creates expected directory using slugified name", async () => {
    await createNewSkill("My Skill");

    const skillPath = path.join(tempDir, "skills", "my-skill");
    expect(await fs.pathExists(skillPath)).toBe(true);
    expect((await fs.stat(skillPath)).isDirectory()).toBe(true);
  });

  it("creates SKILL.md when template exists", async () => {
    await createNewSkill("Test Skill");

    const skillPath = path.join(tempDir, "skills", "test-skill");
    expect(await fs.pathExists(path.join(skillPath, "SKILL.md"))).toBe(true);
  });

  it("preserves expected heading/content in generated SKILL.md", async () => {
    await createNewSkill("Test Skill");

    const skillPath = path.join(tempDir, "skills", "test-skill");
    const content = await fs.readFile(path.join(skillPath, "SKILL.md"), "utf-8");
    expect(content).toContain('name: "Test Skill"');
    expect(content).toContain("## Instruções");
  });

  it("slugifies name with lower/strict behaviour", async () => {
    await createNewSkill("My Special Skill!");

    const skillPath = path.join(tempDir, "skills", "my-special-skill");
    expect(await fs.pathExists(skillPath)).toBe(true);
  });

  it("calls process.exit(1) when skill already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "existing-skill"));

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as any);

    await expect(createNewSkill("existing skill")).rejects.toThrow("process.exit called");
    exitSpy.mockRestore();
  });
});
