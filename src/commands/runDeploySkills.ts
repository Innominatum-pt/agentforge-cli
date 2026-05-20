import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { deployAllSkills } from "./deployAllSkills";

export async function runDeploySkills(config: any): Promise<void> {
  const basePath = getWorkspaceRoot();
  await deployAllSkills(config, basePath);
  logger.info("🏁 Deploy de skills concluído!");
}
