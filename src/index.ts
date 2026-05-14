#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import slugify from "slugify";
import AdmZip from "adm-zip";
import FormData from "form-data";
import * as tar from "tar";
import axios from "axios";
import * as readline from "readline";
import os from "os";
import pkg from "../package.json";
import { createGoclawClientFromConfig } from "./goclaw/client";

function confirmOverwrite(entityType: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`⚠️ Atenção: O pull irá APAGAR as suas ${entityType} locais e substituí-las pelo estado do servidor. Quaisquer alterações ou entidades não publicadas serão PERDIDAS. Deseja continuar? (s/N) `, answer => {
      rl.close();
      const isYes = answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      resolve(isYes);
    });
  });
}

function getWorkspaceRoot(): string {
  let dir = process.cwd();
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "agentforge.json")) || fs.existsSync(path.join(dir, "agentforge.yml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  if (fs.existsSync(path.join(dir, "agentforge.json")) || fs.existsSync(path.join(dir, "agentforge.yml"))) {
    return dir;
  }
  console.error("❌ Erro: Não foi possível encontrar a raiz do workspace (agentforge.json). Certifique-se de estar dentro do projeto.");
  process.exit(1);
}

const program = new Command();

program
  .name("agentforge")
  .description("CLI para gerir agentes, equipas e templates de agentes")
  .version(pkg.version);

program
  .command("init")
  .alias("start")
  .description("Cria a estrutura inicial do workspace de agentes")
  .action(async () => {
    const basePath = process.cwd();

    const folders = [
      "agents",
      "documents",
      "templates/default-agent",
      "exports"
    ];

    for (const folder of folders) {
      await fs.ensureDir(path.join(basePath, folder));
    }

    const config = {
      workspace: "agentforge",
      version: 1,
      goclaw: {
        api_url: "http://localhost:18790",
        username: "system",
        token: "",
        default_provider: "ollama-cloud",
        default_model: "deepseek-v4-pro",
        skills_import_endpoint: "/v1/skills/import",
        skills_export_endpoint: "/v1/skills/export"
      }
    };

    await fs.writeJson(path.join(basePath, "agentforge.json"), config, { spaces: 2 });

    // Copiar o manual da CLI para servir de README do workspace
    const cliManualPath = path.join(__dirname, "../templates/CLI_MANUAL.md");
    const workspaceReadmePath = path.join(basePath, "README.md");
    if (await fs.pathExists(cliManualPath)) {
      await fs.copy(cliManualPath, workspaceReadmePath);
    } else {
      await fs.writeFile(
        workspaceReadmePath,
        `# Agent Workspace\n\nWorkspace criado pela AgentForge CLI.\n`
      );
    }

    // Opcional: Copiar os templates originais da CLI para o workspace do usuário
    const cliTemplatePath = path.join(__dirname, "../templates/default-agent");
    const workspaceTemplatePath = path.join(basePath, "templates/default-agent");
    
    if (await fs.pathExists(cliTemplatePath)) {
      await fs.copy(cliTemplatePath, workspaceTemplatePath);
    }

    // Copiar documentação do GoClaw para a pasta documents
    const cliDocPath = path.join(__dirname, "../goclaw-llms-full.txt");
    const workspaceDocPath = path.join(basePath, "documents/goclaw-llms-full.txt");
    if (await fs.pathExists(cliDocPath)) {
      await fs.copy(cliDocPath, workspaceDocPath);
    }

    console.log("Workspace de agentes criado com sucesso.");
  });

const newCmd = program
  .command("new")
  .description("Cria novas entidades (agentes, skills, etc)");

program
  .command("manual")
  .alias("help-docs")
  .description("Exibe o manual completo de uso da AgentForge CLI")
  .action(async () => {
    const cliManualPath = path.join(__dirname, "../templates/CLI_MANUAL.md");
    if (await fs.pathExists(cliManualPath)) {
      const content = await fs.readFile(cliManualPath, "utf-8");
      console.log(content);
    } else {
      console.error("❌ Manual não encontrado.");
    }
  });

