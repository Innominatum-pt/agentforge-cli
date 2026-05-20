import { logger } from "../core/logger";
import { pullAllSkills } from "./pullAllSkills";

export async function runPullSkills(config: any): Promise<void> {
  try {
    await pullAllSkills(config);
    logger.info("✅ Pull de skills concluído com sucesso! As skills foram atualizadas localmente.");
  } catch (error: any) {
    logger.error("❌ Erro durante o pull das skills:");
    if (error.response?.status || error.status) {
      logger.error(`Status HTTP ${error.response?.status || error.status}`);
    } else {
      logger.error(error.responseData || error.response?.data || error.message);
    }
  }
}
