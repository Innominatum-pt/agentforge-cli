import { getWorkspaceRoot } from "../core/workspace";
import { deploySkill } from "./deploySkill";

export async function runDeploySkill(slug: string, config: any): Promise<void> {
  const basePath = getWorkspaceRoot();
  await deploySkill(slug, config, basePath);
}
