import { Command } from "commander";
import { buildSkill } from "./buildSkill";
import { createNewAgent } from "./newAgent";
import { createNewSkill } from "./newSkill";
import { initWorkspace } from "./initWorkspace";
import { showManual } from "./showManual";

export function registerCoreCommands(program: Command): void {
  program
    .command("init")
    .alias("start")
    .description("Cria a estrutura inicial do workspace de agentes")
    .action(initWorkspace);

  const newCmd = program
    .command("new")
    .description("Cria novas entidades (agentes, skills, etc)");

  program
    .command("manual")
    .alias("help-docs")
    .description("Exibe o manual completo de uso da AgentForge CLI")
    .action(showManual);

  newCmd
    .command("agent <name>")
    .description("Cria um novo agente com os ficheiros base da template")
    .action(createNewAgent);

  newCmd
    .command("skill <name>")
    .description("Cria uma nova skill usando o template base")
    .action(createNewSkill);

  const buildCmd = program
    .command("build")
    .description("Realiza o build (empacotamento) de entidades");

  buildCmd
    .command("skill <slug>")
    .description("Empacota uma skill em um arquivo .zip na pasta exports/")
    .action(buildSkill);
}
