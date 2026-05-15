import fs from "fs-extra";
import path from "path";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { localMemoryPathToFlatArchiveName } from "./pathMapping";

export async function forceUpdateLocalMemoryDocuments(
  agentId: string,
  config: any,
  localFilePaths: string[],
  sectionDir: string
): Promise<void> {
  const client = createGoclawClientFromConfig(config);

  // Memory document paths are GoClaw catch-all paths.
  // Slashes must remain unencoded. Paths must be relative, e.g. memory/foo.md.
  for (const localPath of localFilePaths) {
    if (localPath.startsWith('memory/') && localPath.endsWith('.md')) {
      try {
        const flatFileName = localMemoryPathToFlatArchiveName(localPath);
        const content = await fs.readFile(path.join(sectionDir, flatFileName), 'utf8');
        await client.updateMemoryDocument(agentId, localPath, { content });
        console.log(`✅ Edição de memória forçada com sucesso: ${localPath}`);
      } catch (putErr: any) {
        console.warn(`⚠️ Aviso na edição de ${localPath}: O conteúdo pode não ter sido alterado. (${putErr.message})`);
      }
    }
  }
}

export async function pruneOrphanMemoryDocuments(
  agentId: string,
  config: any,
  localFilePaths: string[]
): Promise<void> {
  const client = createGoclawClientFromConfig(config);

  // Memory document paths are GoClaw catch-all paths.
  // Slashes must remain unencoded. Paths must be relative, e.g. memory/foo.md.
  try {
    const remoteDocs = await client.listMemoryDocuments(agentId);
    let deletedCount = 0;

    for (const doc of remoteDocs) {
      if (!doc.path) continue;

      if (!localFilePaths.includes(doc.path)) {
        console.log(`🧹 Removendo memória órfã no servidor: ${doc.path}`);

        try {
          await client.deleteMemoryDocument(agentId, doc.path, {
            requestUserId: doc.user_id || config.goclaw.username || "system"
          });
          deletedCount++;
        } catch (delErr: any) {
          const status = delErr.status || delErr.response?.status;
          const errorData = delErr.responseData?.error || delErr.response?.data?.error || "";
          if (status === 500 && errorData.includes("not found")) {
            console.log(`✅ ${doc.path} já estava removido da base de dados.`);
          } else {
            console.warn(`⚠️ Não foi possível apagar ${doc.path}: ${delErr.message}`);
          }
        }
      }
    }
    if (deletedCount > 0) {
      console.log(`✅ Pruning concluído: ${deletedCount} ficheiro(s) apagado(s) do GoClaw.`);
    }
  } catch (pruneErr: any) {
    console.warn(`⚠️ Aviso: Falha ao fazer pruning das memórias: ${pruneErr.message}`);
  }
}
