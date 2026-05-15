import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

describe("command layer context sync architecture", () => {
  it("keeps context sync helper implementations out of src/index.ts", () => {
    const indexSource = readFileSync(path.join(repoRoot, "src/index.ts"), "utf8");

    expect(indexSource).not.toMatch(/\bfunction\s+collectFilesRecursive\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+prepareContextFilesExport\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+injectGhostPlaceholders\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+createContextTarball\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+importContextArchive\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+forceUpdateLocalMemoryDocuments\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+pruneOrphanMemoryDocuments\b/);
    expect(indexSource).not.toMatch(/\bfunction\s+cleanupContextSyncTempFiles\b/);
  });

  it("keeps context sync helpers in src/sync/contextSync.ts", () => {
    const contextSyncSource = readFileSync(
      path.join(repoRoot, "src/sync/contextSync.ts"),
      "utf8"
    );

    expect(contextSyncSource).toMatch(/\bfunction\s+prepareContextFilesExport\b/);
    expect(contextSyncSource).toMatch(/\bfunction\s+injectGhostPlaceholders\b/);
  });

  it("keeps memory document CRUD helpers in src/sync/memorySync.ts", () => {
    const memorySyncSource = readFileSync(
      path.join(repoRoot, "src/sync/memorySync.ts"),
      "utf8"
    );

    expect(memorySyncSource).toMatch(/\bfunction\s+forceUpdateLocalMemoryDocuments\b/);
    expect(memorySyncSource).toMatch(/\bfunction\s+pruneOrphanMemoryDocuments\b/);
  });
});
