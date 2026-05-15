import { memoryDocumentPathToFlatArchiveName } from "./pathMapping";

export type MemoryDocumentLike = {
  path?: string;
  [key: string]: unknown;
};

export function buildMemoryPathMap(
  memoryDocs: MemoryDocumentLike[]
): Record<string, string> {
  const pathMap: Record<string, string> = {};

  memoryDocs.forEach((d) => {
    if (d.path) {
      const flat = memoryDocumentPathToFlatArchiveName(d.path);
      pathMap[flat] = d.path;
    }
  });

  return pathMap;
}
