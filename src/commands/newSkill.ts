import fs from "fs-extra";
import path from "path";
import slugify from "slugify";
import { logger } from "../core/logger";
import { getWorkspaceRoot } from "../core/workspace";

export async function createNewSkill(name: string): Promise<void> {
  const basePath = getWorkspaceRoot();
  const slug = slugify(name, { lower: true, strict: true });

  const skillPath = path.join(basePath, "skills", slug);

  if (await fs.pathExists(skillPath)) {
    logger.error(`❌ A skill "${name}" já existe em skills/${slug}.`);
    process.exit(1);
  }

  await fs.ensureDir(skillPath);

  const workspaceTemplatePath = path.join(basePath, "templates/default-skill");
  const cliTemplatePath = path.join(__dirname, "../../templates/default-skill");

  let sourceTemplatePath = "";
  if (await fs.pathExists(workspaceTemplatePath)) {
    sourceTemplatePath = workspaceTemplatePath;
  } else if (await fs.pathExists(cliTemplatePath)) {
    sourceTemplatePath = cliTemplatePath;
  }

  if (sourceTemplatePath !== "") {
    await fs.copy(sourceTemplatePath, skillPath);

    // Update the {{name}} placeholder in SKILL.md
    const skillMdPath = path.join(skillPath, "SKILL.md");
    if (await fs.pathExists(skillMdPath)) {
      let content = await fs.readFile(skillMdPath, "utf8");
      content = content.replace(/{{name}}/g, name);
      await fs.writeFile(skillMdPath, content);
    }

    logger.info(`✅ Skill "${name}" criada com sucesso em skills/${slug} usando templates!`);
  } else {
    logger.warn("⚠️ Nenhum template de skill encontrado. Criando um SKILL.md vazio.");
    await fs.writeFile(
      path.join(skillPath, "SKILL.md"),
      `---\nname: "${name}"\ndescription: "Skill description"\ndeps: []\n---\n\n## Instruções\n`
    );
    logger.info(`✅ Skill "${name}" criada com sucesso em skills/${slug}.`);
  }
}
