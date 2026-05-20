import { logger } from "../core/logger";
import { runPullSkills } from "./runPullSkills";
import { runPullAgents } from "./runPullAgents";

export async function runPullAll(config: any): Promise<void> {
  logger.info("🔄 Iniciando sincronização completa (pull all)...");

  logger.info("\n--- [1/2] SKILLS ---");
  await runPullSkills(config);

  logger.info("\n--- [2/2] AGENTS ---");
  await runPullAgents(config);

  logger.info("\n🚀 SYNC COMPLETO! Workspace atualizado.");
}
