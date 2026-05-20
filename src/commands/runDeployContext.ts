import { logger } from "../core/logger";
import { deployContextFiles } from "./deployContextFiles";

export async function runDeployContext(slug: string, config: any): Promise<void> {
  logger.info(`🚀 Sincronizando arquivos de contexto do agente "${slug}"...`);
  try {
    await deployContextFiles(slug, config);
    logger.info("✅ Deploy de contexto concluído!");
  } catch (error: any) {
    logger.error("❌ Erro ao enviar contexto:", error.responseData || error.response?.data || error.message);
  }
}
