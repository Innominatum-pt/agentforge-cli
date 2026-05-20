import { describe, expect, it, vi, beforeEach } from "vitest";
import { confirmPullOverwrite } from "./pullConfirmation";

vi.mock("../core/prompts", () => ({
  confirmOverwrite: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { confirmOverwrite } from "../core/prompts";
import { logger } from "../core/logger";

describe("confirmPullOverwrite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls confirmOverwrite(target)", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await confirmPullOverwrite("skills");
    expect(confirmOverwrite).toHaveBeenCalledWith("skills");
  });

  it("returns true when confirmOverwrite returns true", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await confirmPullOverwrite("skills");
    expect(result).toBe(true);
  });

  it("returns false when confirmOverwrite returns false", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await confirmPullOverwrite("skills");
    expect(result).toBe(false);
  });

  it("logs exact cancellation message when confirmOverwrite returns false", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    await confirmPullOverwrite("skills");
    expect(logger.info).toHaveBeenCalledWith("❌ Pull cancelado pelo utilizador.");
  });

  it("does not log cancellation message when confirmOverwrite returns true", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await confirmPullOverwrite("skills");
    expect(logger.info).not.toHaveBeenCalledWith("❌ Pull cancelado pelo utilizador.");
  });

  it("preserves target passthrough for skills", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await confirmPullOverwrite("skills");
    expect(confirmOverwrite).toHaveBeenCalledWith("skills");
  });

  it("preserves target passthrough for agentes", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await confirmPullOverwrite("agentes");
    expect(confirmOverwrite).toHaveBeenCalledWith("agentes");
  });

  it("preserves target passthrough for TUDO (agentes e skills)", async () => {
    (confirmOverwrite as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await confirmPullOverwrite("TUDO (agentes e skills)");
    expect(confirmOverwrite).toHaveBeenCalledWith("TUDO (agentes e skills)");
  });
});
