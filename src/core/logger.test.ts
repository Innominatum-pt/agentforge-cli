import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../../src/core/logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("info calls console.log with same message", () => {
    logger.info("hello info");
    expect(logSpy).toHaveBeenCalledWith("hello info");
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("warn calls console.warn with same message", () => {
    logger.warn("hello warn");
    expect(warnSpy).toHaveBeenCalledWith("hello warn");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("error calls console.error with same message", () => {
    logger.error("hello error");
    expect(errorSpy).toHaveBeenCalledWith("hello error");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("raw calls console.log with same message", () => {
    logger.raw("hello raw");
    expect(logSpy).toHaveBeenCalledWith("hello raw");
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
