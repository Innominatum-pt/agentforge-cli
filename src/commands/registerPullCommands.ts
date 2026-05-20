import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { getRequiredGoclawConfig, GoclawAuthMessages } from "../core/auth";
import { confirmPullOverwrite } from "./pullConfirmation";
import { pullAllSkills } from "./pullAllSkills";
import { pullAllAgents } from "./pullAllAgents";
import { runPullAll } from "./runPullAll";

export function registerPullCommands(program: Command): void {
  const pullCmd = program
    .command("pull")
    .description("Sincroniza entidades do GoClaw para o workspace local");

  pullCmd
    .command("skills")
    .description("Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingPullToken);

      if (!(await confirmPullOverwrite("skills"))) {
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

      if (!(await confirmPullOverwrite("agentes"))) {
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

      if (!(await confirmPullOverwrite('TUDO (agentes e skills)'))) {
        return;
      }

      await runPullAll(config);
    });
}
