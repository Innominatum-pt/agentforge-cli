#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import slugify from "slugify";

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

    await fs.writeFile(
      path.join(basePath, "agentforge.yml"),
      `workspace: agentforge\nversion: 1\ndefault_vendor: goclaw\n`
    );

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

program
  .command("new")
  .argument("<name>", "Nome do novo agente")
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

    // Tenta usar a template do workspace atual primeiro, se não encontrar usa a da CLI
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
      // Fallback: se não encontrar templates, cria vazio ou com um README básico
      console.warn("⚠️ Nenhuma pasta de templates encontrada. Criando apenas um README.md básico.");
      await fs.writeFile(
        path.join(agentPath, "README.md"),
        `# ${name}\n\nAgente criado pela AgentForge CLI.\n`
      );
      console.log(`✅ Agente "${name}" criado com sucesso em agents/${slug}.`);
    }
  });

program.parse();
