import { describe, expect, it, vi, beforeEach } from "vitest";
import { runPullSkills } from "./runPullSkills";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("./pullAllSkills", () => ({
  pullAllSkills: vi.fn(),
}));

import { logger } from "../core/logger";
import { pullAllSkills } from "./pullAllSkills";

describe("runPullSkills", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls pullAllSkills(config)", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullSkills(config);

    expect(pullAllSkills).toHaveBeenCalledWith(config);
  });

  it("logs exact success message when pullAllSkills succeeds", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullSkills(config);

    expect(logger.info).toHaveBeenCalledWith(
      "✅ Pull de skills concluído com sucesso! As skills foram atualizadas localmente."
    );
  });

  it("logs error header when pullAllSkills fails", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("❌ Erro durante o pull das skills:");
  });

  it("logs Status HTTP 403 when error.response.status is 403", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 403 },
    });

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("Status HTTP 403");
  });

  it("logs Status HTTP 401 when error.status is 401", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue({
      status: 401,
    });

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("Status HTTP 401");
  });

  it("logs error.responseData when present and no status exists", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue({
      responseData: "custom error payload",
    });

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("custom error payload");
  });

  it("logs error.response.data when responseData is absent and no status exists", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: "response data error" },
    });

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("response data error");
  });

  it("logs error.message when responseData and response.data are absent", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("fallback message")
    );

    await runPullSkills(config);

    expect(logger.error).toHaveBeenCalledWith("fallback message");
  });

  it("does not throw on failure", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );

    await expect(runPullSkills(config)).resolves.toBeUndefined();
  });
});
