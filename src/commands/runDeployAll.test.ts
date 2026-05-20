import { describe, expect, it, vi, beforeEach } from "vitest";
import { runDeployAll } from "./runDeployAll";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("./deployAllAgents", () => ({
  deployAllAgents: vi.fn(),
}));

vi.mock("./deployAllSkills", () => ({
  deployAllSkills: vi.fn(),
}));

import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllAgents } from "./deployAllAgents";
import { deployAllSkills } from "./deployAllSkills";

describe("runDeployAll", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
  });

  it("calls getWorkspaceRoot()", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(getWorkspaceRoot).toHaveBeenCalled();
  });

  it("calls deployAllAgents(config, basePath)", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(deployAllAgents).toHaveBeenCalledWith(config, "/workspace");
  });

  it("calls deployAllSkills(config, basePath)", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(deployAllSkills).toHaveBeenCalledWith(config, "/workspace");
  });

  it("calls deployAllAgents before deployAllSkills", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(deployAllAgents).toHaveBeenCalledBefore(deployAllSkills as any);
  });

  it("logs exact success message", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(logger.info).toHaveBeenCalledWith("🏁 Deploy completo (agentes e skills) concluído!");
  });

  it("logs success only after deployAllSkills", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAll(config);

    expect(deployAllSkills).toHaveBeenCalledBefore(logger.info as any);
  });
});
