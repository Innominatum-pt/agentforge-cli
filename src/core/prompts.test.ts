import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("readline", () => ({
  createInterface: vi.fn(),
}));

import * as readline from "readline";
import { confirmOverwrite } from "./prompts";

describe("confirmOverwrite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockReadline(answer: string) {
    (readline.createInterface as ReturnType<typeof vi.fn>).mockReturnValue({
      question: (_prompt: string, callback: (answer: string) => void) => {
        callback(answer);
      },
      close: vi.fn(),
    });
  }

  it("returns true for 's'", async () => {
    mockReadline("s");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(true);
  });

  it("returns true for 'sim'", async () => {
    mockReadline("sim");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(true);
  });

  it("returns true for 'y'", async () => {
    mockReadline("y");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(true);
  });

  it("returns true for 'yes'", async () => {
    mockReadline("yes");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(true);
  });

  it("returns false for 'n'", async () => {
    mockReadline("n");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(false);
  });

  it("returns false for empty answer", async () => {
    mockReadline("");
    const result = await confirmOverwrite("skills");
    expect(result).toBe(false);
  });
});
