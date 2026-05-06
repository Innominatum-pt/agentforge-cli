#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import slugify from "slugify";
import AdmZip from "adm-zip";
import FormData from "form-data";
import * as tar from "tar";
import axios from "axios";

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
  .version("0.1.0");

program
  .command("init")
  .alias("start")
  .description("Cria a estrutura inicial do workspace de agentes")
  .action(async () => {
    const basePath = process.cwd();

    const folders = [
      "agents",
      "teams",
      "vendors/goclaw",
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

    await fs.writeFile(
      path.join(basePath, "README.md"),
      `# Agent Workspace\n\nWorkspace criado pela AgentForge CLI.\n`
    );

    // Opcional: Copiar os templates originais da CLI para o workspace do usuário
    const cliTemplatePath = path.join(__dirname, "../templates/default-agent");
    const workspaceTemplatePath = path.join(basePath, "templates/default-agent");
    
    if (await fs.pathExists(cliTemplatePath)) {
      await fs.copy(cliTemplatePath, workspaceTemplatePath);
    }

    console.log("Workspace de agentes criado com sucesso.");
  });

const newCmd = program
  .command("new")
  .description("Cria novas entidades (agentes, skills, etc)");

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
          agent_type: "custom",
          provider: config.goclaw?.default_provider || "ollama cloud",
          model: config.goclaw?.default_model || "deepseek-v4-pro",
          other_config: {
              description: `Agent ${name} created by AgentForge`
          }
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
          agent_type: "custom",
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

const deployCmd = program
  .command("deploy")
  .description("Faz o deploy de entidades para a plataforma GoClaw");

deployCmd
  .command("skill <slug>")
  .description("Faz o build da skill e envia para a API do GoClaw")
  .action(async (slug: string) => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy.");
      process.exit(1);
    }

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
    
    console.log(`✅ Build concluído: ${slug}.zip preparado para envio.`);

    console.log(`🚀 Fazendo upload para o GoClaw...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(zipPath));

    try {
      const url = `${config.goclaw.api_url}/v1/skills/upload`;
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system"
        }
      });
      console.log("✅ Deploy realizado com sucesso!");
      console.log(response.data);
    } catch (error: any) {
      console.error("❌ Erro durante o deploy:");
      if (error.response) {
        console.error(error.response.data);
      } else {
        console.error(error.message);
      }
    }
  });

async function deployContextFiles(slug: string, config: any) {
  const basePath = getWorkspaceRoot();
  const agentPath = path.join(basePath, "agents", slug);
  if (!(await fs.pathExists(agentPath))) {
    throw new Error(`Agente não encontrado em agents/${slug}`);
  }

  const files = await fs.readdir(agentPath);
  const contextFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.py')).filter(f => f !== 'README.md' && f !== 'agent.json');

  if (contextFiles.length === 0) {
    console.log(`Nenhum arquivo de contexto encontrado para "${slug}".`);
    return;
  }

  const tempExportDir = path.join(basePath, `temp_export_${slug}`);
  const tempContextDir = path.join(tempExportDir, "context_files");
  const tarPath = path.join(basePath, `temp_export_${slug}.tar.gz`);

  try {
    await fs.ensureDir(tempContextDir);
    for (const file of contextFiles) {
      await fs.copy(path.join(agentPath, file), path.join(tempContextDir, file));
    }

    await tar.c({
      gzip: true,
      file: tarPath,
      cwd: tempExportDir
    }, ["context_files"]);

    const form = new FormData();
    form.append("file", fs.createReadStream(tarPath));

    const url = `${config.goclaw.api_url}/v1/agents/${slug}/import?include=context_files`;
    await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${config.goclaw.token}`,
        "X-GoClaw-User-Id": config.goclaw.username || "system"
      }
    });

    console.log(`✅ Upload cirúrgico de ${contextFiles.length} arquivos concluído com sucesso!`);
  } finally {
    if (await fs.pathExists(tempExportDir)) await fs.remove(tempExportDir);
    if (await fs.pathExists(tarPath)) await fs.remove(tarPath);
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
      console.error("❌ Erro ao enviar contexto:", error.response?.data || error.message);
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

    const basePath = getWorkspaceRoot();
    const agentPath = path.join(basePath, "agents", slug);
    const agentJsonPath = path.join(agentPath, "agent.json");

    if (!(await fs.pathExists(agentJsonPath))) {
      console.error(`❌ agent.json não encontrado em agents/${slug}.`);
      process.exit(1);
    }

    const agentConfig = await fs.readJson(agentJsonPath);
    console.log(`🚀 Atualizando configuração do agente "${slug}"...`);
    
    try {
      let exists = true;
      try {
         await axios.get(`${config.goclaw.api_url}/v1/agents/${slug}`, {
           headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
         });
      } catch (e: any) {
         if (e.response && e.response.status === 404) {
           exists = false;
         } else {
           throw e;
         }
      }

      if (!exists) {
         await axios.post(`${config.goclaw.api_url}/v1/agents`, agentConfig, {
           headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
         });
         console.log("✅ Agente criado com sucesso.");
      } else {
         await axios.put(`${config.goclaw.api_url}/v1/agents/${slug}`, agentConfig, {
           headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
         });
         console.log("✅ Configurações do agente atualizadas.");
      }

      console.log(`🚀 Sincronizando arquivos de contexto...`);
      await deployContextFiles(slug, config);

      console.log("✅ Deploy completo concluído!");
    } catch (error: any) {
      console.error(`❌ Erro no deploy da configuração:`, error.response?.data || error.message);
    }
  });

