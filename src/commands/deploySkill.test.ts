import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { deploySkill } from "./deploySkill";

const mockUploadSkillArchive = vi.fn();
const mockListSkills = vi.fn();
const mockUpdateSkill = vi.fn();
const mockGrantSkillToAgent = vi.fn();

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(() => ({
    uploadSkillArchive: mockUploadSkillArchive,
    listSkills: mockListSkills,
    updateSkill: mockUpdateSkill,
    grantSkillToAgent: mockGrantSkillToAgent,
  })),
}));

vi.mock("../core/agentResolution", () => ({
  resolveAgentId: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from "../core/logger";
import { resolveAgentId } from "../core/agentResolution";

describe("deploySkill", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-deploy-test-"));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("returns and logs error when skill path does not exist", async () => {
    await deploySkill("missing-skill", {}, tempDir);

    expect(logger.error).toHaveBeenCalledWith(
      `❌ A skill "missing-skill" não foi encontrada em skills/missing-skill.`
    );
  });

  it("preserves safeSlug zip filename behaviour for slugs containing slash/backslash", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "foo/bar"));
    await fs.writeFile(path.join(tempDir, "skills", "foo/bar", "SKILL.md"), "# Skill");

    mockUploadSkillArchive.mockResolvedValue({ version: 1 });
    mockListSkills.mockResolvedValue([]);

    await deploySkill("foo/bar", { goclaw: { token: "t" } }, tempDir);

    const zipPath = path.join(tempDir, "exports", "foo_bar.zip");
    expect(await fs.pathExists(zipPath)).toBe(true);
  });

  it("uploads zip using client.uploadSkillArchive", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "my-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "my-skill", "SKILL.md"), "# Skill");

    mockUploadSkillArchive.mockResolvedValue({ version: 2 });
    mockListSkills.mockResolvedValue([]);

    await deploySkill("my-skill", { goclaw: { token: "t" } }, tempDir);

    expect(mockUploadSkillArchive).toHaveBeenCalled();
    const formArg = mockUploadSkillArchive.mock.calls[0][0];
    expect(formArg).toBeDefined();
  });

  it("logs versioned success message when upload response has version", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "v-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "v-skill", "SKILL.md"), "# Skill");

    mockUploadSkillArchive.mockResolvedValue({ version: 5 });
    mockListSkills.mockResolvedValue([]);

    await deploySkill("v-skill", { goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith(
      `✅ Arquivos da skill "v-skill" atualizados (versão 5).`
    );
  });

  it("logs plain success message when upload response has no version", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "plain-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "plain-skill", "SKILL.md"), "# Skill");

    mockUploadSkillArchive.mockResolvedValue({});
    mockListSkills.mockResolvedValue([]);

    await deploySkill("plain-skill", { goclaw: { token: "t" } }, tempDir);

    expect(logger.info).toHaveBeenCalledWith(
      `✅ Arquivos da skill "plain-skill" atualizados.`
    );
  });

  it("updates metadata while removing id, slug, and name from payload", async () => {
    const skillDir = path.join(tempDir, "skills", "meta-skill");
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Skill");
    await fs.writeJson(path.join(skillDir, "metadata.json"), {
      id: 99,
      slug: "meta-skill",
      name: "Meta",
      description: "desc",
      visibility: "public",
    });

    mockUploadSkillArchive.mockResolvedValue({});
    mockListSkills.mockResolvedValue([{ id: 42, slug: "meta-skill" }]);

    await deploySkill("meta-skill", { goclaw: { token: "t" } }, tempDir);

    expect(mockUpdateSkill).toHaveBeenCalledWith(42, {
      description: "desc",
      visibility: "public",
    });
  });

  it("grants skill to resolved agents from grants.jsonl using pinned_version or null", async () => {
    const skillDir = path.join(tempDir, "skills", "grant-skill");
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Skill");
    await fs.writeFile(
      path.join(skillDir, "grants.jsonl"),
      '{"agent_key":"agent-a","pinned_version":3}\n{"agent_key":"agent-b"}\n'
    );

    mockUploadSkillArchive.mockResolvedValue({});
    mockListSkills.mockResolvedValue([{ id: 7, slug: "grant-skill" }]);
    (resolveAgentId as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === "agent-a") return Promise.resolve("id-a");
      if (key === "agent-b") return Promise.resolve("id-b");
      return Promise.resolve(null);
    });

    await deploySkill("grant-skill", { goclaw: { token: "t" } }, tempDir);

    expect(mockGrantSkillToAgent).toHaveBeenCalledWith(7, {
      agent_id: "id-a",
      version: 3,
    });
    expect(mockGrantSkillToAgent).toHaveBeenCalledWith(7, {
      agent_id: "id-b",
      version: null,
    });
  });

  it("logs outer deploy error with the same two logger.error calls", async () => {
    await fs.ensureDir(path.join(tempDir, "skills", "fail-skill"));
    await fs.writeFile(path.join(tempDir, "skills", "fail-skill", "SKILL.md"), "# Skill");

    mockUploadSkillArchive.mockRejectedValue(new Error("network fail"));
    mockListSkills.mockResolvedValue([]);

    await deploySkill("fail-skill", { goclaw: { token: "t" } }, tempDir);

    expect(logger.error).toHaveBeenCalledWith(
      `❌ Erro no deploy da skill "fail-skill":`
    );
    expect(logger.error).toHaveBeenCalledWith("network fail");
  });
});
