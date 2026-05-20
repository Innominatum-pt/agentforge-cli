import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { showManual } from "./showManual";

const mockPathExists = vi.fn();
const mockReadFile = vi.fn();

vi.mock("fs-extra", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs-extra")>();
  return {
    default: {
      ...actual,
      pathExists: (...args: any[]) => mockPathExists(...args),
      readFile: (...args: any[]) => mockReadFile(...args),
    },
    pathExists: (...args: any[]) => mockPathExists(...args),
    readFile: (...args: any[]) => mockReadFile(...args),
  };
});

vi.mock("../core/logger", () => ({
  logger: {
    raw: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from "../core/logger";

describe("showManual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints manual content with logger.raw when templates/CLI_MANUAL.md exists", async () => {
    mockPathExists.mockResolvedValue(true);
    mockReadFile.mockResolvedValue("# Manual\n\nContent here.\n");

    await showManual();

    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining("CLI_MANUAL.md"),
      "utf-8"
    );
    expect(logger.raw).toHaveBeenCalledWith("# Manual\n\nContent here.\n");
  });

  it('logs "❌ Manual não encontrado." when manual is missing', async () => {
    mockPathExists.mockResolvedValue(false);

    await showManual();

    expect(mockPathExists).toHaveBeenCalledWith(expect.stringContaining("CLI_MANUAL.md"));
    expect(logger.error).toHaveBeenCalledWith("❌ Manual não encontrado.");
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
