import { describe, it, expect } from "vitest";
import { buildMemoryPathMap } from "../../src/sync/pullAgentSync";

describe("buildMemoryPathMap", () => {
  it("maps memory/foo.md to key memory_foo.md with value memory/foo.md", () => {
    expect(buildMemoryPathMap([{ path: "memory/foo.md" }])).toEqual({
      "memory_foo.md": "memory/foo.md",
    });
  });

  it("maps memory/nested/foo.md to key memory_nested_foo.md", () => {
    expect(buildMemoryPathMap([{ path: "memory/nested/foo.md" }])).toEqual({
      "memory_nested_foo.md": "memory/nested/foo.md",
    });
  });

  it("maps _system/rules.md to key _system_rules.md", () => {
    expect(buildMemoryPathMap([{ path: "_system/rules.md" }])).toEqual({
      "_system_rules.md": "_system/rules.md",
    });
  });

  it("skips documents without path", () => {
    expect(buildMemoryPathMap([{ id: "x" } as any])).toEqual({});
  });

  it("preserves d.path exactly as value", () => {
    const result = buildMemoryPathMap([{ path: "memory\\foo.md" }]);
    expect(result).toEqual({
      "memory_foo.md": "memory\\foo.md",
    });
  });

  it("overwrites earlier entry when flattened keys collide", () => {
    const result = buildMemoryPathMap([
      { path: "memory/foo.md" },
      { path: "memory\\foo.md" },
    ]);
    expect(result).toEqual({
      "memory_foo.md": "memory\\foo.md",
    });
  });
});
