import { describe, expect, it, vi, beforeEach } from "vitest";
import { runPullAll } from "./runPullAll";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("./runPullSkills", () => ({
  runPullSkills: vi.fn(),
}));

vi.mock("./runPullAgents", () => ({
  runPullAgents: vi.fn(),
}));

import { logger } from "../core/logger";
import { runPullSkills } from "./runPullSkills";
import { runPullAgents } from "./runPullAgents";

describe("runPullAll", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs full sync start message", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith(
      "🔄 Iniciando sincronização completa (pull all)..."
    );
  });

  it("logs skills section header", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("\n--- [1/2] SKILLS ---");
  });

  it("calls runPullSkills(config)", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(runPullSkills).toHaveBeenCalledWith(config);
  });

  it("logs agents section header", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("\n--- [2/2] AGENTS ---");
  });

  it("calls runPullAgents(config)", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(runPullAgents).toHaveBeenCalledWith(config);
  });

  it("calls runPullSkills before runPullAgents", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(runPullSkills).toHaveBeenCalledBefore(runPullAgents as any);
  });

  it("logs final sync message", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith(
      "\n🚀 SYNC COMPLETO! Workspace atualizado."
    );
  });

  it("does not call pullAllSkills or pullAllAgents directly", async () => {
    (runPullSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (runPullAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(runPullSkills).toHaveBeenCalledWith(config);
    expect(runPullAgents).toHaveBeenCalledWith(config);
  });
});
