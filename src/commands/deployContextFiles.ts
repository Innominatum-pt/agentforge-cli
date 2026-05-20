import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { resolveAgentId } from "../core/agentResolution";
import {
  prepareContextFilesExport,
  injectGhostPlaceholders,
  createContextTarball,
  importContextArchive,
  cleanupContextSyncTempFiles,
} from "../sync/contextSync";
import {
  forceUpdateLocalMemoryDocuments,
  pruneOrphanMemoryDocuments,
} from "../sync/memorySync";

export async function deployContextFiles(
  slug: string,
  config: any,
  resolvedId?: string | null
): Promise<void> {
  const agentId = resolvedId || (await resolveAgentId(slug, config)) || slug;
  const basePath = getWorkspaceRoot();
  const agentPath = path.join(basePath, "agents", slug);
  if (!(await fs.pathExists(agentPath))) {
    throw new Error(`Agente não encontrado em agents/${slug}`);
  }

  const files = await fs.readdir(agentPath);
  const itemsToSync = files.filter(f => f !== 'agent.json' && f !== 'README.md');

  if (itemsToSync.length === 0) {
    logger.info(`Nenhum ficheiro de contexto ou memória encontrado para "${slug}".`);
    return;
  }

  const tempExportDir = path.join(basePath, `temp_export_${slug}`);
  const tarPath = path.join(basePath, `temp_export_${slug}.tar.gz`);

  try {
    const { sectionDir, sectionsArray, localFilePaths } =
      await prepareContextFilesExport(slug, agentPath, tempExportDir, tarPath, itemsToSync);

    await injectGhostPlaceholders(agentId, config, tempExportDir, sectionsArray, localFilePaths);
    await createContextTarball(tempExportDir, tarPath, sectionsArray);
    await importContextArchive(agentId, config, tarPath, sectionsArray);
    await forceUpdateLocalMemoryDocuments(agentId, config, localFilePaths, sectionDir);
    await pruneOrphanMemoryDocuments(agentId, config, localFilePaths);
  } finally {
    await cleanupContextSyncTempFiles(tempExportDir, tarPath);
  }
}
