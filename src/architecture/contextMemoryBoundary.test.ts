import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

describe("context_files and memory/documents boundary", () => {
  it("keeps memory document CRUD helpers out of contextSync.ts", () => {
    const contextSyncSource = readFileSync(
      path.join(repoRoot, "src/sync/contextSync.ts"),
      "utf8"
    );

    expect(contextSyncSource).not.toMatch(/\bfunction\s+forceUpdateLocalMemoryDocuments\b/);
    expect(contextSyncSource).not.toMatch(/\bfunction\s+pruneOrphanMemoryDocuments\b/);
  });

  it("keeps memory document CRUD helpers in memorySync.ts", () => {
    const memorySyncSource = readFileSync(
      path.join(repoRoot, "src/sync/memorySync.ts"),
      "utf8"
    );

    expect(memorySyncSource).toMatch(/\bfunction\s+forceUpdateLocalMemoryDocuments\b/);
    expect(memorySyncSource).toMatch(/\bfunction\s+pruneOrphanMemoryDocuments\b/);
  });

  it("documents that ghost placeholders remain a context_files archive workaround", () => {
    const contextSyncSource = readFileSync(
      path.join(repoRoot, "src/sync/contextSync.ts"),
      "utf8"
    );

    expect(contextSyncSource).toMatch(/\bfunction\s+injectGhostPlaceholders\b/);
  });
});
