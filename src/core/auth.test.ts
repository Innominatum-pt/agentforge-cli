import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { requireGoclawToken } from "./auth";

vi.mock("./logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from "./logger";

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