newCmd
  .command("agent <name>")
  .description("Cria um novo agente com os ficheiros base da template")
  .action(async (name: string) => {
    const basePath = getWorkspaceRoot();
    const slug = slugify(name, { lower: true, strict: true });

    const agentPath = path.join(basePath, "agents", slug);

    if (await fs.pathExists(agentPath)) {
      console.error(`❌ O agente "${name}" já existe em agents/${slug}.`);
      process.exit(1);
    }

    await fs.ensureDir(agentPath);

    const workspaceTemplatePath = path.join(basePath, "templates/default-agent");
    const cliTemplatePath = path.join(__dirname, "../templates/default-agent");

    let sourceTemplatePath = "";
    if (await fs.pathExists(workspaceTemplatePath)) {
      sourceTemplatePath = workspaceTemplatePath;
    } else if (await fs.pathExists(cliTemplatePath)) {
      sourceTemplatePath = cliTemplatePath;
    }

    if (sourceTemplatePath !== "") {
      await fs.copy(sourceTemplatePath, agentPath);
      
      try {
        const config = await getConfig();
        const agentJson = {
          agent_key: slug,
          display_name: name,
          agent_type: "predefined",
          status: "active",
          emoji: "🔥",
          context_window: 200000,
          max_tool_iterations: 30,
          provider: config.goclaw?.default_provider || "ollama cloud",
          model: config.goclaw?.default_model || "deepseek-v4-pro",
          frontmatter: `Expertise summary for ${name}`
        };
        await fs.writeJson(path.join(agentPath, "agent.json"), agentJson, { spaces: 2 });
      } catch (err) {
        // Fallback se não conseguir ler config
      }
      
      console.log(`✅ Agente "${name}" criado com sucesso em agents/${slug} usando templates!`);
    } else {
      console.warn("⚠️ Nenhuma pasta de templates encontrada. Criando estrutura básica...");
      
      try {
        const config = await getConfig();
        const agentJson = {
          agent_key: slug,
          display_name: name,
          agent_type: "predefined",
          provider: config.goclaw?.default_provider || "ollama cloud",
          model: config.goclaw?.default_model || "deepseek-v4-pro",
          other_config: {
              description: `Agent ${name} created by AgentForge`
          }
        };
        await fs.writeJson(path.join(agentPath, "agent.json"), agentJson, { spaces: 2 });
      } catch (err) {}
      
      await fs.writeFile(
        path.join(agentPath, "SOUL.md"),
        `# ${name}\n\nAgente criado pela AgentForge CLI.\n`
      );
      await fs.writeFile(
        path.join(agentPath, "HEARTBEAT.md"),
        `# Instruções de Heartbeat\n`
      );
      console.log(`✅ Agente "${name}" criado com sucesso em agents/${slug}.`);
    }
  });

newCmd
  .command("skill <name>")
  .description("Cria uma nova skill usando o template base")
  .action(async (name: string) => {
    const basePath = getWorkspaceRoot();
    const slug = slugify(name, { lower: true, strict: true });

    const skillPath = path.join(basePath, "skills", slug);

    if (await fs.pathExists(skillPath)) {
      console.error(`❌ A skill "${name}" já existe em skills/${slug}.`);
      process.exit(1);
    }

    await fs.ensureDir(skillPath);

    const workspaceTemplatePath = path.join(basePath, "templates/default-skill");
    const cliTemplatePath = path.join(__dirname, "../templates/default-skill");

    let sourceTemplatePath = "";
    if (await fs.pathExists(workspaceTemplatePath)) {
      sourceTemplatePath = workspaceTemplatePath;
    } else if (await fs.pathExists(cliTemplatePath)) {
      sourceTemplatePath = cliTemplatePath;
    }

    if (sourceTemplatePath !== "") {
      await fs.copy(sourceTemplatePath, skillPath);
      
      // Update the {{name}} placeholder in SKILL.md
      const skillMdPath = path.join(skillPath, "SKILL.md");
      if (await fs.pathExists(skillMdPath)) {
        let content = await fs.readFile(skillMdPath, 'utf8');
        content = content.replace(/{{name}}/g, name);
        await fs.writeFile(skillMdPath, content);
      }
      
      console.log(`✅ Skill "${name}" criada com sucesso em skills/${slug} usando templates!`);
    } else {
      console.warn("⚠️ Nenhum template de skill encontrado. Criando um SKILL.md vazio.");
      await fs.writeFile(
        path.join(skillPath, "SKILL.md"),
        `---\nname: "${name}"\ndescription: "Skill description"\ndeps: []\n---\n\n## Instruções\n`
      );
      console.log(`✅ Skill "${name}" criada com sucesso em skills/${slug}.`);
    }
  });

