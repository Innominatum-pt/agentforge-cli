import { describe, expect, it, vi, beforeEach } from "vitest";
import { runPullAll } from "./runPullAll";

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

vi.mock("./pullAllAgents", () => ({
  pullAllAgents: vi.fn(),
}));

import { logger } from "../core/logger";
import { pullAllSkills } from "./pullAllSkills";
import { pullAllAgents } from "./pullAllAgents";

describe("runPullAll", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs start message", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith(
      "🔄 Iniciando sincronização completa (pull all)..."
    );
  });

  it("logs skills section header", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("\n--- [1/2] SKILLS ---");
  });

  it("calls pullAllSkills(config)", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(pullAllSkills).toHaveBeenCalledWith(config);
  });

  it("logs skills success when pullAllSkills succeeds", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("✅ Pull de skills concluído!");
  });

  it("logs skills error on pullAllSkills failure without throwing", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await expect(runPullAll(config)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull das skills:",
      "network down"
    );
  });

  it("still runs pullAllAgents after skills failure", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(pullAllAgents).toHaveBeenCalledWith(config);
  });

  it("logs agents section header", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("\n--- [2/2] AGENTS ---");
  });

  it("calls pullAllAgents(config)", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(pullAllAgents).toHaveBeenCalledWith(config);
  });

  it("logs agents success when pullAllAgents succeeds", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith("✅ Pull de agentes concluído!");
  });

  it("logs agents error on pullAllAgents failure without throwing", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("auth failed")
    );

    await expect(runPullAll(config)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro durante o pull dos agentes:",
      "auth failed"
    );
  });

  it("calls pullAllSkills before pullAllAgents", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(pullAllSkills).toHaveBeenCalledBefore(pullAllAgents as any);
  });

  it("logs final sync message", async () => {
    (pullAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (pullAllAgents as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runPullAll(config);

    expect(logger.info).toHaveBeenCalledWith(
      "\n🚀 SYNC COMPLETO! Workspace atualizado."
    );
  });
});
