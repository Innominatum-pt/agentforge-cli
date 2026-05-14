export function localMemoryPathToRemotePath(localPath: string): string {
  return localPath.replace(/\\/g, "/");
}

export function remoteMemoryPathToLocalPath(remotePath: string): string {
  return remotePath.replace(/\\/g, "/");
}

export function localContextFileToArchiveName(localPath: string): string {
  return localPath.replace(/\\/g, "/").replace(/\//g, "_");
}

export function archiveNameToLocalContextFile(archiveName: string): string {
  if (archiveName.startsWith("memory_")) {
    return archiveName.replace("memory_", "memory/");
  }
  if (archiveName.startsWith("_system_")) {
    return archiveName.replace("_system_", "_system/");
  }
  return archiveName;
}

export function localSkillFolderToRemoteSlug(localPathOrSlug: string): string {
  return localPathOrSlug.replace(/\\/g, "/").replace(/^system\//, "");
}

export function remoteSkillToLocalFolder(skill: {
  slug: string;
  is_system?: boolean;
}): string {
  if (skill.is_system) {
    return `system/${skill.slug}`;
  }
  return skill.slug;
}
