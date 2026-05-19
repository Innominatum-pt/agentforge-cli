import { describe, expect, it, vi } from "vitest";
import { resolveAgentId } from "./agentResolution";

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(),
}));

import { createGoclawClientFromConfig } from "../goclaw/client";

describe("resolveAgentId", () => {
  it("returns agent id when agent_key matches slug", async () => {
    const mockClient = {
      listAgents: vi.fn().mockResolvedValue([
        { agent_key: "agent-a", id: "id-123" },
        { agent_key: "agent-b", id: "id-456" },
      ]),
    };
    (createGoclawClientFromConfig as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const result = await resolveAgentId("agent-b", { goclaw: {} });
    expect(result).toBe("id-456");
  });

  it("returns null when no agent matches", async () => {
    const mockClient = {
      listAgents: vi.fn().mockResolvedValue([
        { agent_key: "agent-a", id: "id-123" },
      ]),
    };
    (createGoclawClientFromConfig as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const result = await resolveAgentId("unknown", { goclaw: {} });
    expect(result).toBeNull();
  });

  it("returns null when listAgents throws", async () => {
    const mockClient = {
      listAgents: vi.fn().mockRejectedValue(new Error("network error")),
    };
    (createGoclawClientFromConfig as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const result = await resolveAgentId("agent-a", { goclaw: {} });
    expect(result).toBeNull();
  });
});
