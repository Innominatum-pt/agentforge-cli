import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";

export async function initWorkspace(): Promise<void> {
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
  const cliManualPath = path.join(__dirname, "../../templates/CLI_MANUAL.md");
  const workspaceReadmePath = path.join(basePath, "README.md");
  if (await fs.pathExists(cliManualPath)) {
    await fs.copy(cliManualPath, workspaceReadmePath);
  } else {
    await fs.writeFile(
      workspaceReadmePath,
      `# Agent Workspace\n\nWorkspace criado pela AgentForge CLI.\n`
    );
  }

  // Opcional: Copiar os templates originais da CLI para o workspace do utilizador
  const cliTemplatePath = path.join(__dirname, "../../templates/default-agent");
  const workspaceTemplatePath = path.join(basePath, "templates/default-agent");

  if (await fs.pathExists(cliTemplatePath)) {
    await fs.copy(cliTemplatePath, workspaceTemplatePath);
  }

  // Copiar documentação do GoClaw para a pasta documents
  const cliDocPath = path.join(__dirname, "../../goclaw-llms-full.txt");
  const workspaceDocPath = path.join(basePath, "documents/goclaw-llms-full.txt");
  if (await fs.pathExists(cliDocPath)) {
    await fs.copy(cliDocPath, workspaceDocPath);
  }

  logger.info("Workspace de agentes criado com sucesso.");
}