const pullCmd = program
  .command("pull")
  .description("Sincroniza entidades do GoClaw para o workspace local");

pullCmd
  .command("skills")
  .description("Faz download do arquivo tar.gz de skills do GoClaw e extrai localmente")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

    console.log("📥 Baixando skills do GoClaw...");
    try {
      const url = `${config.goclaw.api_url}${config.goclaw.skills_export_endpoint || '/v1/skills/export'}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system"
        },
        responseType: "stream"
      });

      const tempTarPath = path.join(getWorkspaceRoot(), "temp_skills.tar.gz");
      const writer = fs.createWriteStream(tempTarPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log("📦 Extraindo skills para a pasta local...");
      await tar.x({
        file: tempTarPath,
        cwd: getWorkspaceRoot() 
      });
      await fs.remove(tempTarPath);

      console.log("📥 Baixando ficheiros de código das skills...");
      const skillsListRes = await axios.get(`${config.goclaw.api_url}/v1/skills`, {
        headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
      });
      
      const skills = skillsListRes.data.skills || [];
      for (const skill of skills) {
        try {
          const isSystem = skill.is_system === true;
          const targetFolder = isSystem ? path.join("system", skill.slug) : skill.slug;
          
          if (isSystem) {
            const originalPath = path.join(getWorkspaceRoot(), "skills", skill.slug);
            const newPath = path.join(getWorkspaceRoot(), "skills", targetFolder);
            if (await fs.pathExists(originalPath)) {
              await fs.ensureDir(path.dirname(newPath));
              await fs.move(originalPath, newPath, { overwrite: true });
            }
          }

          const filesRes = await axios.get(`${config.goclaw.api_url}/v1/skills/${skill.id}/files`, {
            headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
          });
          
          const files = filesRes.data.files || [];
          for (const file of files) {
            if (file.isDir) continue;
            const fileContentRes = await axios.get(`${config.goclaw.api_url}/v1/skills/${skill.id}/files/${file.path}`, {
              headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
            });
            const filePath = path.join(getWorkspaceRoot(), "skills", targetFolder, file.path);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, fileContentRes.data.content || "");
          }
        } catch (fileErr: any) {
          console.warn(`⚠️ Não foi possível transferir os ficheiros da skill ${skill.slug}: ${fileErr.message}`);
        }
      }

      console.log("✅ Pull concluído com sucesso! As skills foram atualizadas localmente.");
    } catch (error: any) {
      console.error("❌ Erro durante o pull das skills:");
      if (error.response) {
        console.error(`Status HTTP ${error.response.status}`);
      } else {
        console.error(error.message);
      }
    }
  });

pullCmd
  .command("agents")
  .description("Faz download cirúrgico dos agentes (configuração e contexto)")
  .action(async () => {
    const config = await getConfig();
    if (!config.goclaw || !config.goclaw.token) {
      console.error("❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.");
      process.exit(1);
    }

    console.log("📥 Buscando lista de agentes do GoClaw...");
    try {
      const listResponse = await axios.get(`${config.goclaw.api_url}/v1/agents`, {
        headers: { Authorization: `Bearer ${config.goclaw.token}`, "X-GoClaw-User-Id": config.goclaw.username || "system" }
      });
      
      const agents = listResponse.data.agents || [];
      console.log(`Encontrados ${agents.length} agentes. Sincronizando...`);

      for (const agent of agents) {
        const slug = agent.agent_key;
        console.log(`📦 Baixando agente: ${slug}...`);
        
        const url = `${config.goclaw.api_url}/v1/agents/${agent.id}/export`;
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
          await fs.ensureDir(agentPath);

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
              await fs.move(path.join(contextDir, f), path.join(agentPath, f), { overwrite: true });
            }
            await fs.remove(contextDir);
          }
        } finally {
          if (await fs.pathExists(tempTarPath)) {
            await fs.remove(tempTarPath);
          }
        }
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

program.parse();
