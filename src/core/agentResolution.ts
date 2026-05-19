import { createGoclawClientFromConfig } from "../goclaw/client";

export async function resolveAgentId(slug: string, config: any): Promise<string | null> {
  try {
    const client = createGoclawClientFromConfig(config);
    const agents = await client.listAgents();
    const agent = agents.find((a: any) => a.agent_key === slug);
    return agent ? agent.id : null;
  } catch (error) {
    return null;
  }
}
