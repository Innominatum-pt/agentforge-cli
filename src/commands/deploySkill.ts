import fs from "fs-extra";
import path from "path";
import AdmZip from "adm-zip";
import FormData from "form-data";
import { logger } from "../core/logger";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { resolveAgentId } from "../core/agentResolution";

export async function deploySkill(slug: string, config: any, basePath: string): Promise<void> {
  const skillPath = path.join(basePath, "skills", slug);
  const exportsPath = path.join(basePath, "exports");
  const safeSlug = slug.replace(/[\\\/]/g, '_');
  const zipPath = path.join(exportsPath, `${safeSlug}.zip`);

  if (!(await fs.pathExists(skillPath))) {
    logger.error(`❌ A skill "${slug}" não foi encontrada em skills/${slug}.`);
    return;
  }

  await fs.ensureDir(exportsPath);
  const zip = new AdmZip();
  zip.addLocalFolder(skillPath, "");
  zip.writeZip(zipPath);

  logger.info(`🚀 Fazendo upload da skill "${slug}" para o GoClaw...`);
  const form = new FormData();
  form.append("file", fs.createReadStream(zipPath));

  try {
    const client = createGoclawClientFromConfig(config);
    const data = (await client.uploadSkillArchive(form, form.getHeaders())) as any;
    if (data && data.version) {
      logger.info(`✅ Arquivos da skill "${slug}" atualizados (versão ${data.version}).`);
    } else {
      logger.info(`✅ Arquivos da skill "${slug}" atualizados.`);
    }

    // Sincronizar metadados (visibility, description, tags, etc)
    const skills = await client.listSkills();
    const remoteSkill = skills.find((s: any) => s.slug === slug);

    if (remoteSkill) {
      const metadataPath = path.join(skillPath, "metadata.json");
      if (await fs.pathExists(metadataPath)) {
        logger.info(`🚀 Sincronizando metadados da skill "${slug}"...`);
        const metadata = await fs.readJson(metadataPath);

        // Remover campos que não devem ser enviados no PUT
        const payload = { ...metadata };
        delete payload.id;
        delete payload.slug;
        delete payload.name;

        await client.updateSkill(remoteSkill.id, payload);
        logger.info(`✅ Metadados sincronizados com sucesso.`);
      }

      // Sincronizar permissões (grants)
      const grantsPath = path.join(skillPath, "grants.jsonl");
      if (await fs.pathExists(grantsPath)) {
        logger.info(`🚀 Sincronizando permissões (grants) da skill "${slug}"...`);
        const grantsContent = await fs.readFile(grantsPath, 'utf8');
        const lines = grantsContent.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const grant = JSON.parse(line);
            if (grant.agent_key) {
              const agentId = await resolveAgentId(grant.agent_key, config);
              if (agentId) {
                await client.grantSkillToAgent(remoteSkill.id, {
                  agent_id: agentId,
                  version: grant.pinned_version || null,
                });
                logger.info(`   ➕ Permissão concedida ao agente: ${grant.agent_key}`);
              }
            }
          } catch (e: any) {
            logger.warn(
              `   ⚠️ Falha ao conceder permissão: ${e.responseData || e.response?.data?.error || e.message}`
            );
          }
        }
        logger.info(`✅ Permissões sincronizadas.`);
      }
    }

  } catch (error: any) {
    logger.error(`❌ Erro no deploy da skill "${slug}":`);
    logger.error(error.responseData || error.response?.data || error.message);
  }
}
