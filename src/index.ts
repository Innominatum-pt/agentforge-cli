#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import * as tar from "tar";
import os from "os";
import pkg from "../package.json";
import { createGoclawClientFromConfig } from "./goclaw/client";
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

async function pullAllSkills(config: any) {
  const workspaceRoot = getWorkspaceRoot();
  const skillsDir = path.join(workspaceRoot, "skills");

  logger.info("🧹 Limpando a pasta local de skills...");
  await fs.emptyDir(skillsDir);

  logger.info("📥 Obtendo lista de skills do GoClaw...");
  const client = createGoclawClientFromConfig(config);
  const skills = await client.listSkills();
  logger.info(`🔍 Encontradas ${skills.length} skills no servidor.`);

  for (const skill of skills) {
    try {
      const isSystem = skill.is_system === true;
      const targetFolder = isSystem ? path.join("system", skill.slug) : skill.slug;
      const skillLocalPath = path.join(skillsDir, targetFolder);
      await fs.ensureDir(skillLocalPath);

      logger.info(`📦 Baixando skill: ${skill.slug}...`);

      // Método 1: Export individual (Muito mais robusto para Managed/Store Skills)
      // O endpoint /v1/skills/export?slugs=... garante que recebemos o tarball completo da skill
      try {
        const tempTarPath = path.join(os.tmpdir(), `af-skill-${skill.slug}-${Date.now()}.tar.gz`);
        const exportData = await client.exportSkillArchive(skill.slug);
        await fs.writeFile(tempTarPath, exportData as any);

        const tempExtractDir = path.join(os.tmpdir(), `af-extract-${skill.slug}-${Date.now()}`);
        await fs.ensureDir(tempExtractDir);
        
        await tar.x({
          file: tempTarPath,
          cwd: tempExtractDir
        });

        // O tarball de export estruturado pelo GoClaw coloca os ficheiros em skills/{slug}/
        const extractedSkillDir = path.join(tempExtractDir, "skills", skill.slug);
        if (await fs.pathExists(extractedSkillDir)) {
          await fs.copy(extractedSkillDir, skillLocalPath, { overwrite: true });
        } else {
          // Fallback caso a estrutura seja diferente
          await fs.copy(tempExtractDir, skillLocalPath, { overwrite: true });
        }

        await fs.remove(tempTarPath);
        await fs.remove(tempExtractDir);
        
      } catch (exportErr: any) {
        // Método 2: Download cirúrgico de ficheiros (Fallback para Workspace mode)
        logger.warn(`⚠️ Export falhou para ${skill.slug}, tentando download direto...`);
        
        const files = await client.listSkillFiles(skill.id);
        if (files.length === 0) {
          logger.warn(`⚠️ A skill ${skill.slug} não parece ter ficheiros adicionais.`);
        }

        for (const file of files) {
          if (file.isDir) continue;
          try {
            const fileContent = await client.getSkillFileContent(skill.id, file.path);
            const filePath = path.join(skillLocalPath, file.path);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, fileContent.content || "");
          } catch (fErr: any) {
            const message = fErr.responseData || fErr.response?.data || fErr.message;
            logger.error(`  ❌ Falha no ficheiro ${file.path}: ${message}`);
          }
        }
      }

      // Garantir metadata.json para futura sincronização
      const metadataPath = path.join(skillLocalPath, "metadata.json");
      if (!(await fs.pathExists(metadataPath))) {
        await fs.writeJson(metadataPath, {
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          description: skill.description,
          visibility: skill.visibility,
          version: skill.version
        }, { spaces: 2 });
      }

    } catch (err: any) {
      logger.error(`❌ Erro processando skill ${skill.slug}: ${err.message}`);
    }
  }
}

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

    logger.info("📥 Buscando lista de agentes do GoClaw...");
    try {
      const client = createGoclawClientFromConfig(config);
      const agents = await client.listAgents();
      logger.info(`Encontrados ${agents.length} agentes. Sincronizando...`);

      for (const agent of agents) {
        const slug = agent.agent_key;
        await pullAgent(slug, agent.id, config);
      }

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
      const client = createGoclawClientFromConfig(config);
      const agents = await client.listAgents();
      logger.info(`Encontrados ${agents.length} agentes. Sincronizando...`);

      for (const agent of agents) {
        const slug = agent.agent_key;
        await pullAgent(slug, agent.id, config);
      }
      logger.info('✅ Pull de agentes concluído!');
    } catch (error: any) {
      logger.error('❌ Erro durante o pull dos agentes:', error.message);
    }

    logger.info('\n🚀 SYNC COMPLETO! Workspace atualizado.');
  });

program.parse();
