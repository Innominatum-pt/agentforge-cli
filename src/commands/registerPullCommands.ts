import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { getRequiredGoclawConfig, GoclawAuthMessages } from "../core/auth";
import { confirmOverwrite } from "../core/prompts";
import { pullAllSkills } from "./pullAllSkills";
import { pullAllAgents } from "./pullAllAgents";

export function registerPullCommands(program: Command): void {
  const pullCmd = program
    .command("pull")
    .description("Sincroniza entidades do GoClaw para o workspace local");

  pullCmd
    .command("skills")
    .description("Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingPullToken);

      if (!(await confirmOverwrite("skills"))) {
        logger.info("❌ Pull cancelado pelo utilizador.");
        return;
      }

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
    });

  pullCmd
    .command("agents")
    .description("Faz download cirúrgico dos agentes (configuração e contexto)")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingPullToken);

      if (!(await confirmOverwrite("agentes"))) {
        logger.info("❌ Pull cancelado pelo utilizador.");
        return;
      }

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
    });

  pullCmd
    .command('all')
    .description('Faz download cirúrgico de todos os agentes e skills do GoClaw para a pasta local')
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingPullToken);

      if (!(await confirmOverwrite('TUDO (agentes e skills)'))) {
        logger.info('❌ Pull cancelado pelo utilizador.');
        return;
      }

      logger.info('🔄 Iniciando sincronização completa (pull all)...');

      // PULL SKILLS INLINE
      logger.info('\n--- [1/2] SKILLS ---');
      try {
        await pullAllSkills(config);
        logger.info('✅ Pull de skills concluído!');
      } catch (error: any) {
        logger.error('❌ Erro durante o pull das skills:', error.message);
      }

      // PULL AGENTS INLINE
      logger.info('\n--- [2/2] AGENTS ---');
      try {
        await pullAllAgents(config);
        logger.info('✅ Pull de agentes concluído!');
      } catch (error: any) {
        logger.error('❌ Erro durante o pull dos agentes:', error.message);
      }

      logger.info('\n🚀 SYNC COMPLETO! Workspace atualizado.');
    });
}
