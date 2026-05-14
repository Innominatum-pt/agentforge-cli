import axios, { AxiosResponse } from "axios";
import {
  GoclawClientConfig,
  GoclawAgent,
  GoclawListAgentsResponse,
  GoclawSkill,
  GoclawListSkillsResponse,
  GrantSkillToAgentPayload,
  HttpResponse,
  HttpTransport,
} from "./types";

export class GoclawApiError extends Error {
  status?: number;
  responseData?: unknown;

  constructor(
    message: string,
    options?: { status?: number; responseData?: unknown }
  ) {
    super(message);
    this.name = "GoclawApiError";
    this.status = options?.status;
    this.responseData = options?.responseData;
  }
}

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "");
}

class AxiosTransport implements HttpTransport {
  async request<T = unknown>({
    method,
    url,
    headers,
    data,
    responseType = "json",
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    headers?: Record<string, string>;
    data?: unknown;
    responseType?: "json" | "stream" | "arraybuffer";
  }): Promise<HttpResponse<T>> {
    const response: AxiosResponse<T> = await axios({
      method,
      url,
      headers,
      data,
      responseType,
    });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }
}

export class GoclawClient {
  private config: GoclawClientConfig;
  private transport: HttpTransport;

  constructor(config: GoclawClientConfig, transport?: HttpTransport) {
    this.config = {
      ...config,
      apiUrl: normalizeApiUrl(config.apiUrl),
    };
    this.transport = transport || new AxiosTransport();
  }

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.token}`,
      "X-GoClaw-User-Id": this.config.username || "system",
    };
  }

  private buildUrl(path: string): string {
    return `${this.config.apiUrl}${path}`;
  }

  private async request<T>(options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    data?: unknown;
    responseType?: "json" | "stream" | "arraybuffer";
    extraHeaders?: Record<string, string>;
  }): Promise<HttpResponse<T>> {
    try {
      return await this.transport.request<T>({
        ...options,
        url: this.buildUrl(options.path),
        headers: {
          ...this.getAuthHeaders(),
          ...options.extraHeaders,
        },
      });
    } catch (error: any) {
      if (error.response) {
        throw new GoclawApiError(error.message, {
          status: error.response.status,
          responseData: error.response.data,
        });
      }
      throw new GoclawApiError(error.message || "Unknown HTTP error");
    }
  }

  async listAgents(): Promise<GoclawAgent[]> {
    const response = await this.request<GoclawListAgentsResponse>({
      method: "GET",
      path: "/v1/agents",
    });
    return response.data.agents || [];
  }

  async createAgent(payload: unknown): Promise<unknown> {
    const response = await this.request<unknown>({
      method: "POST",
      path: "/v1/agents",
      data: payload,
    });
    return response.data;
  }

  async updateAgent(agentId: string, payload: unknown): Promise<unknown> {
    const response = await this.request<unknown>({
      method: "PUT",
      path: `/v1/agents/${agentId}`,
      data: payload,
    });
    return response.data;
  }

  async listSkills(): Promise<GoclawSkill[]> {
    const response = await this.request<GoclawListSkillsResponse>({
      method: "GET",
      path: "/v1/skills",
    });
    return response.data.skills || [];
  }

  async updateSkill(skillId: string, payload: unknown): Promise<unknown> {
    const response = await this.request<unknown>({
      method: "PUT",
      path: `/v1/skills/${skillId}`,
      data: payload,
    });
    return response.data;
  }

  async grantSkillToAgent(
    skillId: string,
    payload: GrantSkillToAgentPayload
  ): Promise<unknown> {
    const response = await this.request<unknown>({
      method: "POST",
      path: `/v1/skills/${skillId}/grants/agent`,
      data: payload,
    });
    return response.data;
  }

  async uploadSkillArchive(
    formData: unknown,
    formHeaders: Record<string, string>
  ): Promise<unknown> {
    const response = await this.request<unknown>({
      method: "POST",
      path: "/v1/skills/upload",
      data: formData,
      extraHeaders: formHeaders,
    });
    return response.data;
  }
}

export function createGoclawClientFromConfig(config: any): GoclawClient {
  if (!config || !config.goclaw) {
    throw new Error("Missing goclaw configuration");
  }
  return new GoclawClient({
    apiUrl: config.goclaw.api_url || "",
    token: config.goclaw.token || "",
    username: config.goclaw.username,
  });
}
