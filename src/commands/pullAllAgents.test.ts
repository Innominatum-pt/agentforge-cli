import { describe, expect, it, vi, beforeEach } from "vitest";
import { pullAllAgents } from "./pullAllAgents";
import { createGoclawClientFromConfig } from "../goclaw/client";
import { pullAgent } from "./pullAgent";
import { logger } from "../core/logger";

const mockListAgents = vi.fn();

vi.mock("../goclaw/client", () => ({
  createGoclawClientFromConfig: vi.fn(() => ({
    listAgents: mockListAgents,
  })),
}));

vi.mock("./pullAgent", () => ({
  pullAgent: vi.fn(),
}));

vi.mock("../core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("pullAllAgents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs buscando lista de agentes", async () => {
    mockListAgents.mockResolvedValue([]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(logger.info).toHaveBeenCalledWith("📥 Buscando lista de agentes do GoClaw...");
  });

  it("creates GoClaw client with config", async () => {
    mockListAgents.mockResolvedValue([]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(createGoclawClientFromConfig).toHaveBeenCalledWith({ goclaw: { token: "t" } });
  });

  it("calls client.listAgents()", async () => {
    mockListAgents.mockResolvedValue([]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(mockListAgents).toHaveBeenCalled();
  });

  it("logs encontrados count", async () => {
    mockListAgents.mockResolvedValue([
      { id: "a1", agent_key: "alpha" },
      { id: "a2", agent_key: "beta" },
    ]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(logger.info).toHaveBeenCalledWith("Encontrados 2 agentes. Sincronizando...");
  });

  it("calls pullAgent for each agent with correct args", async () => {
    mockListAgents.mockResolvedValue([
      { id: "a1", agent_key: "alpha" },
      { id: "a2", agent_key: "beta" },
    ]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(pullAgent).toHaveBeenCalledWith("alpha", "a1", { goclaw: { token: "t" } });
    expect(pullAgent).toHaveBeenCalledWith("beta", "a2", { goclaw: { token: "t" } });
  });

  it("preserves iteration order returned by listAgents", async () => {
    mockListAgents.mockResolvedValue([
      { id: "a1", agent_key: "z-last" },
      { id: "a2", agent_key: "a-first" },
    ]);
    await pullAllAgents({ goclaw: { token: "t" } });
    expect(pullAgent).toHaveBeenNthCalledWith(1, "z-last", "a1", { goclaw: { token: "t" } });
    expect(pullAgent).toHaveBeenNthCalledWith(2, "a-first", "a2", { goclaw: { token: "t" } });
  });
});
