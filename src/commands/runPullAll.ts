import { logger } from "../core/logger";
import { pullAllSkills } from "./pullAllSkills";
import { pullAllAgents } from "./pullAllAgents";

export async function runPullAll(config: any): Promise<void> {
  logger.info("🔄 Iniciando sincronização completa (pull all)...");

  // PULL SKILLS INLINE
  logger.info("\n--- [1/2] SKILLS ---");
  try {
    await pullAllSkills(config);
    logger.info("✅ Pull de skills concluído!");
  } catch (error: any) {
    logger.error("❌ Erro durante o pull das skills:", error.message);
  }

  // PULL AGENTS INLINE
  logger.info("\n--- [2/2] AGENTS ---");
  try {
    await pullAllAgents(config);
    logger.info("✅ Pull de agentes concluído!");
  } catch (error: any) {
    logger.error("❌ Erro durante o pull dos agentes:", error.message);
  }

  logger.info("\n🚀 SYNC COMPLETO! Workspace atualizado.");
}
