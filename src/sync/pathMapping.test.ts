import { describe, it, expect } from "vitest";
import {
  localMemoryPathToRemotePath,
  remoteMemoryPathToLocalPath,
  localContextFileToArchiveName,
  archiveNameToLocalContextFile,
  archiveContextNameToLogicalPath,
  logicalPathToArchiveContextName,
  memoryDocumentPathToFlatArchiveName,
  localMemoryPathToFlatArchiveName,
  localSkillFolderToRemoteSlug,
  remoteSkillToLocalFolder,
} from "../../src/sync/pathMapping";

describe("localMemoryPathToRemotePath", () => {
  it('returns "memory/foo.md" for "memory/foo.md"', () => {
    expect(localMemoryPathToRemotePath("memory/foo.md")).toBe("memory/foo.md");
  });
});

describe("remoteMemoryPathToLocalPath", () => {
  it('returns "memory/foo.md" for "memory/foo.md"', () => {
    expect(remoteMemoryPathToLocalPath("memory/foo.md")).toBe("memory/foo.md");
  });
});

describe("localContextFileToArchiveName", () => {
  it('returns "memory_foo.md" for "memory/foo.md"', () => {
    expect(localContextFileToArchiveName("memory/foo.md")).toBe("memory_foo.md");
  });

  it('returns "_system_foo.md" for "_system/foo.md"', () => {
    expect(localContextFileToArchiveName("_system/foo.md")).toBe(
      "_system_foo.md"
    );
  });
});

describe("archiveNameToLocalContextFile", () => {
  it('returns "memory/foo.md" for "memory_foo.md"', () => {
    expect(archiveNameToLocalContextFile("memory_foo.md")).toBe("memory/foo.md");
  });

  it('returns "_system/foo.md" for "_system_foo.md"', () => {
    expect(archiveNameToLocalContextFile("_system_foo.md")).toBe(
      "_system/foo.md"
    );
  });

  it('returns "SOUL_BACKUP.md" for "SOUL_BACKUP.md"', () => {
    expect(archiveNameToLocalContextFile("SOUL_BACKUP.md")).toBe(
      "SOUL_BACKUP.md"
    );
  });

  it('returns "CAPABILITIES.md" for "CAPABILITIES.md"', () => {
    expect(archiveNameToLocalContextFile("CAPABILITIES.md")).toBe(
      "CAPABILITIES.md"
    );
  });
});

describe("archiveContextNameToLogicalPath", () => {
  it('returns "memory/foo.md" for "memory_foo.md"', () => {
    expect(archiveContextNameToLogicalPath("memory_foo.md")).toBe(
      "memory/foo.md"
    );
  });

  it('returns "_system/rules.md" for "_system_rules.md"', () => {
    expect(archiveContextNameToLogicalPath("_system_rules.md")).toBe(
      "_system/rules.md"
    );
  });

  it('returns "SOUL.md" for "SOUL.md"', () => {
    expect(archiveContextNameToLogicalPath("SOUL.md")).toBe("SOUL.md");
  });
});

describe("logicalPathToArchiveContextName", () => {
  it('returns "memory_foo.md" for "memory/foo.md"', () => {
    expect(logicalPathToArchiveContextName("memory/foo.md")).toBe(
      "memory_foo.md"
    );
  });

  it('returns "_system_rules.md" for "_system/rules.md"', () => {
    expect(logicalPathToArchiveContextName("_system/rules.md")).toBe(
      "_system_rules.md"
    );
  });

  it('returns "nested_path_file.md" for "nested/path/file.md"', () => {
    expect(logicalPathToArchiveContextName("nested/path/file.md")).toBe(
      "nested_path_file.md"
    );
  });

  it("converts Windows backslashes to underscores", () => {
    expect(logicalPathToArchiveContextName("memory\\foo.md")).toBe(
      "memory_foo.md"
    );
  });
});

describe("memoryDocumentPathToFlatArchiveName", () => {
  it('returns "memory_foo.md" for "memory/foo.md"', () => {
    expect(memoryDocumentPathToFlatArchiveName("memory/foo.md")).toBe(
      "memory_foo.md"
    );
  });

  it('returns "memory_nested_foo.md" for "memory/nested/foo.md"', () => {
    expect(memoryDocumentPathToFlatArchiveName("memory/nested/foo.md")).toBe(
      "memory_nested_foo.md"
    );
  });

  it('returns "_system_rules.md" for "_system/rules.md"', () => {
    expect(memoryDocumentPathToFlatArchiveName("_system/rules.md")).toBe(
      "_system_rules.md"
    );
  });

  it("converts backslashes to underscores", () => {
    expect(memoryDocumentPathToFlatArchiveName("memory\\foo.md")).toBe(
      "memory_foo.md"
    );
  });
});

describe("localMemoryPathToFlatArchiveName", () => {
  it('returns "memory_foo.md" for "memory/foo.md"', () => {
    expect(localMemoryPathToFlatArchiveName("memory/foo.md")).toBe(
      "memory_foo.md"
    );
  });

  it("replaces only the first memory/ prefix and preserves nested slashes", () => {
    expect(localMemoryPathToFlatArchiveName("memory/nested/foo.md")).toBe(
      "memory_nested/foo.md"
    );
  });
});

describe("remoteSkillToLocalFolder", () => {
  it('returns "system/abc" for system skill { slug: "abc", is_system: true }', () => {
    expect(remoteSkillToLocalFolder({ slug: "abc", is_system: true })).toBe(
      "system/abc"
    );
  });

  it('returns "abc" for normal skill { slug: "abc", is_system: false }', () => {
    expect(remoteSkillToLocalFolder({ slug: "abc", is_system: false })).toBe(
      "abc"
    );
  });
});

describe("localSkillFolderToRemoteSlug", () => {
  it('returns "abc" for "system/abc"', () => {
    expect(localSkillFolderToRemoteSlug("system/abc")).toBe("abc");
  });

  it('returns "abc" for "abc"', () => {
    expect(localSkillFolderToRemoteSlug("abc")).toBe("abc");
  });
});
