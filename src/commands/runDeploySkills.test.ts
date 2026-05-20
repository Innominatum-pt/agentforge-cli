import { describe, expect, it, vi, beforeEach } from "vitest";
import { runDeploySkills } from "./runDeploySkills";

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

vi.mock("./deployAllSkills", () => ({
  deployAllSkills: vi.fn(),
}));

import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllSkills } from "./deployAllSkills";

describe("runDeploySkills", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
  });

  it("calls getWorkspaceRoot()", async () => {
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkills(config);

    expect(getWorkspaceRoot).toHaveBeenCalled();
  });

  it("calls deployAllSkills(config, basePath)", async () => {
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkills(config);

    expect(deployAllSkills).toHaveBeenCalledWith(config, "/workspace");
  });

  it("logs exact success message", async () => {
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkills(config);

    expect(logger.info).toHaveBeenCalledWith("🏁 Deploy de skills concluído!");
  });

  it("calls deployAllSkills before logging success", async () => {
    (deployAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkills(config);

    expect(deployAllSkills).toHaveBeenCalledBefore(logger.info as any);
  });
});
