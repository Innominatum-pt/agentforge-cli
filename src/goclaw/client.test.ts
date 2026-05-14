import { describe, it, expect } from "vitest";
import {
  GoclawClient,
  createGoclawClientFromConfig,
  GoclawApiError,
} from "./client";
import { HttpTransport, HttpResponse } from "./types";

function createFakeTransport(
  handler: (options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: unknown;
  }) => Promise<HttpResponse<unknown>>
): HttpTransport {
  return {
    request: handler as HttpTransport["request"],
  };
}

describe("GoclawClient", () => {
  it("removes trailing slash from apiUrl", async () => {
    let capturedUrl = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedUrl = url;
      return { data: { agents: [] }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com/", token: "tok" },
      transport
    );
    await client.listAgents();
    expect(capturedUrl).toBe("https://example.com/v1/agents");
  });

  it("sends Authorization as Bearer token", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { agents: [] }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "my-token" },
      transport
    );
    await client.listAgents();
    expect(capturedHeaders?.Authorization).toBe("Bearer my-token");
  });

  it("defaults X-GoClaw-User-Id to system when username is missing", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { agents: [] }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.listAgents();
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("system");
  });

  it("uses configured username for X-GoClaw-User-Id", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { agents: [] }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.listAgents();
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("admin");
  });

  it("calls GET /v1/agents for listAgents", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    const transport = createFakeTransport(async ({ method, url }) => {
      capturedMethod = method;
      capturedPath = url;
      return {
        data: { agents: [{ id: "a1", agent_key: "abc" }] },
        status: 200,
        statusText: "OK",
      };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const agents = await client.listAgents();
    expect(capturedMethod).toBe("GET");
    expect(capturedPath).toBe("https://example.com/v1/agents");
    expect(agents).toEqual([{ id: "a1", agent_key: "abc" }]);
  });

  it("returns agents array from listAgents response", async () => {
    const transport = createFakeTransport(async () => ({
      data: { agents: [{ id: "a1", agent_key: "abc" }] },
      status: 200,
      statusText: "OK",
    }));
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const agents = await client.listAgents();
    expect(agents).toEqual([{ id: "a1", agent_key: "abc" }]);
  });

  it("returns empty array when agents field is missing", async () => {
    const transport = createFakeTransport(async () => ({
      data: {},
      status: 200,
      statusText: "OK",
    }));
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const agents = await client.listAgents();
    expect(agents).toEqual([]);
  });

  it("calls POST /v1/agents for createAgent", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { id: "a2" }, status: 201, statusText: "Created" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.createAgent({ agent_key: "new" });
    expect(capturedMethod).toBe("POST");
    expect(capturedPath).toBe("https://example.com/v1/agents");
    expect(capturedData).toEqual({ agent_key: "new" });
    expect(result).toEqual({ id: "a2" });
  });

  it("calls PUT /v1/agents/:id for updateAgent", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { updated: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.updateAgent("a1", { agent_key: "abc" });
    expect(capturedMethod).toBe("PUT");
    expect(capturedPath).toBe("https://example.com/v1/agents/a1");
    expect(capturedData).toEqual({ agent_key: "abc" });
    expect(result).toEqual({ updated: true });
  });

  it("throws GoclawApiError with status on HTTP error response", async () => {
    const transport = createFakeTransport(async () => {
      const error: any = new Error("Request failed with status code 500");
      error.response = { status: 500, data: { error: "Server error" } };
      throw error;
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await expect(client.listAgents()).rejects.toThrow(GoclawApiError);
    try {
      await client.listAgents();
    } catch (err: any) {
      expect(err.status).toBe(500);
      expect(err.responseData).toEqual({ error: "Server error" });
    }
  });

  it("throws GoclawApiError without status on network error", async () => {
    const transport = createFakeTransport(async () => {
      throw new Error("Network Error");
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await expect(client.listAgents()).rejects.toThrow(GoclawApiError);
    try {
      await client.listAgents();
    } catch (err: any) {
      expect(err.message).toBe("Network Error");
      expect(err.status).toBeUndefined();
    }
  });
});

describe("createGoclawClientFromConfig", () => {
  it("creates client from goclaw config", () => {
    const client = createGoclawClientFromConfig({
      goclaw: {
        api_url: "https://goclaw.example.com",
        token: "secret",
        username: "admin",
      },
    });
    expect(client.getAuthHeaders()).toEqual({
      Authorization: "Bearer secret",
      "X-GoClaw-User-Id": "admin",
    });
  });

  it("throws when goclaw config is missing", () => {
    expect(() => createGoclawClientFromConfig({})).toThrow(
      "Missing goclaw configuration"
    );
  });
});

describe("GoclawClient skill methods", () => {
  it("calls GET /v1/skills for listSkills", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    const transport = createFakeTransport(async ({ method, url }) => {
      capturedMethod = method;
      capturedPath = url;
      return {
        data: { skills: [{ id: "s1", slug: "test-skill" }] },
        status: 200,
        statusText: "OK",
      };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const skills = await client.listSkills();
    expect(capturedMethod).toBe("GET");
    expect(capturedPath).toBe("https://example.com/v1/skills");
    expect(skills).toEqual([{ id: "s1", slug: "test-skill" }]);
  });

  it("returns empty array when skills field is missing", async () => {
    const transport = createFakeTransport(async () => ({
      data: {},
      status: 200,
      statusText: "OK",
    }));
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const skills = await client.listSkills();
    expect(skills).toEqual([]);
  });

  it("calls PUT /v1/skills/:id for updateSkill", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { updated: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.updateSkill("s1", { visibility: "public" });
    expect(capturedMethod).toBe("PUT");
    expect(capturedPath).toBe("https://example.com/v1/skills/s1");
    expect(capturedData).toEqual({ visibility: "public" });
    expect(result).toEqual({ updated: true });
  });

  it("calls POST /v1/skills/:id/grants/agent for grantSkillToAgent", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { granted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.grantSkillToAgent("s1", {
      agent_id: "a1",
      version: null,
    });
    expect(capturedMethod).toBe("POST");
    expect(capturedPath).toBe("https://example.com/v1/skills/s1/grants/agent");
    expect(capturedData).toEqual({ agent_id: "a1", version: null });
    expect(result).toEqual({ granted: true });
  });

  it("preserves pinned version in grantSkillToAgent", async () => {
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ data }) => {
      capturedData = data;
      return { data: { granted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.grantSkillToAgent("s1", {
      agent_id: "a1",
      version: "2.0",
    });
    expect(capturedData).toEqual({ agent_id: "a1", version: "2.0" });
  });
});
