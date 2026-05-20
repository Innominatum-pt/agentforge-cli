import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { pullAllSkills } from "./pullAllSkills";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { getWorkspaceRoot } from "../core/workspace";
import { logger } from "../core/logger";
import * as tar from "tar";

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(),
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
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

describe("pullAllSkills", () => {
  let tempDir: string;
  let mockClient: any;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-pull-all-skills-test-"));
    vi.clearAllMocks();

    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue(tempDir);
    vi.spyOn(os, "tmpdir").mockReturnValue(tempDir);
    vi.spyOn(Date, "now").mockReturnValue(9999);

    mockClient = {
      listSkills: vi.fn(),
      exportSkillArchive: vi.fn(),
      listSkillFiles: vi.fn(),
      getSkillFileContent: vi.fn(),
    };
    (createGoclawClientFromConfig as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(tempDir);
  });

  it("empties local skills directory before pulling", async () => {
    const skillsDir = path.join(tempDir, "skills");
    await fs.ensureDir(skillsDir);
    await fs.writeFile(path.join(skillsDir, "old.txt"), "old");

    mockClient.listSkills.mockResolvedValue([]);

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(skillsDir, "old.txt"))).toBe(false);
  });

  it("creates GoClaw client and calls listSkills()", async () => {
    mockClient.listSkills.mockResolvedValue([]);

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(createGoclawClientFromConfig).toHaveBeenCalledWith({ goclaw: { token: "t" } });
    expect(mockClient.listSkills).toHaveBeenCalled();
  });

  it("places system skills under skills/system/<slug>", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s1", slug: "sys-skill", name: "Sys", is_system: true, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "sys-skill"));
      await fs.writeFile(path.join(cwd, "skills", "sys-skill", "skill.json"), "{}");
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(tempDir, "skills", "system", "sys-skill", "skill.json"))).toBe(true);
  });

  it("places non-system skills under skills/<slug>", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s2", slug: "user-skill", name: "User", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "user-skill"));
      await fs.writeFile(path.join(cwd, "skills", "user-skill", "skill.json"), "{}");
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(tempDir, "skills", "user-skill", "skill.json"))).toBe(true);
  });

  it("uses exportSkillArchive first", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s3", slug: "exp-skill", name: "Exp", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "exp-skill"));
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(mockClient.exportSkillArchive).toHaveBeenCalledWith("exp-skill");
    expect(mockClient.listSkillFiles).not.toHaveBeenCalled();
  });

  it("extracts archive into temp dir and copies extracted skills/<slug> when present", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s4", slug: "ext-skill", name: "Ext", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "ext-skill"));
      await fs.writeFile(path.join(cwd, "skills", "ext-skill", "data.json"), "{}")
      ;
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(tempDir, "skills", "ext-skill", "data.json"))).toBe(true);
  });

  it("falls back to copying tempExtractDir when extracted skills/<slug> is absent", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s5", slug: "flat-skill", name: "Flat", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.writeFile(path.join(cwd, "readme.md"), "# readme");
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(await fs.pathExists(path.join(tempDir, "skills", "flat-skill", "readme.md"))).toBe(true);
  });

  it("on export failure, warns and falls back to listSkillFiles/getSkillFileContent", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s6", slug: "fallback-skill", name: "Fallback", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockRejectedValue(new Error("export fail"));
    mockClient.listSkillFiles.mockResolvedValue([{ path: "file.txt", isDir: false }]);
    mockClient.getSkillFileContent.mockResolvedValue({ content: "hello" });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Export falhou"));
    expect(mockClient.listSkillFiles).toHaveBeenCalledWith("s6");
    expect(mockClient.getSkillFileContent).toHaveBeenCalledWith("s6", "file.txt");
  });

  it("skips directory entries in fallback download", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s7", slug: "dir-skill", name: "Dir", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockRejectedValue(new Error("export fail"));
    mockClient.listSkillFiles.mockResolvedValue([{ path: "sub/", isDir: true }, { path: "sub/file.txt", isDir: false }]);
    mockClient.getSkillFileContent.mockResolvedValue({ content: "c" });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(mockClient.getSkillFileContent).toHaveBeenCalledTimes(1);
    expect(mockClient.getSkillFileContent).toHaveBeenCalledWith("s7", "sub/file.txt");
  });

  it("writes fallback downloaded file content to the correct path", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s8", slug: "path-skill", name: "Path", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockRejectedValue(new Error("export fail"));
    mockClient.listSkillFiles.mockResolvedValue([{ path: "nested/deep.txt", isDir: false }]);
    mockClient.getSkillFileContent.mockResolvedValue({ content: "deep content" });

    await pullAllSkills({ goclaw: { token: "t" } });

    const filePath = path.join(tempDir, "skills", "path-skill", "nested", "deep.txt");
    expect(await fs.readFile(filePath, "utf8")).toBe("deep content");
  });

  it("logs per-file fallback errors with the same message", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s9", slug: "err-skill", name: "Err", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockRejectedValue(new Error("export fail"));
    mockClient.listSkillFiles.mockResolvedValue([{ path: "bad.txt", isDir: false }]);
    mockClient.getSkillFileContent.mockRejectedValue({ message: "not found", response: { data: "missing" } });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Falha no ficheiro bad.txt"));
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("missing"));
  });

  it("creates metadata.json when missing with spaces: 2", async () => {
    mockClient.listSkills.mockResolvedValue([{ id: "s10", slug: "meta-skill", name: "Meta", is_system: false, description: "d", visibility: "public", version: "2" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "meta-skill"));
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    const metaPath = path.join(tempDir, "skills", "meta-skill", "metadata.json");
    expect(await fs.pathExists(metaPath)).toBe(true);

    const content = await fs.readFile(metaPath, "utf8");
    expect(content).toContain('"id": "s10"');
    expect(content).toContain('"slug": "meta-skill"');
    // Verifica indentação com 2 espaços
    expect(content).toMatch(/^\{\n  "/m);
  });

  it("does not overwrite metadata.json when already present", async () => {
    const writeJsonSpy = vi.spyOn(fs, "writeJson").mockResolvedValue(undefined as any);
    const originalPathExists = fs.pathExists.bind(fs);
    vi.spyOn(fs, "pathExists").mockImplementation(async (filepath: any) => {
      if (typeof filepath === "string" && filepath.endsWith("metadata.json")) {
        return true;
      }
      return originalPathExists(filepath);
    });

    mockClient.listSkills.mockResolvedValue([{ id: "s11", slug: "existing-meta", name: "Existing", is_system: false, description: "", visibility: "private", version: "1" }]);
    mockClient.exportSkillArchive.mockResolvedValue(Buffer.from("tar"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "existing-meta"));
      await fs.writeFile(path.join(cwd, "skills", "existing-meta", "dummy.txt"), "");
    });

    const skillDir = path.join(tempDir, "skills", "existing-meta");
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, "metadata.json"), JSON.stringify({ custom: true }, null, 2));

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(writeJsonSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("metadata.json"),
      expect.anything(),
      expect.anything()
    );
  });

  it("logs per-skill processing errors and continues loop", async () => {
    mockClient.listSkills.mockResolvedValue([
      { id: "s12", slug: "bad-skill", name: "Bad", is_system: false, description: "", visibility: "private", version: "1" },
      { id: "s13", slug: "good-skill", name: "Good", is_system: false, description: "", visibility: "private", version: "1" },
    ]);
    mockClient.exportSkillArchive.mockImplementation((slug: string) => {
      if (slug === "bad-skill") throw new Error("bad");
      return Promise.resolve(Buffer.from("tar"));
    });
    mockClient.listSkillFiles.mockRejectedValue(new Error("list fail"));

    (tar.x as any).mockImplementation(async ({ cwd }: any) => {
      await fs.ensureDir(path.join(cwd, "skills", "good-skill"));
    });

    await pullAllSkills({ goclaw: { token: "t" } });

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Erro processando skill bad-skill"));
    expect(await fs.pathExists(path.join(tempDir, "skills", "good-skill"))).toBe(true);
  });
});
