import { logger } from "../core/logger";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { pullAgent } from "./pullAgent";

export async function pullAllAgents(config: any): Promise<void> {
  logger.info("📥 Buscando lista de agentes do GoClaw...");
  const client = createGoclawClientFromConfig(config);
  const agents = await client.listAgents();
  logger.info(`Encontrados ${agents.length} agentes. Sincronizando...`);

  for (const agent of agents) {
    const slug = agent.agent_key;
    await pullAgent(slug, agent.id, config);
  }
}
