import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { pullAllAgents } from "./pullAllAgents";

export async function runPullAgents(config: any): Promise<void> {
  logger.info("🧹 Limpando a pasta local de agentes...");
  await fs.emptyDir(path.join(getWorkspaceRoot(), "agents"));

  try {
    await pullAllAgents(config);
    logger.info("✅ Pull de agentes concluído com sucesso!");
  } catch (error: any) {
    if (error.response?.status || error.status) {
      logger.error(`❌ Erro durante o pull dos agentes: HTTP ${error.response?.status || error.status} - Verifique suas credenciais e permissões no agentforge.json (username deve ser o dono do agente).`);
    } else {
      logger.error("❌ Erro durante o pull dos agentes:", error.message);
    }
  }
}
