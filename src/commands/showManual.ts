import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";

export async function showManual(): Promise<void> {
  const cliManualPath = path.join(__dirname, "../../templates/CLI_MANUAL.md");
  if (await fs.pathExists(cliManualPath)) {
    const content = await fs.readFile(cliManualPath, "utf-8");
    logger.raw(content);
  } else {
    logger.error("❌ Manual não encontrado.");
  }
}
