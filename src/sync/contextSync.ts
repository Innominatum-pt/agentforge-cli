import fs from "fs-extra";
import path from "path";
import FormData from "form-data";
import * as tar from "tar";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { logger } from "../core/logger";
import {
  archiveContextNameToLogicalPath,
  memoryDocumentPathToFlatArchiveName,
} from "./pathMapping";

export type ContextSyncBuildResult = {
  sectionDir: string;
  sectionsArray: string[];
  localFilePaths: string[];
};

export async function collectFilesRecursive(dir: string, baseDir: string): Promise<string[]> {
  const results: string[] = [];
  if (!(await fs.pathExists(dir))) return results;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      const subResults = await collectFilesRecursive(fullPath, baseDir);
      results.push(...subResults);
    } else {
      results.push(relativePath);
    }
  }
  return results;
}

export async function prepareContextFilesExport(
  slug: string,
  agentPath: string,
  tempExportDir: string,
  _tarPath: string,
  itemsToSync: string[]
): Promise<ContextSyncBuildResult> {
  const sectionDir = path.join(tempExportDir, "context_files");
  const sections = new Set<string>();
  const localFilePaths: string[] = [];

  for (const item of itemsToSync) {
    const itemPath = path.join(agentPath, item);
    const isDir = (await fs.stat(itemPath)).isDirectory();
    const section = "context_files";
    sections.add(section);
    const targetDir = path.join(tempExportDir, section);
    await fs.ensureDir(targetDir);

    if (isDir) {
      const subFiles = await fs.readdir(itemPath);
      for (const sub of subFiles) {
        const subPath = path.join(itemPath, sub);
        const isSubDir = (await fs.stat(subPath)).isDirectory();
        if (!isSubDir) {
          const flatName = `${item}_${sub}`;
          await fs.copy(subPath, path.join(targetDir, flatName));
        }
      }
    } else {
      await fs.copy(itemPath, path.join(targetDir, item));
    }
  }

  const sectionEntries = await collectFilesRecursive(sectionDir, sectionDir);
  for (const entry of sectionEntries) {
    localFilePaths.push(archiveContextNameToLogicalPath(entry));
  }

  const sectionsArray = Array.from(sections);
  return { sectionDir, sectionsArray, localFilePaths };
}

export async function injectGhostPlaceholders(
  agentId: string,
  config: any,
  tempExportDir: string,
  sectionsArray: string[],
  localFilePaths: string[]
): Promise<void> {
  try {
    const client = createGoclawClientFromConfig(config);
    const preDocs = await client.listMemoryDocuments(agentId);
    for (const pDoc of preDocs) {
      if (pDoc.path && !localFilePaths.includes(pDoc.path)) {
        const flatGhost = memoryDocumentPathToFlatArchiveName(pDoc.path);
        const ghostPath = path.join(tempExportDir, "context_files", flatGhost);
        await fs.ensureDir(path.dirname(ghostPath));
        await fs.writeFile(ghostPath, " ");
        if (!sectionsArray.includes("context_files")) {
          sectionsArray.push("context_files");
        }
      }
    }
  } catch (e: any) {
    logger.warn("Aviso: Falha ao procurar fantasmas para o tarball.", e.message);
  }
}

export async function createContextTarball(
  tempExportDir: string,
  tarPath: string,
  sectionsArray: string[]
): Promise<void> {
  await tar.c({
    gzip: true,
    file: tarPath,
    cwd: tempExportDir
  }, sectionsArray);
}

export async function importContextArchive(
  agentId: string,
  config: any,
  tarPath: string,
  sectionsArray: string[]
): Promise<void> {
  const form = new FormData();
  form.append("file", fs.createReadStream(tarPath));

  const client = createGoclawClientFromConfig(config);
  await client.importAgentArchive(agentId, form, form.getHeaders(), sectionsArray);

  logger.info(`✅ Upload de ficheiros e subpastas de contexto concluído com sucesso!`);
}

export async function cleanupContextSyncTempFiles(
  tempExportDir: string,
  tarPath: string
): Promise<void> {
  if (await fs.pathExists(tempExportDir)) await fs.remove(tempExportDir);
  if (await fs.pathExists(tarPath)) await fs.remove(tarPath);
}
