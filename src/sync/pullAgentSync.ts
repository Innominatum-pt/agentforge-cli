import fs from "fs-extra";
import path from "path";
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

export async function reconstructExtractedContextFiles(
  agentPath: string,
  pathMap: Record<string, string>
): Promise<void> {
  const contextDir = path.join(agentPath, "context_files");

  if (await fs.pathExists(contextDir)) {
    const contextFiles = await fs.readdir(contextDir);
    for (const f of contextFiles) {
      const filePath = path.join(contextDir, f);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const content = await fs.readFile(filePath, "utf8");
        if (content === " " || content === "") {
          // Fantasma neutralizado pelo nosso script de deploy! Deita fora!
          await fs.remove(filePath);
          continue;
        }
      }

      if (pathMap[f]) {
        const targetPath = path.join(agentPath, pathMap[f]);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.move(filePath, targetPath, { overwrite: true });
      } else if (f.startsWith("_system_") || f.startsWith("memory_")) {
        // É um stub de diretório do export do GoClaw (ex: _system_dreaming_) ou um órfão esmagado. Ignoramos.
        await fs.remove(filePath);
      } else {
        await fs.move(filePath, path.join(agentPath, f), { overwrite: true });
      }
    }

    await fs.remove(contextDir);
  }
}
