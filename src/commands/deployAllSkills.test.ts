import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { deployAllSkills } from "./deployAllSkills";

vi.mock("./deploySkill", () => ({
  deploySkill: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { deploySkill } from "./deploySkill";
import { logger } from "../core/logger";

describe("deployAllSkills", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-deploy-all-skills-test-"));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("logs 'Nenhuma skill encontrada em skills/.' when skills directory is missing", async () => {
    await deployAllSkills({ goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith("Nenhuma skill encontrada em skills/.");
    expect(deploySkill).not.toHaveBeenCalled();
  });

  it("logs batch start message", async () => {
    const skillsDir = path.join(tempDir, "skills");
    await fs.ensureDir(skillsDir);
    await fs.ensureDir(path.join(skillsDir, "skill-a"));

    await deployAllSkills({ goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith("🚀 Iniciando deploy em lote de skills...");
  });

  it("calls deploySkill only for directories", async () => {
    const skillsDir = path.join(tempDir, "skills");
    await fs.ensureDir(skillsDir);
    await fs.ensureDir(path.join(skillsDir, "skill-a"));
    await fs.ensureDir(path.join(skillsDir, "skill-b"));
    await fs.writeFile(path.join(skillsDir, "file.txt"), "not a dir");

    await deployAllSkills({ goclaw: { token: "t" } }, tempDir);

    expect(deploySkill).toHaveBeenCalledWith("skill-a", { goclaw: { token: "t" } }, tempDir);
    expect(deploySkill).toHaveBeenCalledWith("skill-b", { goclaw: { token: "t" } }, tempDir);
    expect(deploySkill).toHaveBeenCalledTimes(2);
  });

  it("skips system directory and logs the exact skip message", async () => {
    const skillsDir = path.join(tempDir, "skills");
    await fs.ensureDir(skillsDir);
    await fs.ensureDir(path.join(skillsDir, "system"));
    await fs.ensureDir(path.join(skillsDir, "my-skill"));

    await deployAllSkills({ goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith(
      "⏩ Ignorando pasta 'system/' (skills nativas do GoClaw são apenas de leitura)"
    );
    expect(deploySkill).not.toHaveBeenCalledWith("system", expect.anything(), expect.anything());
    expect(deploySkill).toHaveBeenCalledWith("my-skill", { goclaw: { token: "t" } }, tempDir);
  });

  it("passes basePath to deploySkill(item, config, basePath)", async () => {
    const skillsDir = path.join(tempDir, "skills");
    await fs.ensureDir(skillsDir);
    await fs.ensureDir(path.join(skillsDir, "single-skill"));

    await deployAllSkills({ goclaw: { token: "t" } }, tempDir);

    expect(deploySkill).toHaveBeenCalledWith(
      "single-skill",
      { goclaw: { token: "t" } },
      tempDir
    );
  });
});
