#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import pkg from "../package.json";
import { logger } from "./core/logger";
import { getWorkspaceRoot } from "./core/workspace";
import { getConfig } from "./core/config";
import { confirmOverwrite } from "./core/prompts";
import { buildSkill } from "./commands/buildSkill";
import { createNewAgent } from "./commands/newAgent";
import { createNewSkill } from "./commands/newSkill";
import { initWorkspace } from "./commands/initWorkspace";
import { showManual } from "./commands/showManual";
import { registerDeployCommands } from "./commands/registerDeployCommands";
import { pullAgent } from "./commands/pullAgent";
import { pullAllSkills } from "./commands/pullAllSkills";
import { pullAllAgents } from "./commands/pullAllAgents";

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

const pullCmd = program
  .command("pull")
  .description("Sincroniza entidades do GoClaw para o workspace local");

pullCmd
  .command("skills")
  .description("Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

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
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

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
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error('❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.');
      process.exit(1);
    }

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

program.parse();
