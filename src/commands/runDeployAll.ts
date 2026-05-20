import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllAgents } from "./deployAllAgents";
import { deployAllSkills } from "./deployAllSkills";

export async function runDeployAll(config: any): Promise<void> {
  const basePath = getWorkspaceRoot();
  await deployAllAgents(config, basePath);
  await deployAllSkills(config, basePath);

  logger.info("🏁 Deploy completo (agentes e skills) concluído!");
}
