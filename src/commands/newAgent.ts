import fs from "fs-extra";
import path from "path";
import slugify from "slugify";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { getConfig } from "../core/config";

export async function createNewAgent(name: string): Promise<void> {
  const basePath = getWorkspaceRoot();
  const slug = slugify(name, { lower: true, strict: true });

  const agentPath = path.join(basePath, "agents", slug);

  if (await fs.pathExists(agentPath)) {
    logger.error(`❌ O agente "${name}" já existe em agents/${slug}.`);
    process.exit(1);
  }

  await fs.ensureDir(agentPath);

  const workspaceTemplatePath = path.join(basePath, "templates/default-agent");
  const cliTemplatePath = path.join(__dirname, "../../templates/default-agent");

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

    logger.info(`✅ Agente "${name}" criado com sucesso em agents/${slug} usando templates!`);
  } else {
    logger.warn("⚠️ Nenhuma pasta de templates encontrada. Criando estrutura básica...");

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
    logger.info(`✅ Agente "${name}" criado com sucesso em agents/${slug}.`);
  }
}
