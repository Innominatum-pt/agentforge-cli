import { getConfig } from "./config";
import { logger } from "./logger";

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
