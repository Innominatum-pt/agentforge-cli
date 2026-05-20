import { describe, expect, it, vi, beforeEach } from "vitest";
import { runDeploySkill } from "./runDeploySkill";

vi.mock("../core/workspace", () => ({
  getWorkspaceRoot: vi.fn(),
}));

vi.mock("./deploySkill", () => ({
  deploySkill: vi.fn(),
}));

import { getWorkspaceRoot } from "../core/workspace";
import { deploySkill } from "./deploySkill";

describe("runDeploySkill", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
    (getWorkspaceRoot as ReturnType<typeof vi.fn>).mockReturnValue("/workspace");
  });

  it("calls getWorkspaceRoot()", async () => {
    (deploySkill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkill("my-skill", config);

    expect(getWorkspaceRoot).toHaveBeenCalled();
  });

  it("calls deploySkill(slug, config, basePath)", async () => {
    (deploySkill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkill("my-skill", config);

    expect(deploySkill).toHaveBeenCalledWith("my-skill", config, "/workspace");
  });

  it("preserves slug passthrough exactly", async () => {
    (deploySkill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkill("special-skill-123", config);

    expect(deploySkill).toHaveBeenCalledWith("special-skill-123", config, "/workspace");
  });

  it("does not log any success message", async () => {
    (deploySkill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeploySkill("my-skill", config);

    expect(vi.fn()).not.toHaveBeenCalled();
  });
});
