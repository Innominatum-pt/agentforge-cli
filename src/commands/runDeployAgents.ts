import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllAgents } from "./deployAllAgents";

export async function runDeployAgents(config: any): Promise<void> {
  const basePath = getWorkspaceRoot();
  await deployAllAgents(config, basePath);
  logger.info("🏁 Deploy de agentes concluído!");
}