const buildCmd = program
  .command("build")
  .description("Realiza o build (empacotamento) de entidades");

buildCmd
  .command("skill <slug>")
  .description("Empacota uma skill em um arquivo .zip na pasta exports/")
  .action(async (slug: string) => {
    const basePath = getWorkspaceRoot();
    const skillPath = path.join(basePath, "skills", slug);
    const exportsPath = path.join(basePath, "exports");
    const zipPath = path.join(exportsPath, `${slug}.zip`);

    if (!(await fs.pathExists(skillPath))) {
      console.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
      process.exit(1);
    }

    await fs.ensureDir(exportsPath);

    const zip = new AdmZip();
    zip.addLocalFolder(skillPath, "");
    zip.writeZip(zipPath);

    console.log(`✅ Build concluído: ${slug}.zip salvo na pasta exports/`);
  });

async function getConfig() {
  const root = getWorkspaceRoot();
  const configPath = path.join(root, "agentforge.json");
  if (!(await fs.pathExists(configPath))) {
    console.error("❌ Arquivo agentforge.json não encontrado. Execute 'agentforge init' primeiro.");
    process.exit(1);
  }
  const config = await fs.readJson(configPath);
  if (config.goclaw && config.goclaw.api_url) {
    config.goclaw.api_url = config.goclaw.api_url.replace(/\/$/, "");
  }
  return config;
}

async function resolveAgentId(slug: string, config: any): Promise<string | null> {
  try {
    const client = createGoclawClientFromConfig(config);
    const agents = await client.listAgents();
    const agent = agents.find((a: any) => a.agent_key === slug);
    return agent ? agent.id : null;
  } catch (error) {
    return null;
  }
}

const deployCmd = program
  .command("deploy")
  .description("Faz o deploy de entidades para a plataforma GoClaw");

async function deploySkill(slug: string, config: any, basePath: string) {
  const skillPath = path.join(basePath, "skills", slug);
  const exportsPath = path.join(basePath, "exports");
  const safeSlug = slug.replace(/[\\\/]/g, '_');
  const zipPath = path.join(exportsPath, `${safeSlug}.zip`);

  if (!(await fs.pathExists(skillPath))) {
    console.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
    return;
  }
  
  await fs.ensureDir(exportsPath);
  const zip = new AdmZip();
  zip.addLocalFolder(skillPath, "");
  zip.writeZip(zipPath);
  
  console.log(`🚀 Fazendo upload da skill "${slug}" para o GoClaw...`);
  const form = new FormData();
  form.append("file", fs.createReadStream(zipPath));

  try {
    const client = createGoclawClientFromConfig(config);
    const data = (await client.uploadSkillArchive(form, form.getHeaders())) as any;
    if (data && data.version) {
      console.log(`✅ Arquivos da skill "${slug}" atualizados (versão ${data.version}).`);
    } else {
      console.log(`✅ Arquivos da skill "${slug}" atualizados.`);
    }

    // Sincronizar metadados (visibility, description, tags, etc)
    const skills = await client.listSkills();
    const remoteSkill = skills.find((s: any) => s.slug === slug);

    if (remoteSkill) {
      const metadataPath = path.join(skillPath, "metadata.json");
      if (await fs.pathExists(metadataPath)) {
        console.log(`🚀 Sincronizando metadados da skill "${slug}"...`);
        const metadata = await fs.readJson(metadataPath);

        // Remover campos que não devem ser enviados no PUT
        const payload = { ...metadata };
        delete payload.id;
        delete payload.slug;
        delete payload.name;

        await client.updateSkill(remoteSkill.id, payload);
        console.log(`✅ Metadados sincronizados com sucesso.`);
      }

      // Sincronizar permissões (grants)
      const grantsPath = path.join(skillPath, "grants.jsonl");
      if (await fs.pathExists(grantsPath)) {
        console.log(`🚀 Sincronizando permissões (grants) da skill "${slug}"...`);
        const grantsContent = await fs.readFile(grantsPath, 'utf8');
        const lines = grantsContent.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const grant = JSON.parse(line);
            if (grant.agent_key) {
              const agentId = await resolveAgentId(grant.agent_key, config);
              if (agentId) {
                await client.grantSkillToAgent(remoteSkill.id, {
                  agent_id: agentId,
                  version: grant.pinned_version || null,
                });
                console.log(`   ➕ Permissão concedida ao agente: ${grant.agent_key}`);
              }
            }
          } catch (e: any) {
            console.warn(
              `   ⚠️ Falha ao conceder permissão: ${e.responseData || e.response?.data?.error || e.message}`
            );
          }
        }
        console.log(`✅ Permissões sincronizadas.`);
      }
    }

  } catch (error: any) {
    console.error(`❌ Erro no deploy da skill "${slug}":`);
    console.error(error.responseData || error.response?.data || error.message);
  }
}

