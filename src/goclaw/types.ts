export interface GoclawClientConfig {
  apiUrl: string;
  token: string;
  username?: string;
}

export interface GoclawAgent {
  id: string;
  agent_key: string;
  [key: string]: unknown;
}

export interface GoclawListAgentsResponse {
  agents?: GoclawAgent[];
}

export interface GoclawSkill {
  id: string;
  slug: string;
  [key: string]: unknown;
}

export interface GoclawListSkillsResponse {
  skills?: GoclawSkill[];
}

export interface GrantSkillToAgentPayload {
  agent_id: string;
  version?: string | null;
}

export interface GoclawMemoryDocument {
  path?: string;
  user_id?: string;
  [key: string]: unknown;
}

export interface UpdateMemoryDocumentPayload {
  content: string;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
}

export interface HttpTransport {
  request<T = unknown>(options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    headers?: Record<string, string>;
    data?: unknown;
    responseType?: "json" | "stream" | "arraybuffer";
  }): Promise<HttpResponse<T>>;
}
