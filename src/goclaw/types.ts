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
