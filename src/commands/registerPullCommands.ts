import { Command } from "commander";
import { getRequiredGoclawConfig, GoclawAuthMessages } from "../core/auth";
import { confirmPullOverwrite } from "./pullConfirmation";
import { runPullAll } from "./runPullAll";
import { runPullSkills } from "./runPullSkills";
import { runPullAgents } from "./runPullAgents";

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

      await runPullSkills(config);
    });

  pullCmd
    .command("agents")
    .description("Faz download cirúrgico dos agentes (configuração e contexto)")
    .action(async () => {
      const config = await getRequiredGoclawConfig(GoclawAuthMessages.missingPullToken);

      if (!(await confirmPullOverwrite("agentes"))) {
        return;
      }

      await runPullAgents(config);
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