deployCmd
  .command("skill <slug>")
  .description("Faz build e upload automático de uma skill para o GoClaw")
  .action(async (slug: string) => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy.");
      process.exit(1);
    }

    const basePath = getWorkspaceRoot();
    await deploySkill(slug, config, basePath);
  });

type ContextSyncBuildResult = {
  sectionDir: string;
  sectionsArray: string[];
  localFilePaths: string[];
};

async function collectFilesRecursive(dir: string, baseDir: string): Promise<string[]> {
  const results: string[] = [];
  if (!(await fs.pathExists(dir))) return results;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      const subResults = await collectFilesRecursive(fullPath, baseDir);
      results.push(...subResults);
    } else {
      results.push(relativePath);
    }
  }
  return results;
}

async function prepareContextFilesExport(
  slug: string,
  agentPath: string,
  tempExportDir: string,
  tarPath: string,
  itemsToSync: string[]
): Promise<ContextSyncBuildResult> {
  const sectionDir = path.join(tempExportDir, "context_files");
  const sections = new Set<string>();
  const localFilePaths: string[] = [];

  for (const item of itemsToSync) {
    const itemPath = path.join(agentPath, item);
    const isDir = (await fs.stat(itemPath)).isDirectory();
    const section = "context_files";
    sections.add(section);
    const targetDir = path.join(tempExportDir, section);
    await fs.ensureDir(targetDir);

    if (isDir) {
      const subFiles = await fs.readdir(itemPath);
      for (const sub of subFiles) {
        const subPath = path.join(itemPath, sub);
        const isSubDir = (await fs.stat(subPath)).isDirectory();
        if (!isSubDir) {
          const flatName = `${item}_${sub}`;
          await fs.copy(subPath, path.join(targetDir, flatName));
        }
      }
    } else {
      await fs.copy(itemPath, path.join(targetDir, item));
    }
  }

  const sectionEntries = await collectFilesRecursive(sectionDir, sectionDir);
  for (const entry of sectionEntries) {
    let finalEntry = entry;
    if (entry.startsWith("memory_")) {
      finalEntry = entry.replace("memory_", "memory/");
    } else if (entry.startsWith("_system_")) {
      finalEntry = entry.replace("_system_", "_system/");
    }
    localFilePaths.push(finalEntry);
  }

  const sectionsArray = Array.from(sections);
  return { sectionDir, sectionsArray, localFilePaths };
}

