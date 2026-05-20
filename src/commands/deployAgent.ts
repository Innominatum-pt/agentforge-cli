import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { resolveAgentId } from "../core/agentResolution";
import { deployContextFiles } from "./deployContextFiles";

export async function deployAgent(slug: string, config: any): Promise<void> {
  const basePath = getWorkspaceRoot();
  const agentPath = path.join(basePath, "agents", slug);
  const agentJsonPath = path.join(agentPath, "agent.json");

  if (!(await fs.pathExists(agentJsonPath))) {
    logger.error(`❌ agent.json não encontrado em agents/${slug}.`);
    return;
  }

  const agentConfig = await fs.readJson(agentJsonPath);
  logger.info(`🚀 Sincronizando agente "${slug}"...`);

  try {
    const client = createGoclawClientFromConfig(config);
    const agentId = await resolveAgentId(slug, config);
    const exists = agentId !== null;

    if (!exists) {
      await client.createAgent(agentConfig);
      logger.info(`✅ Agente "${slug}" criado.`);
    } else {
      await client.updateAgent(agentId, agentConfig);
      logger.info(`✅ Configuração de "${slug}" atualizada.`);
    }

    await deployContextFiles(slug, config, agentId);
    logger.info(`✅ Agente "${slug}" sincronizado com sucesso!`);
  } catch (error: any) {
    logger.error(
      `❌ Erro no deploy de "${slug}":`,
      error.responseData || error.response?.data || error.message
    );
  }
}
