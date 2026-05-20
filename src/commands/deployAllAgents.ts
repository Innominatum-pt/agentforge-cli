import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { deployAgent } from "./deployAgent";

export async function deployAllAgents(config: any, basePath: string): Promise<void> {
  const agentsDir = path.join(basePath, "agents");
  if (await fs.pathExists(agentsDir)) {
    const agents = await fs.readdir(agentsDir);
    logger.info(`🚀 Iniciando deploy em lote de ${agents.length} agentes...`);
    for (const slug of agents) {
      const agentPath = path.join(agentsDir, slug);
      if ((await fs.stat(agentPath)).isDirectory()) {
        await deployAgent(slug, config);
      }
    }
  } else {
    logger.info("Nenhum agente encontrado em agents/.");
  }
}