async function injectGhostPlaceholders(
  agentId: string,
  config: any,
  tempExportDir: string,
  sectionsArray: string[],
  localFilePaths: string[]
): Promise<void> {
  try {
    const docsUrl = `${config.goclaw.api_url}/v1/agents/${agentId}/memory/documents`;
    const preDocsRes = await axios.get(docsUrl, {
      headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
    });
    const preDocs = preDocsRes.data || [];
    for (const pDoc of preDocs) {
      if (pDoc.path && !localFilePaths.includes(pDoc.path)) {
        const flatGhost = pDoc.path.replace(/[\/\\]/g, '_');
        const ghostPath = path.join(tempExportDir, "context_files", flatGhost);
        await fs.ensureDir(path.dirname(ghostPath));
        await fs.writeFile(ghostPath, " ");
        if (!sectionsArray.includes("context_files")) {
          sectionsArray.push("context_files");
        }
      }
    }
  } catch (e: any) {
    console.warn("Aviso: Falha ao procurar fantasmas para o tarball.", e.message);
  }
}

async function createContextTarball(
  tempExportDir: string,
  tarPath: string,
  sectionsArray: string[]
): Promise<void> {
  await tar.c({
    gzip: true,
    file: tarPath,
    cwd: tempExportDir
  }, sectionsArray);
}

async function importContextArchive(
  agentId: string,
  config: any,
  tarPath: string,
  sectionsArray: string[]
): Promise<void> {
  const form = new FormData();
  form.append("file", fs.createReadStream(tarPath));

  const client = createGoclawClientFromConfig(config);
  await client.importAgentArchive(agentId, form, form.getHeaders(), sectionsArray);

  console.log(`✅ Upload de ficheiros e subpastas de contexto concluído com sucesso!`);
}

async function forceUpdateLocalMemoryDocuments(
  agentId: string,
  config: any,
  localFilePaths: string[],
  sectionDir: string
): Promise<void> {
  const client = createGoclawClientFromConfig(config);

  // Memory document paths are GoClaw catch-all paths.
  // Slashes must remain unencoded. Paths must be relative, e.g. memory/foo.md.
  for (const localPath of localFilePaths) {
    if (localPath.startsWith('memory/') && localPath.endsWith('.md')) {
      try {
        const flatFileName = localPath.replace("memory/", "memory_");
        const content = await fs.readFile(path.join(sectionDir, flatFileName), 'utf8');
        await client.updateMemoryDocument(agentId, localPath, { content });
        console.log(`✅ Edição de memória forçada com sucesso: ${localPath}`);
      } catch (putErr: any) {
        console.warn(`⚠️ Aviso na edição de ${localPath}: O conteúdo pode não ter sido alterado. (${putErr.message})`);
      }
    }
  }
}

async function pruneOrphanMemoryDocuments(
  agentId: string,
  config: any,
  localFilePaths: string[]
): Promise<void> {
  // Memory document paths are GoClaw catch-all paths.
  // Slashes must remain unencoded. Paths must be relative, e.g. memory/foo.md.
  try {
    const documentsUrl = `${config.goclaw.api_url}/v1/agents/${agentId}/memory/documents`;
    const docsResponse = await axios.get(documentsUrl, {
      headers: {
        Authorization: `Bearer ${config.goclaw.token}`,
        "X-GoClaw-User-Id": config.goclaw.username || "system"
      }
    });

    const remoteDocs = docsResponse.data || [];
    let deletedCount = 0;

    for (const doc of remoteDocs) {
      if (!doc.path) continue;

      if (!localFilePaths.includes(doc.path)) {
        console.log(`🧹 Removendo memória órfã no servidor: ${doc.path}`);

        try {
          const deleteUrl = `${config.goclaw.api_url}/v1/agents/${agentId}/memory/documents/${doc.path}`;
          await axios.delete(deleteUrl, {
            headers: {
              Authorization: `Bearer ${config.goclaw.token}`,
              "X-GoClaw-User-Id": doc.user_id || config.goclaw.username || "system"
            }
          });
          deletedCount++;
        } catch (delErr: any) {
          const errorData = delErr.response?.data?.error || "";
          if (delErr.response?.status === 500 && errorData.includes("not found")) {
            console.log(`✅ ${doc.path} já estava removido da base de dados.`);
          } else {
            console.warn(`⚠️ Não foi possível apagar ${doc.path}: ${delErr.message}`);
          }
        }
      }
    }
    if (deletedCount > 0) {
      console.log(`✅ Pruning concluído: ${deletedCount} ficheiro(s) apagado(s) do GoClaw.`);
    }
  } catch (pruneErr: any) {
    console.warn(`⚠️ Aviso: Falha ao fazer pruning das memórias: ${pruneErr.message}`);
  }
}

