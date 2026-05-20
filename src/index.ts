#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import { buildSkill } from "./commands/buildSkill";
import { createNewAgent } from "./commands/newAgent";
import { createNewSkill } from "./commands/newSkill";
import { initWorkspace } from "./commands/initWorkspace";
import { showManual } from "./commands/showManual";
import { registerDeployCommands } from "./commands/registerDeployCommands";
import { registerPullCommands } from "./commands/registerPullCommands";

const program = new Command();

program
  .name("agentforge")
  .description("CLI para gerir agentes, equipas e templates de agentes")
  .version(pkg.version);

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


registerDeployCommands(program);

registerPullCommands(program);

program.parse();
