import { Command } from "commander";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { getConfig } from "../core/config";
import { requireGoclawToken } from "../core/auth";
import { deploySkill } from "./deploySkill";
import { deployContextFiles } from "./deployContextFiles";
import { deployAgent } from "./deployAgent";
import { deployAllAgents } from "./deployAllAgents";
import { deployAllSkills } from "./deployAllSkills";

export function registerDeployCommands(program: Command): void {
  const deployCmd = program
    .command("deploy")
    .description("Faz o deploy de entidades para a plataforma GoClaw");

  deployCmd
    .command("skill <slug>")
    .description("Faz build e upload automático de uma skill para o GoClaw")
    .action(async (slug: string) => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy.");

      const basePath = getWorkspaceRoot();
      await deploySkill(slug, config, basePath);
    });

  deployCmd
    .command("context <slug>")
    .description("Faz upload dos arquivos de contexto diretamente para o agente usando a API de importação")
    .action(async (slug: string) => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json.");

      logger.info(`🚀 Sincronizando arquivos de contexto do agente "${slug}"...`);
      try {
        await deployContextFiles(slug, config);
        logger.info("✅ Deploy de contexto concluído!");
      } catch (error: any) {
        logger.error("❌ Erro ao enviar contexto:", error.responseData || error.response?.data || error.message);
      }
    });

  deployCmd
    .command("agent <slug>")
    .description("Faz deploy completo do agente (configuração + arquivos de contexto)")
    .action(async (slug: string) => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json.");

      await deployAgent(slug, config);
    });

  deployCmd
    .command("agents")
    .description("Faz deploy de todos os agentes do workspace")
    .action(async () => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json.");
      const basePath = getWorkspaceRoot();
      await deployAllAgents(config, basePath);
      logger.info("🏁 Deploy de agentes concluído!");
    });

  deployCmd
    .command("skills")
    .description("Faz deploy de todas as skills do workspace")
    .action(async () => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json.");
      const basePath = getWorkspaceRoot();
      await deployAllSkills(config, basePath);
      logger.info("🏁 Deploy de skills concluído!");
    });

  deployCmd
    .command("all")
    .description("Faz deploy de todos os agentes e skills do workspace")
    .action(async () => {
      const config = await getConfig();
      requireGoclawToken(config, "❌ Configure sua chave de API (token) no agentforge.json.");

      const basePath = getWorkspaceRoot();
      await deployAllAgents(config, basePath);
      await deployAllSkills(config, basePath);

      logger.info("🏁 Deploy completo (agentes e skills) concluído!");
    });
}
