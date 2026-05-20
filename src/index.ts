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
import { resolveAgentId } from "./core/agentResolution";
import { buildSkill } from "./commands/buildSkill";
import { createNewAgent } from "./commands/newAgent";
import { createNewSkill } from "./commands/newSkill";
import { initWorkspace } from "./commands/initWorkspace";
import { showManual } from "./commands/showManual";
import { deploySkill } from "./commands/deploySkill";
import {
  prepareContextFilesExport,
  injectGhostPlaceholders,
  createContextTarball,
  importContextArchive,
  cleanupContextSyncTempFiles,
} from "./sync/contextSync";
import {
  forceUpdateLocalMemoryDocuments,
  pruneOrphanMemoryDocuments,
} from "./sync/memorySync";
import { buildMemoryPathMap, reconstructExtractedContextFiles } from "./sync/pullAgentSync";

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


const deployCmd = program
  .command("deploy")
  .description("Faz o deploy de entidades para a plataforma GoClaw");

deployCmd
  .command("skill <slug>")
  .description("Faz build e upload automático de uma skill para o GoClaw")
  .action(async (slug: string) => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy.");
      process.exit(1);
    }

    const basePath = getWorkspaceRoot();
    await deploySkill(slug, config, basePath);
  });

async function deployContextFiles(slug: string, config: any, resolvedId?: string | null) {
  const agentId = resolvedId || (await resolveAgentId(slug, config)) || slug;
  const basePath = getWorkspaceRoot();
  const agentPath = path.join(basePath, "agents", slug);
  if (!(await fs.pathExists(agentPath))) {
    throw new Error(`Agente não encontrado em agents/${slug}`);
  }

  const files = await fs.readdir(agentPath);
  const itemsToSync = files.filter(f => f !== 'agent.json' && f !== 'README.md');

  if (itemsToSync.length === 0) {
    logger.info(`Nenhum ficheiro de contexto ou memória encontrado para "${slug}".`);
    return;
  }

  const tempExportDir = path.join(basePath, `temp_export_${slug}`);
  const tarPath = path.join(basePath, `temp_export_${slug}.tar.gz`);

  try {
    const { sectionDir, sectionsArray, localFilePaths } =
      await prepareContextFilesExport(slug, agentPath, tempExportDir, tarPath, itemsToSync);

    await injectGhostPlaceholders(agentId, config, tempExportDir, sectionsArray, localFilePaths);
    await createContextTarball(tempExportDir, tarPath, sectionsArray);
    await importContextArchive(agentId, config, tarPath, sectionsArray);
    await forceUpdateLocalMemoryDocuments(agentId, config, localFilePaths, sectionDir);
    await pruneOrphanMemoryDocuments(agentId, config, localFilePaths);
  } finally {
    await cleanupContextSyncTempFiles(tempExportDir, tarPath);
  }
}

async function deployAgent(slug: string, config: any) {
  const basePath = getWorkspaceRoot();
  const agentPath = path.join(basePath, "agents", slug);
  const agentJsonPath = path.join(agentPath, "agent.json");

  if (!(await fs.pathExists(agentJsonPath))) {
    logger.error(`❌ agent.json não encontrado em agents/${slug}.`);
    return;
  }

  const agentConfig = await fs.readJson(agentJsonPath);
  logger.info(`🚀 Sincronizando agente "${slug}"...`);

  try {
    const client = createGoclawClientFromConfig(config);
    const agentId = await resolveAgentId(slug, config);
    const exists = agentId !== null;

    if (!exists) {
      await client.createAgent(agentConfig);
      logger.info(`✅ Agente "${slug}" criado.`);
    } else {
      await client.updateAgent(agentId, agentConfig);
      logger.info(`✅ Configuração de "${slug}" atualizada.`);
    }

    await deployContextFiles(slug, config, agentId);
    logger.info(`✅ Agente "${slug}" sincronizado com sucesso!`);
  } catch (error: any) {
    logger.error(
      `❌ Erro no deploy de "${slug}":`,
      error.responseData || error.response?.data || error.message
    );
  }
}

deployCmd
  .command("context <slug>")
  .description("Faz upload dos arquivos de contexto diretamente para o agente usando a API de importação")
  .action(async (slug: string) => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }

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
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }

    await deployAgent(slug, config);
  });


async function deployAllAgents(config: any, basePath: string) {
  const agentsDir = path.join(basePath, "agents");
  if (await fs.pathExists(agentsDir)) {
    const agents = await fs.readdir(agentsDir);
    logger.info(`🚀 Iniciando deploy em lote de ${agents.length} agentes...`);
    for (const slug of agents) {
      const agentPath = path.join(agentsDir, slug);
      if ((await fs.stat(agentPath)).isDirectory()) {
         await deployAgent(slug, config);
      }
    }
  } else {
    logger.info("Nenhum agente encontrado em agents/.");
  }
}

async function deployAllSkills(config: any, basePath: string) {
  const skillsDir = path.join(basePath, "skills");
  if (await fs.pathExists(skillsDir)) {
    const skills = await fs.readdir(skillsDir);
    logger.info(`🚀 Iniciando deploy em lote de skills...`);
    for (const item of skills) {
      const itemPath = path.join(skillsDir, item);
      if ((await fs.stat(itemPath)).isDirectory()) {
        if (item === "system") {
          logger.info("⏩ Ignorando pasta 'system/' (skills nativas do GoClaw são apenas de leitura)");
          continue;
        }
        await deploySkill(item, config, basePath);
      }
    }
  } else {
    logger.info("Nenhuma skill encontrada em skills/.");
  }
}

deployCmd
  .command("agents")
  .description("Faz deploy de todos os agentes do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }
    const basePath = getWorkspaceRoot();
    await deployAllAgents(config, basePath);
    logger.info("🏁 Deploy de agentes concluído!");
  });

deployCmd
  .command("skills")
  .description("Faz deploy de todas as skills do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }
    const basePath = getWorkspaceRoot();
    await deployAllSkills(config, basePath);
    logger.info("🏁 Deploy de skills concluído!");
  });

deployCmd
  .command("all")
  .description("Faz deploy de todos os agentes e skills do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      logger.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }

    const basePath = getWorkspaceRoot();
    await deployAllAgents(config, basePath);
    await deployAllSkills(config, basePath);

    logger.info("🏁 Deploy completo (agentes e skills) concluído!");
  });

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

async function pullAgent(slug: string, agentId: string, config: any) {
  logger.info(`📦 Baixando agente: ${slug}...`);
  
  const client = createGoclawClientFromConfig(config);
  const exportStream = await client.exportAgentArchive(agentId);

  const tempTarPath = path.join(getWorkspaceRoot(), `temp_agent_${slug}.tar.gz`);

  try {
    const writer = fs.createWriteStream(tempTarPath);
    (exportStream as any).pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const agentPath = path.join(getWorkspaceRoot(), "agents", slug);
    if (await fs.pathExists(agentPath)) {
      await fs.emptyDir(agentPath);
    } else {
      await fs.ensureDir(agentPath);
    }

    // Obter os caminhos reais (com barras) da API para reverter o flattening do export
    const memoryDocs = await client.listMemoryDocuments(agentId);
    const pathMap = buildMemoryPathMap(memoryDocs);

    await tar.x({
      file: tempTarPath,
      cwd: agentPath,
      strip: 0,
      filter: (path) => {
        return path === 'agent.json' || path.startsWith('context_files/');
      }
    });
    
    await reconstructExtractedContextFiles(agentPath, pathMap);
  } finally {
    if (await fs.pathExists(tempTarPath)) {
      await fs.remove(tempTarPath);
    }
  }
}

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
