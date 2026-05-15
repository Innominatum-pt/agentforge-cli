import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

describe("command layer HTTP architecture", () => {
  it("keeps direct axios usage out of src/index.ts", () => {
    const indexSource = readFileSync(path.join(repoRoot, "src/index.ts"), "utf8");

    expect(indexSource).not.toMatch(/from\s+["']axios["']/);
    expect(indexSource).not.toMatch(/\baxios\.(get|post|put|delete|request)\b/);
  });

  it("keeps axios isolated in the GoClaw transport layer", () => {
    const clientSource = readFileSync(path.join(repoRoot, "src/goclaw/client.ts"), "utf8");

    expect(clientSource).toMatch(/from\s+["']axios["']/);
  });
});
