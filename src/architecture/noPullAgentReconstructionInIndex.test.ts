import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

describe("command layer pull agent reconstruction architecture", () => {
  it("keeps context_files reconstruction implementation out of src/index.ts", () => {
    const indexSource = readFileSync(path.join(repoRoot, "src/index.ts"), "utf8");

    expect(indexSource).not.toMatch(/const\s+contextDir\s*=\s*path\.join\(agentPath,\s*["']context_files["']\)/);
    expect(indexSource).not.toMatch(/\bfs\.readdir\(contextDir\)/);
    expect(indexSource).not.toMatch(/\bfs\.move\(filePath,\s*targetPath/);
    expect(indexSource).not.toMatch(/Fantasma neutralizado/);
    expect(indexSource).not.toMatch(/stub de diret[oó]rio do export do GoClaw/);
  });

  it("keeps context_files reconstruction in src/sync/pullAgentSync.ts", () => {
    const pullAgentSyncSource = readFileSync(
      path.join(repoRoot, "src/sync/pullAgentSync.ts"),
      "utf8"
    );

    expect(pullAgentSyncSource).toMatch(/\bfunction\s+reconstructExtractedContextFiles\b/);
    expect(pullAgentSyncSource).toMatch(/context_files/);
    expect(pullAgentSyncSource).toMatch(/Fantasma neutralizado/);
  });
});
