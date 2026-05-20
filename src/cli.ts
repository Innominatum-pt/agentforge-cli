import { Command } from "commander";
import pkg from "../package.json";
import { registerCoreCommands } from "./commands/registerCoreCommands";
import { registerDeployCommands } from "./commands/registerDeployCommands";
import { registerPullCommands } from "./commands/registerPullCommands";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("agentforge")
    .description("CLI para gerir agentes, equipas e templates de agentes")
    .version(pkg.version);

  registerCoreCommands(program);
  registerDeployCommands(program);
  registerPullCommands(program);

  return program;
}
