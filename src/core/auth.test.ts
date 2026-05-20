import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { requireGoclawToken, getRequiredGoclawConfig } from "./auth";

vi.mock("./logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("./config", () => ({
  getConfig: vi.fn(),
}));

import { logger } from "./logger";
import { getConfig } from "./config";

describe("requireGoclawToken", () => {
  let mockExit: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    vi.restoreAllMocks();
  });

  it("does nothing when config.goclaw.token exists", () => {
    expect(() =>
      requireGoclawToken({ goclaw: { token: "t" } }, "msg")
    ).not.toThrow();
    expect(logger.error).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("logs the exact provided message when token is missing", () => {
    const msg = "❌ Custom missing token message";
    expect(() =>
      requireGoclawToken({ goclaw: {} }, msg)
    ).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(msg);
  });

  it("calls process.exit(1) when token is missing", () => {
    expect(() =>
      requireGoclawToken({ goclaw: {} }, "msg")
    ).toThrow("process.exit");

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("treats missing goclaw object as invalid", () => {
    expect(() =>
      requireGoclawToken({}, "msg")
    ).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith("msg");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("preserves message passthrough exactly", () => {
    const msg = "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.";
    expect(() =>
      requireGoclawToken({ goclaw: {} }, msg)
    ).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(msg);
  });
});

describe("getRequiredGoclawConfig", () => {
  let mockExit: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    vi.restoreAllMocks();
  });

  it("calls getConfig", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: { token: "t" } });
    await getRequiredGoclawConfig("msg");
    expect(getConfig).toHaveBeenCalled();
  });

  it("returns the config when token exists", async () => {
    const config = { goclaw: { token: "t" } };
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(config);
    const result = await getRequiredGoclawConfig("msg");
    expect(result).toBe(config);
  });

  it("logs the exact provided message and exits when token is missing", async () => {
    const msg = "❌ Custom missing token message";
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: {} });

    await expect(getRequiredGoclawConfig(msg)).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(msg);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("preserves process.exit(1) behaviour", async () => {
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(getRequiredGoclawConfig("msg")).rejects.toThrow("process.exit");

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("preserves message passthrough exactly", async () => {
    const msg = "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.";
    (getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ goclaw: {} });

    await expect(getRequiredGoclawConfig(msg)).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalledWith(msg);
  });
});
