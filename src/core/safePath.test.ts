import { describe, it, expect } from "vitest";
import {
  assertSafeRelativePath,
  safeJoinInside,
} from "../../src/core/safePath";

describe("assertSafeRelativePath", () => {
  it("accepts normal relative paths such as memory/foo.md", () => {
    expect(assertSafeRelativePath("memory/foo.md")).toBe("memory/foo.md");
  });

  it("rejects empty strings", () => {
    expect(() => assertSafeRelativePath("")).toThrow("empty");
  });

  it("rejects absolute POSIX paths", () => {
    expect(() => assertSafeRelativePath("/tmp/evil.md")).toThrow("absolute");
  });

  it("rejects Windows absolute paths", () => {
    expect(() => assertSafeRelativePath("C:\\temp\\evil.md")).toThrow(
      "absolute"
    );
  });

  it("rejects Windows absolute paths with forward slashes", () => {
    expect(() => assertSafeRelativePath("C:/temp/evil.md")).toThrow("absolute");
  });

  it("rejects UNC network absolute paths", () => {
    expect(() => assertSafeRelativePath("\\\\server\\share\\evil.md")).toThrow(
      "absolute"
    );
  });

  it("rejects UNC network absolute paths with forward slashes", () => {
    expect(() => assertSafeRelativePath("//server/share/evil.md")).toThrow(
      "absolute"
    );
  });

  it("rejects paths containing .. segments", () => {
    expect(() => assertSafeRelativePath("../evil.md")).toThrow("traversal");
  });

  it("rejects nested traversal such as memory/../../evil.md", () => {
    expect(() => assertSafeRelativePath("memory/../../evil.md")).toThrow(
      "traversal"
    );
  });

  it("rejects null bytes", () => {
    expect(() => assertSafeRelativePath("foo\0bar.md")).toThrow("null");
  });

  it("normalizes backslashes to POSIX slashes", () => {
    expect(assertSafeRelativePath("memory\\foo.md")).toBe("memory/foo.md");
  });
});

describe("safeJoinInside", () => {
  it("joins a base directory and a relative path", () => {
    const result = safeJoinInside("/workspace", "memory/foo.md");
    expect(result).toMatch(/memory[/\\]foo\.md$/);
  });

  it("cannot escape the base directory", () => {
    expect(() => safeJoinInside("/workspace", "../evil.md")).toThrow(
      "traversal"
    );
  });

  it("cannot escape via nested traversal", () => {
    expect(() =>
      safeJoinInside("/workspace/agents/abc", "memory/../../evil.md")
    ).toThrow("traversal");
  });
});
