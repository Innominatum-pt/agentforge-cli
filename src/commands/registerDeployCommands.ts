import { Command } from "commander";
import { getWorkspaceRoot } from "../core/workspace";
import { getRequiredGoclawConfig, GoclawAuthMessages } from "../core/auth";
import { deploySkill } from "./deploySkill";
import { runDeployContext } from "./runDeployContext";
import { deployAgent } from "./deployAgent";
import { runDeployAgents } from "./runDeployAgents";
import { runDeploySkills } from "./runDeploySkills";
import { runDeployAll } from "./runDeployAll";

export function registerDeployCommands(program: Command): void {
  const deployCmd = program
    .command("deploy")
    .description("Faz o deploy de entidades para a plataforma GoClaw");

  deployCmd
    .command("skill <slug>")
    .description("Faz build e upload automático de uma skill para o GoClaw")
    .action(async (slug: string) => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployTokenBeforeDeploy);

      const basePath = getWorkspaceRoot();
      await deploySkill(slug, config, basePath);
    });

  deployCmd
    .command("context <slug>")
    .description("Faz upload dos arquivos de contexto diretamente para o agente usando a API de importação")
    .action(async (slug: string) => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployToken);

      await runDeployContext(slug, config);
    });

  deployCmd
    .command("agent <slug>")
    .description("Faz deploy completo do agente (configuração + arquivos de contexto)")
    .action(async (slug: string) => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployToken);

      await deployAgent(slug, config);
    });

  deployCmd
    .command("agents")
    .description("Faz deploy de todos os agentes do workspace")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployToken);
      await runDeployAgents(config);
    });

  deployCmd
    .command("skills")
    .description("Faz deploy de todas as skills do workspace")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployToken);
      await runDeploySkills(config);
    });

  deployCmd
    .command("all")
    .description("Faz deploy de todos os agentes e skills do workspace")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingDeployToken);

      await runDeployAll(config);
    });
}
