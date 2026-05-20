import { describe, expect, it, vi, beforeEach } from "vitest";
import { runDeployContext } from "./runDeployContext";

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("./deployContextFiles", () => ({
  deployContextFiles: vi.fn(),
}));

import { logger } from "../core/logger";
import { deployContextFiles } from "./deployContextFiles";

describe("runDeployContext", () => {
  const config = { goclaw: { token: "t" } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs exact start message with slug", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployContext("my-agent", config);

    expect(logger.info).toHaveBeenCalledWith(
      `🚀 Sincronizando arquivos de contexto do agente "my-agent"...`
    );
  });

  it("calls deployContextFiles(slug, config)", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployContext("my-agent", config);

    expect(deployContextFiles).toHaveBeenCalledWith("my-agent", config);
  });

  it("logs exact success message when deployContextFiles succeeds", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await runDeployContext("my-agent", config);

    expect(logger.info).toHaveBeenCalledWith("✅ Deploy de contexto concluído!");
  });

  it("logs error.responseData when present", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockRejectedValue({
      responseData: "custom payload",
    });

    await runDeployContext("my-agent", config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro ao enviar contexto:",
      "custom payload"
    );
  });

  it("logs error.response.data when responseData is absent", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: "response data error" },
    });

    await runDeployContext("my-agent", config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro ao enviar contexto:",
      "response data error"
    );
  });

  it("logs error.message when responseData and response.data are absent", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("fallback message")
    );

    await runDeployContext("my-agent", config);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Erro ao enviar contexto:",
      "fallback message"
    );
  });

  it("does not throw on failure", async () => {
    (deployContextFiles as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );

    await expect(runDeployContext("my-agent", config)).resolves.toBeUndefined();
  });
});
