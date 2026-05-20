import fs from "fs-extra";
import path from "path";
import { logger } from "../core/logger";
import { deploySkill } from "./deploySkill";

export async function deployAllSkills(config: any, basePath: string): Promise<void> {
  const skillsDir = path.join(basePath, "skills");
  if (await fs.pathExists(skillsDir)) {
    const skills = await fs.readdir(skillsDir);
    logger.info(`🚀 Iniciando deploy em lote de skills...`);
    for (const item of skills) {
      const itemPath = path.join(skillsDir, item);
      if ((await fs.stat(itemPath)).isDirectory()) {
        if (item === "system") {
          logger.info("⏩ Ignorando pasta 'system/' (skills nativas do GoClaw são apenas de leitura)");
          continue;
        }
        await deploySkill(item, config, basePath);
      }
    }
  } else {
    logger.info("Nenhuma skill encontrada em skills/.");
  }
}
