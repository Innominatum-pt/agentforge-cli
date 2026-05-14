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

  it("calls POST /v1/skills/upload for uploadSkillArchive", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { version: 3 }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.uploadSkillArchive({ fake: "form" }, { "content-type": "multipart/form-data" });
    expect(capturedMethod).toBe("POST");
    expect(capturedPath).toBe("https://example.com/v1/skills/upload");
    expect(capturedData).toEqual({ fake: "form" });
    expect(result).toEqual({ version: 3 });
  });

  it("merges auth headers with form headers in uploadSkillArchive", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { version: 1 }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.uploadSkillArchive({}, { "content-type": "multipart/form-data; boundary=abc" });
    expect(capturedHeaders?.Authorization).toBe("Bearer tok");
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("admin");
    expect(capturedHeaders?.["content-type"]).toBe("multipart/form-data; boundary=abc");
  });

  it("does not allow extra headers to override GoClaw auth headers", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { version: 1 }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "real-token", username: "system-user" },
      transport
    );
    await client.uploadSkillArchive({ fake: "form" }, {
      "content-type": "multipart/form-data; boundary=abc",
      Authorization: "Bearer attacker",
      "X-GoClaw-User-Id": "attacker-user",
    });
    expect(capturedHeaders?.Authorization).toBe("Bearer real-token");
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("system-user");
    expect(capturedHeaders?.["content-type"]).toBe("multipart/form-data; boundary=abc");
  });
});

describe("GoclawClient memory and context methods", () => {
  it("calls GET /v1/agents/:id/memory/documents for listMemoryDocuments", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    const transport = createFakeTransport(async ({ method, url }) => {
      capturedMethod = method;
      capturedPath = url;
      return {
        data: [{ path: "memory/foo.md", user_id: "u1" }],
        status: 200,
        statusText: "OK",
      };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const docs = await client.listMemoryDocuments("a1");
    expect(capturedMethod).toBe("GET");
    expect(capturedPath).toBe("https://example.com/v1/agents/a1/memory/documents");
    expect(docs).toEqual([{ path: "memory/foo.md", user_id: "u1" }]);
  });

  it("appends user_id query param for listMemoryDocuments with userId", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: [{ path: "memory/foo.md" }], status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.listMemoryDocuments("a1", { userId: "u1" });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents?user_id=u1"
    );
  });

  it("sends requestUserId as X-GoClaw-User-Id in listMemoryDocuments", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: [{ path: "memory/foo.md" }], status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.listMemoryDocuments("a1", { requestUserId: "owner1" });
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("owner1");
  });

  it("returns empty array when listMemoryDocuments response is not an array", async () => {
    const transport = createFakeTransport(async () => ({
      data: null,
      status: 200,
      statusText: "OK",
    }));
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const docs = await client.listMemoryDocuments("a1");
    expect(docs).toEqual([]);
  });

  it("calls POST /v1/agents/:id/import for importAgentArchive", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    let capturedData: unknown;
    const transport = createFakeTransport(async ({ method, url, data }) => {
      capturedMethod = method;
      capturedPath = url;
      capturedData = data;
      return { data: { imported: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.importAgentArchive(
      "a1",
      { fake: "form" },
      { "content-type": "multipart/form-data; boundary=abc" },
      ["context_files", "agents"]
    );
    expect(capturedMethod).toBe("POST");
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/import?include=context_files,agents"
    );
    expect(capturedData).toEqual({ fake: "form" });
    expect(result).toEqual({ imported: true });
  });

  it("does not allow form headers to override auth headers in importAgentArchive", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { imported: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "real-token", username: "system-user" },
      transport
    );
    await client.importAgentArchive(
      "a1",
      { fake: "form" },
      {
        "content-type": "multipart/form-data; boundary=abc",
        Authorization: "Bearer attacker",
        "X-GoClaw-User-Id": "attacker-user",
      },
      ["context_files"]
    );
    expect(capturedHeaders?.Authorization).toBe("Bearer real-token");
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("system-user");
    expect(capturedHeaders?.["content-type"]).toBe("multipart/form-data; boundary=abc");
  });

  it("calls PUT /v1/agents/:id/memory/documents/:path for updateMemoryDocument", async () => {
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
    const result = await client.updateMemoryDocument("a1", "memory/foo.md", {
      content: "hello",
    });
    expect(capturedMethod).toBe("PUT");
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md"
    );
    expect(capturedData).toEqual({ content: "hello" });
    expect(result).toEqual({ updated: true });
  });

  it("appends user_id query param for updateMemoryDocument with userId", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: { updated: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.updateMemoryDocument("a1", "memory/foo.md", { content: "hello" }, { userId: "u1" });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md?user_id=u1"
    );
  });

  it("does not URL-encode slashes in updateMemoryDocument path", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: { updated: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.updateMemoryDocument("a1", "memory/nested/bar.md", {
      content: "hello",
    });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/nested/bar.md"
    );
  });

  it("calls DELETE /v1/agents/:id/memory/documents/:path for deleteMemoryDocument", async () => {
    let capturedMethod = "";
    let capturedPath = "";
    const transport = createFakeTransport(async ({ method, url }) => {
      capturedMethod = method;
      capturedPath = url;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    const result = await client.deleteMemoryDocument("a1", "memory/foo.md");
    expect(capturedMethod).toBe("DELETE");
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md"
    );
    expect(result).toEqual({ deleted: true });
  });

  it("appends user_id query param for deleteMemoryDocument with userId", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/foo.md", { userId: "u1" });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md?user_id=u1"
    );
  });

  it("sends requestUserId as X-GoClaw-User-Id in deleteMemoryDocument", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/foo.md", { requestUserId: "doc-owner" });
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("doc-owner");
  });

  it("uses both userId query and requestUserId header in deleteMemoryDocument", async () => {
    let capturedPath = "";
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ url, headers }) => {
      capturedPath = url;
      capturedHeaders = headers;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/foo.md", { userId: "u1", requestUserId: "doc-owner" });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md?user_id=u1"
    );
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("doc-owner");
  });

  it("does not URL-encode slashes in deleteMemoryDocument path", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/nested/bar.md");
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/nested/bar.md"
    );
  });

  it("uses configured username for deleteMemoryDocument when userId is omitted", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const transport = createFakeTransport(async ({ headers }) => {
      capturedHeaders = headers;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok", username: "admin" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/foo.md");
    expect(capturedHeaders?.["X-GoClaw-User-Id"]).toBe("admin");
  });

  it("URL-encodes query user_id in deleteMemoryDocument", async () => {
    let capturedPath = "";
    const transport = createFakeTransport(async ({ url }) => {
      capturedPath = url;
      return { data: { deleted: true }, status: 200, statusText: "OK" };
    });
    const client = new GoclawClient(
      { apiUrl: "https://example.com", token: "tok" },
      transport
    );
    await client.deleteMemoryDocument("a1", "memory/foo.md", { userId: "user@domain.com" });
    expect(capturedPath).toBe(
      "https://example.com/v1/agents/a1/memory/documents/memory/foo.md?user_id=user%40domain.com"
    );
  });
});
