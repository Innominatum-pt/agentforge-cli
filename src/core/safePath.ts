import path from "path";

export function assertSafeRelativePath(input: string): string {
  if (input === "") {
    throw new Error("Path cannot be empty.");
  }

  if (input.includes("\0")) {
    throw new Error("Path cannot contain null bytes.");
  }

  // Normalize backslashes to POSIX-style slashes
  const normalized = input.replace(/\\/g, "/");

  if (path.isAbsolute(normalized)) {
    throw new Error(`Path must be relative, received absolute path: ${input}`);
  }

  const segments = normalized.split("/").filter(s => s !== "" && s !== ".");
  for (const seg of segments) {
    if (seg === "..") {
      throw new Error(`Path cannot contain traversal segments: ${input}`);
    }
  }

  // Return a clean relative path
  return segments.join("/");
}

export function safeJoinInside(baseDir: string, relativePath: string): string {
  const safeRelative = assertSafeRelativePath(relativePath);
  const resolvedBase = path.resolve(baseDir);
  const finalPath = path.resolve(path.join(resolvedBase, safeRelative));

  const resolvedBaseWithSep = resolvedBase.endsWith(path.sep)
    ? resolvedBase
    : resolvedBase + path.sep;

  const finalPathWithSep = finalPath.endsWith(path.sep)
    ? finalPath
    : finalPath + path.sep;

  if (
    finalPath !== resolvedBase &&
    !finalPathWithSep.startsWith(resolvedBaseWithSep)
  ) {
    throw new Error(
      `Resolved path escapes the base directory: ${finalPath} is outside ${resolvedBase}`
    );
  }

  return finalPath;
}