async function cleanupContextSyncTempFiles(
  tempExportDir: string,
  tarPath: string
): Promise<void> {
  if (await fs.pathExists(tempExportDir)) await fs.remove(tempExportDir);
  if (await fs.pathExists(tarPath)) await fs.remove(tarPath);
}

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
    console.log(`Nenhum ficheiro de contexto ou memória encontrado para "${slug}".`);
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
    console.error(`❌ agent.json não encontrado em agents/${slug}.`);
    return;
  }

  const agentConfig = await fs.readJson(agentJsonPath);
  console.log(`🚀 Sincronizando agente "${slug}"...`);

  try {
    const client = createGoclawClientFromConfig(config);
    const agentId = await resolveAgentId(slug, config);
    const exists = agentId !== null;

    if (!exists) {
      await client.createAgent(agentConfig);
      console.log(`✅ Agente "${slug}" criado.`);
    } else {
      await client.updateAgent(agentId, agentConfig);
      console.log(`✅ Configuração de "${slug}" atualizada.`);
    }

    await deployContextFiles(slug, config, agentId);
    console.log(`✅ Agente "${slug}" sincronizado com sucesso!`);
  } catch (error: any) {
    console.error(
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
      console.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }
    
    console.log(`🚀 Sincronizando arquivos de contexto do agente "${slug}"...`);
    try {
      await deployContextFiles(slug, config);
      console.log("✅ Deploy de contexto concluído!");
    } catch (error: any) {
      console.error("❌ Erro ao enviar contexto:", error.responseData || error.response?.data || error.message);
    }
  });

deployCmd
  .command("agent <slug>")
  .description("Faz deploy completo do agente (configuração + arquivos de contexto)")
  .action(async (slug: string) => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }

    await deployAgent(slug, config);
  });


async function deployAllAgents(config: any, basePath: string) {
  const agentsDir = path.join(basePath, "agents");
  if (await fs.pathExists(agentsDir)) {
    const agents = await fs.readdir(agentsDir);
    console.log(`🚀 Iniciando deploy em lote de ${agents.length} agentes...`);
    for (const slug of agents) {
      const agentPath = path.join(agentsDir, slug);
      if ((await fs.stat(agentPath)).isDirectory()) {
         await deployAgent(slug, config);
      }
    }
  } else {
    console.log("Nenhum agente encontrado em agents/.");
  }
}

async function deployAllSkills(config: any, basePath: string) {
  const skillsDir = path.join(basePath, "skills");
  if (await fs.pathExists(skillsDir)) {
    const skills = await fs.readdir(skillsDir);
    console.log(`🚀 Iniciando deploy em lote de skills...`);
    for (const item of skills) {
      const itemPath = path.join(skillsDir, item);
      if ((await fs.stat(itemPath)).isDirectory()) {
        if (item === "system") {
          console.log("⏩ Ignorando pasta 'system/' (skills nativas do GoClaw são apenas de leitura)");
          continue;
        }
        await deploySkill(item, config, basePath);
      }
    }
  } else {
    console.log("Nenhuma skill encontrada em skills/.");
  }
}

deployCmd
  .command("agents")
  .description("Faz deploy de todos os agentes do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }
    const basePath = getWorkspaceRoot();
    await deployAllAgents(config, basePath);
    console.log("🏁 Deploy de agentes concluído!");
  });

deployCmd
  .command("skills")
  .description("Faz deploy de todas as skills do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }
    const basePath = getWorkspaceRoot();
    await deployAllSkills(config, basePath);
    console.log("🏁 Deploy de skills concluído!");
  });

deployCmd
  .command("all")
  .description("Faz deploy de todos os agentes e skills do workspace")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json.");
      process.exit(1);
    }

    const basePath = getWorkspaceRoot();
    await deployAllAgents(config, basePath);
    await deployAllSkills(config, basePath);
    
    console.log("🏁 Deploy completo (agentes e skills) concluído!");
  });

