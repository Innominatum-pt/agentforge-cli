import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { getConfig } from "./config";

describe("getConfig", () => {
  let tempDir: string;
  const originalCwd = process.cwd;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "af-config-test-"));
    process.cwd = vi.fn().mockReturnValue(tempDir);
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    await fs.remove(tempDir);
  });

  it("reads agentforge.json and returns config", async () => {
    const config = { workspace: "agentforge", version: 1 };
    await fs.writeJson(path.join(tempDir, "agentforge.json"), config);
    const result = await getConfig();
    expect(result).toMatchObject(config);
  });

  it("removes trailing slash from goclaw.api_url", async () => {
    const config = {
      workspace: "agentforge",
      goclaw: { api_url: "http://localhost:18790/" },
    };
    await fs.writeJson(path.join(tempDir, "agentforge.json"), config);
    const result = await getConfig();
    expect(result.goclaw.api_url).toBe("http://localhost:18790");
  });

  it("leaves api_url without trailing slash unchanged", async () => {
    const config = {
      workspace: "agentforge",
      goclaw: { api_url: "http://localhost:18790" },
    };
    await fs.writeJson(path.join(tempDir, "agentforge.json"), config);
    const result = await getConfig();
    expect(result.goclaw.api_url).toBe("http://localhost:18790");
  });

  it("calls process.exit(1) when agentforge.json is missing", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as any);

    await expect(getConfig()).rejects.toThrow("process.exit called");
    exitSpy.mockRestore();
  });
});
