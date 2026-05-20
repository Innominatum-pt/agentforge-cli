import { describe, expect, it, vi, beforeEach } from "vitest";
import { runDeployAgents } from "./runDeployAgents";

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

import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllAgents } from "./deployAllAgents";

describe("runDeployAgents", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
  });

  it("calls getWorkspaceRoot()", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAgents(config);

    expect(getWorkspaceRoot).toHaveBeenCalled();
  });

  it("calls deployAllAgents(config, basePath)", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAgents(config);

    expect(deployAllAgents).toHaveBeenCalledWith(config, "/workspace");
  });

  it("logs exact success message", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAgents(config);

    expect(logger.info).toHaveBeenCalledWith("🏁 Deploy de agentes concluído!");
  });

  it("calls deployAllAgents before logging success", async () => {
    (deployAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployAgents(config);

    expect(deployAllAgents).toHaveBeenCalledBefore(logger.info as any);
  });
});
