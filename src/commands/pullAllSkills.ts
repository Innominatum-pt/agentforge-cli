import fs from "fs-extra";
import path from "path";
import * as tar from "tar";
import os from "os";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";
import { createGoclawClientFromConfig } from "../goclaw/client";

export async function pullAllSkills(config: any): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  const skillsDir = path.join(workspaceRoot, "skills");

  logger.info("🧹 Limpando a pasta local de skills...");
  await fs.emptyDir(skillsDir);

  logger.info("📥 Obtendo lista de skills do GoClaw...");
  const client = createGoclawClientFromConfig(config);
  const skills = await client.listSkills();
  logger.info(`🔍 Encontradas ${skills.length} skills no servidor.`);

  for (const skill of skills) {
    try {
      const isSystem = skill.is_system === true;
      const targetFolder = isSystem ? path.join("system", skill.slug) : skill.slug;
      const skillLocalPath = path.join(skillsDir, targetFolder);
      await fs.ensureDir(skillLocalPath);

      logger.info(`📦 Baixando skill: ${skill.slug}...`);

      // Método 1: Export individual (Muito mais robusto para Managed/Store Skills)
      // O endpoint /v1/skills/export?slugs=... garante que recebemos o tarball completo da skill
      try {
        const tempTarPath = path.join(os.tmpdir(), `af-skill-${skill.slug}-${Date.now()}.tar.gz`);
        const exportData = await client.exportSkillArchive(skill.slug);
        await fs.writeFile(tempTarPath, exportData as any);

        const tempExtractDir = path.join(os.tmpdir(), `af-extract-${skill.slug}-${Date.now()}`);
        await fs.ensureDir(tempExtractDir);

        await tar.x({
          file: tempTarPath,
          cwd: tempExtractDir
        });

        // O tarball de export estruturado pelo GoClaw coloca os ficheiros em skills/{slug}/
        const extractedSkillDir = path.join(tempExtractDir, "skills", skill.slug);
        if (await fs.pathExists(extractedSkillDir)) {
          await fs.copy(extractedSkillDir, skillLocalPath, { overwrite: true });
        } else {
          // Fallback caso a estrutura seja diferente
          await fs.copy(tempExtractDir, skillLocalPath, { overwrite: true });
        }

        await fs.remove(tempTarPath);
        await fs.remove(tempExtractDir);

      } catch (exportErr: any) {
        // Método 2: Download cirúrgico de ficheiros (Fallback para Workspace mode)
        logger.warn(`⚠️ Export falhou para ${skill.slug}, tentando download direto...`);

        const files = await client.listSkillFiles(skill.id);
        if (files.length === 0) {
          logger.warn(`⚠️ A skill ${skill.slug} não parece ter ficheiros adicionais.`);
        }

        for (const file of files) {
          if (file.isDir) continue;
          try {
            const fileContent = await client.getSkillFileContent(skill.id, file.path);
            const filePath = path.join(skillLocalPath, file.path);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, fileContent.content || "");
          } catch (fErr: any) {
            const message = fErr.responseData || fErr.response?.data || fErr.message;
            logger.error(`  ❌ Falha no ficheiro ${file.path}: ${message}`);
          }
        }
      }

      // Garantir metadata.json para futura sincronização
      const metadataPath = path.join(skillLocalPath, "metadata.json");
      if (!(await fs.pathExists(metadataPath))) {
        await fs.writeJson(metadataPath, {
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          description: skill.description,
          visibility: skill.visibility,
          version: skill.version
        }, { spaces: 2 });
      }

    } catch (err: any) {
      logger.error(`❌ Erro processando skill ${skill.slug}: ${err.message}`);
    }
  }
}
