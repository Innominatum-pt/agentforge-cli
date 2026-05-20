import { getConfig } from "./config";
import { logger } from "./logger";

export const GoclawAuthMessages = {
  missingDeployTokenBeforeDeploy:
    "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o deploy.",
  missingDeployToken:
    "❌ Configure sua chave de API (token) no agentforge.json.",
  missingPullToken:
    "❌ Configure sua chave de API (token) no agentforge.json antes de fazer o pull.",
} as const;

export function requireGoclawToken(config: any, message: string): void {
  if (!config.goclaw || !config.goclaw.token) {
    logger.error(message);
    process.exit(1);
  }
}

export async function getRequiredGoclawConfig(message: string): Promise<any> {
  const config = await getConfig();
  requireGoclawToken(config, message);
  return config;
}
