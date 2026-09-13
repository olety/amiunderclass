import type {
  AppConfig,
  CreatedRun,
  CreateRunRequest,
  RecordedExample,
  RunSnapshot,
} from "./index";

export class ApiFailure extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function createAccessToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export function underclassClient(baseUrl = "") {
  async function request<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(baseUrl + path, {
      ...options,
      headers,
      cache: "no-store",
    });
    if (response.status === 204) return undefined as T;
    const body = (await response.json()) as any;
    if (!response.ok)
      throw new ApiFailure(
        body.error?.code ?? "request_failed",
        body.error?.message ?? "The request failed.",
        response.status,
      );
    return body as T;
  }
  return {
    config: () => request<AppConfig>("/api/config"),
    example: () => request<RecordedExample>("/api/example"),
    create: (body: CreateRunRequest, token: string) =>
      request<CreatedRun>(
        "/api/runs",
        { method: "POST", body: JSON.stringify(body) },
        token,
      ),
    get: (id: string, token: string) =>
      request<RunSnapshot>(`/api/runs/${encodeURIComponent(id)}`, {}, token),
    cancel: (id: string, token: string) =>
      request<CreatedRun>(
        `/api/runs/${encodeURIComponent(id)}/cancel`,
        { method: "POST" },
        token,
      ),
    remove: (id: string, token: string) =>
      request<void>(
        `/api/runs/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        token,
      ),
  };
}
