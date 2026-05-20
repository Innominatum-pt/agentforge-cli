import { logger } from "../core/logger";
import { confirmOverwrite } from "../core/prompts";

export async function confirmPullOverwrite(target: string): Promise<boolean> {
  if (!(await confirmOverwrite(target))) {
    logger.info("❌ Pull cancelado pelo utilizador.");
    return false;
  }

  return true;
}
