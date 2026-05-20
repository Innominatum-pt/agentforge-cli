import { logger } from "./logger";

export function requireGoclawToken(config: any, message: string): void {
  if (!config.goclaw || !config.goclaw.token) {
    logger.error(message);
    process.exit(1);
  }
}