const pullCmd = program
  .command("pull")
  .description("Sincroniza entidades do GoClaw para o workspace local");

async function pullAllSkills(config: any) {
  const workspaceRoot = getWorkspaceRoot();
  const skillsDir = path.join(workspaceRoot, "skills");

  console.log("🧹 Limpando a pasta local de skills...");
  await fs.emptyDir(skillsDir);

  console.log("📥 Obtendo lista de skills do GoClaw...");
  const skillsListRes = await axios.get(`${config.goclaw.api_url}/v1/skills`, {
    headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
  });
  
  const skills = skillsListRes.data.skills || [];
  console.log(`🔍 Encontradas ${skills.length} skills no servidor.`);

  for (const skill of skills) {
    try {
      const isSystem = skill.is_system === true;
      const targetFolder = isSystem ? path.join("system", skill.slug) : skill.slug;
      const skillLocalPath = path.join(skillsDir, targetFolder);
      await fs.ensureDir(skillLocalPath);

      console.log(`📦 Baixando skill: ${skill.slug}...`);

      // Método 1: Export individual (Muito mais robusto para Managed/Store Skills)
      // O endpoint /v1/skills/export?slugs=... garante que recebemos o tarball completo da skill
      try {
        const exportUrl = `${config.goclaw.api_url}/v1/skills/export?slugs=${skill.slug}`;
        const exportRes = await axios.get(exportUrl, {
          headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" },
          responseType: 'arraybuffer'
        });

        const tempTarPath = path.join(os.tmpdir(), `af-skill-${skill.slug}-${Date.now()}.tar.gz`);
        await fs.writeFile(tempTarPath, exportRes.data);

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
        console.warn(`⚠️ Export falhou para ${skill.slug}, tentando download direto...`);
        
        const filesRes = await axios.get(`${config.goclaw.api_url}/v1/skills/${skill.id}/files`, {
          headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
        });
        
        const files = filesRes.data.files || [];
        if (files.length === 0) {
          console.warn(`⚠️ A skill ${skill.slug} não parece ter ficheiros adicionais.`);
        }

        for (const file of files) {
          if (file.isDir) continue;
          try {
            const fileContentRes = await axios.get(`${config.goclaw.api_url}/v1/skills/${skill.id}/files/${encodeURIComponent(file.path)}`, {
              headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
            });
            const filePath = path.join(skillLocalPath, file.path);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, fileContentRes.data.content || "");
          } catch (fErr: any) {
            console.error(`  ❌ Falha no ficheiro ${file.path}: ${fErr.message}`);
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
      console.error(`❌ Erro processando skill ${skill.slug}: ${err.message}`);
    }
  }
}

pullCmd
  .command("skills")
  .description("Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

    if (!(await confirmOverwrite("skills"))) {
      console.log("❌ Pull cancelado pelo utilizador.");
      return;
    }

    try {
      await pullAllSkills(config);
      console.log("✅ Pull de skills concluído com sucesso! As skills foram atualizadas localmente.");
    } catch (error: any) {
      console.error("❌ Erro durante o pull das skills:");
      if (error.response) {
        console.error(`Status HTTP ${error.response.status}`);
      } else {
        console.error(error.message);
      }
    }
  });

async function pullAgent(slug: string, agentId: string, config: any) {
  console.log(`📦 Baixando agente: ${slug}...`);
  
  const url = `${config.goclaw.api_url}/v1/agents/${agentId}/export`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" },
    responseType: "stream"
  });

  const tempTarPath = path.join(getWorkspaceRoot(), `temp_agent_${slug}.tar.gz`);
  
  try {
    const writer = fs.createWriteStream(tempTarPath);
    response.data.pipe(writer);

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
    const docsRes = await axios.get(`${config.goclaw.api_url}/v1/agents/${agentId}/memory/documents`, {
      headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
    });
    const pathMap: Record<string, string> = {};
    (docsRes.data || []).forEach((d: any) => {
      if (d.path) {
        const flat = d.path.replace(/[\/\\]/g, '_');
        pathMap[flat] = d.path;
      }
    });

    await tar.x({
      file: tempTarPath,
      cwd: agentPath,
      strip: 0,
      filter: (path) => {
        return path === 'agent.json' || path.startsWith('context_files/');
      }
    });
    
    const contextDir = path.join(agentPath, "context_files");
    if (await fs.pathExists(contextDir)) {
      const contextFiles = await fs.readdir(contextDir);
      for (const f of contextFiles) {
        const filePath = path.join(contextDir, f);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          const content = await fs.readFile(filePath, 'utf8');
          if (content === " " || content === "") {
            // Fantasma neutralizado pelo nosso script de deploy! Deita fora!
            await fs.remove(filePath);
            continue;
          }
        }

        if (pathMap[f]) {
          const targetPath = path.join(agentPath, pathMap[f]);
          await fs.ensureDir(path.dirname(targetPath));
          await fs.move(filePath, targetPath, { overwrite: true });
        } else if (f.startsWith('_system_') || f.startsWith('memory_')) {
          // É um stub de diretório do export do GoClaw (ex: _system_dreaming_) ou um órfão esmagado. Ignoramos.
          await fs.remove(filePath);
        } else {
          await fs.move(filePath, path.join(agentPath, f), { overwrite: true });
        }
      }
      await fs.remove(contextDir);
    }
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
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

    if (!(await confirmOverwrite("agentes"))) {
      console.log("❌ Pull cancelado pelo utilizador.");
      return;
    }

    console.log("🧹 Limpando a pasta local de agentes...");
    await fs.emptyDir(path.join(getWorkspaceRoot(), "agents"));

    console.log("📥 Buscando lista de agentes do GoClaw...");
    try {
      const listResponse = await axios.get(`${config.goclaw.api_url}/v1/agents`, {
        headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
      });
      
      const agents = listResponse.data.agents || [];
      console.log(`Encontrados ${agents.length} agentes. Sincronizando...`);

      for (const agent of agents) {
        const slug = agent.agent_key;
        await pullAgent(slug, agent.id, config);
      }

      console.log("✅ Pull de agentes concluído com sucesso!");
    } catch (error: any) {
      if (error.response && error.response.status) {
        console.error(`❌ Erro durante o pull dos agentes: HTTP ${error.response.status} - Verifique suas credenciais e permissões no agentforge.json (username deve ser o dono do agente).`);
      } else {
        console.error("❌ Erro durante o pull dos agentes:", error.message);
      }
    }
  });


