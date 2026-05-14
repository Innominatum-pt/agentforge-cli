import { describe, it, expect } from "vitest";
import {
  localMemoryPathToRemotePath,
  remoteMemoryPathToLocalPath,
  localContextFileToArchiveName,
  archiveNameToLocalContextFile,
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
