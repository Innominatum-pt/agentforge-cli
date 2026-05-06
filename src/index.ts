#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import slugify from "slugify";
import AdmZip from "adm-zip";
import FormData from "form-data";
import tar from "tar";
import axios from "axios";
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
        api_url: "http://localhost:8080",
        username: "system",
        token: "",
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
    const basePath = process.cwd();
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
      console.log(`✅ Agente "${name}" criado com sucesso em agents/${slug} usando templates!`);
    } else {
      console.warn("⚠️ Nenhuma pasta de templates encontrada. Criando apenas um README.md básico.");
      await fs.writeFile(
        path.join(agentPath, "README.md"),
        `# ${name}\n\nAgente criado pela AgentForge CLI.\n`
      );
      console.log(`✅ Agente "${name}" criado com sucesso em agents/${slug}.`);
    }
  });

newCmd
  .command("skill <name>")
  .description("Cria uma nova skill usando o template base")
  .action(async (name: string) => {
    const basePath = process.cwd();
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
    const basePath = process.cwd();
    const skillPath = path.join(basePath, "skills", slug);
    const exportsPath = path.join(basePath, "exports");
    const zipPath = path.join(exportsPath, `${slug}.zip`);

    if (!(await fs.pathExists(skillPath))) {
      console.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
      process.exit(1);
    }

    await fs.ensureDir(exportsPath);

    const zip = new AdmZip();
    zip.addLocalFolder(skillPath);
    zip.writeZip(zipPath);

    console.log(`✅ Build concluído: ${slug}.zip salvo na pasta exports/`);
  });

async function getConfig() {
  const configPath = path.join(process.cwd(), "agentforge.json");
  if (!(await fs.pathExists(configPath))) {
    console.error("❌ Arquivo agentforge.json não encontrado. Execute 'agentforge init' primeiro.");
    process.exit(1);
  }
  return await fs.readJson(configPath);
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

    const basePath = process.cwd();
    const skillPath = path.join(basePath, "skills", slug);
    const exportsPath = path.join(basePath, "exports");
    const zipPath = path.join(exportsPath, `${slug}.zip`);

    if (!(await fs.pathExists(skillPath))) {
      console.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
      process.exit(1);
    }
    
    await fs.ensureDir(exportsPath);
    const zip = new AdmZip();
    zip.addLocalFolder(skillPath);
    zip.writeZip(zipPath);
    console.log(`✅ Build concluído: ${slug}.zip preparado para envio.`);

    console.log(`🚀 Fazendo upload para o GoClaw...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(zipPath));

    try {
      const url = `${config.goclaw.api_url}${config.goclaw.skills_import_endpoint || '/v1/skills/import'}`;
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${config.goclaw.token}`
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

program
  .command("pull")
  .description("Sincroniza entidades do GoClaw para o workspace local")
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
          Authorization: `Bearer ${config.goclaw.token}`
        },
        responseType: "stream"
      });

      const tempTarPath = path.join(process.cwd(), "temp_skills.tar.gz");
      const writer = fs.createWriteStream(tempTarPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log("📦 Extraindo skills para a pasta local...");
      await tar.x({
        file: tempTarPath,
        cwd: process.cwd() 
      });

      await fs.remove(tempTarPath);
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

program.parse();
