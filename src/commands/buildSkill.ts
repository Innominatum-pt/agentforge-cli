import fs from "fs-extra";
import path from "path";
import AdmZip from "adm-zip";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";

export async function buildSkill(slug: string): Promise<void> {
  const basePath = getWorkspaceRoot();
  const skillPath = path.join(basePath, "skills", slug);
  const exportsPath = path.join(basePath, "exports");
  const zipPath = path.join(exportsPath, `${slug}.zip`);

  if (!(await fs.pathExists(skillPath))) {
    logger.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
    process.exit(1);
  }

  await fs.ensureDir(exportsPath);

  const zip = new AdmZip();
  zip.addLocalFolder(skillPath, "");
  zip.writeZip(zipPath);

  logger.info(`✅ Build concluído: ${slug}.zip salvo na pasta exports/`);
}
