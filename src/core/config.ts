import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";
import { getWorkspaceRoot } from "./workspace";

export async function getConfig() {
  const root = getWorkspaceRoot();
  const configPath = path.join(root, "agentforge.json");
  if (!(await fs.pathExists(configPath))) {
    logger.error("❌ Arquivo agentforge.json não encontrado. Execute 'agentforge init' primeiro.");
    process.exit(1);
  }
  const config = await fs.readJson(configPath);
  if (config.goclaw && config.goclaw.api_url) {
    config.goclaw.api_url = config.goclaw.api_url.replace(/\/$/, "");
  }
  return config;
}
