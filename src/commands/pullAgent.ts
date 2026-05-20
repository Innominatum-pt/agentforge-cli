import fs from "fs-extra";
import path from "path";
import * as tar from "tar";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { buildMemoryPathMap, reconstructExtractedContextFiles } from "../sync/pullAgentSync";

export async function pullAgent(
  slug: string,
  agentId: string,
  config: any
): Promise<void> {
  logger.info(`📦 Baixando agente: ${slug}...`);

  const client = createGoclawClientFromConfig(config);
  const exportStream = await client.exportAgentArchive(agentId);

  const tempTarPath = path.join(getWorkspaceRoot(), `temp_agent_${slug}.tar.gz`);

  try {
    const writer = fs.createWriteStream(tempTarPath);
    (exportStream as any).pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const agentPath = path.join(getWorkspaceRoot(), "agents", slug);
    if (await fs.pathExists(agentPath)) {
      await fs.emptyDir(agentPath);
    } else {
      await fs.ensureDir(agentPath);
    }

    // Obter os caminhos reais (com barras) da API para reverter o flattening do export
    const memoryDocs = await client.listMemoryDocuments(agentId);
    const pathMap = buildMemoryPathMap(memoryDocs);

    await tar.x({
      file: tempTarPath,
      cwd: agentPath,
      strip: 0,
      filter: (p) => {
        return p === 'agent.json' || p.startsWith('context_files/');
      }
    });

    await reconstructExtractedContextFiles(agentPath, pathMap);
  } finally {
    if (await fs.pathExists(tempTarPath)) {
      await fs.remove(tempTarPath);
    }
  }
}