pullCmd
  .command('all')
  .description('Faz download cirúrgico de todos os agentes e skills do GoClaw para a pasta local')
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error('❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.');
      process.exit(1);
    }
    
    if (!(await confirmOverwrite('TUDO (agentes e skills)'))) {
      console.log('❌ Pull cancelado pelo utilizador.');
      return;
    }
    
    console.log('🔄 Iniciando sincronização completa (pull all)...');
    
    // PULL SKILLS INLINE
    console.log('\n--- [1/2] SKILLS ---');
    try {
      await pullAllSkills(config);
      console.log('✅ Pull de skills concluído!');
    } catch (error: any) {
      console.error('❌ Erro durante o pull das skills:', error.message);
    }
    
    // PULL AGENTS INLINE
    console.log('\n--- [2/2] AGENTS ---');
    try {
      const listResponse = await axios.get(`${config.goclaw.api_url}/v1/agents`, {
        headers: { Authorization: `Bearer ${config.goclaw.token}`, 'X-GoClaw-User-Id': config.goclaw.username || 'system' }
      });
      
      const agents = listResponse.data.agents || [];
      console.log(`Encontrados ${agents.length} agentes. Sincronizando...`);

      for (const agent of agents) {
        const slug = agent.agent_key;
        await pullAgent(slug, agent.id, config);
      }
      console.log('✅ Pull de agentes concluído!');
    } catch (error: any) {
      console.error('❌ Erro durante o pull dos agentes:', error.message);
    }
    
    console.log('\n🚀 SYNC COMPLETO! Workspace atualizado.');
  });

program.parse();
