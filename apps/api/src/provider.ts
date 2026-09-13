import { MAX_TOKENS, MODEL } from "./protocol";
import { JUDGE_MAX_TOKENS, JUDGE_MODEL } from "./judge";
import { readBounded } from "./util";
export type ProviderKind = "subject" | "judge";
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  reasoning_details?: unknown[];
}
export interface ProviderResult {
  text: string | null;
  reasoningDetails?: unknown[];
  costMicro: number | null;
  model: string | null;
  provider: string | null;
  finishReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number;
  /** Transport attempts spent, including the first. */
  attempts: number;
  error: string | null;
  fatal: boolean;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function reportedRoute(value: unknown, key: string): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\p{Cc}\p{Cf}]/gu, "");
  if (clean === "" || clean.includes(key) || /sk-or-v1-/i.test(clean))
    return null;
  return clean.slice(0, 200);
}

// Explicit canonical IDs from the same 2026-09-13 public catalog snapshot.
const CANONICAL_MODELS: Record<ProviderKind, string> = {
  subject: "anthropic/claude-sonnet-5-20260630",
  judge: "deepseek/deepseek-v4.1-flash",
};
// DeepSeek first-party supports JSON-object mode, not strict schemas. parseJudge enforces the shape.
const JUDGE_RESPONSE_FORMAT = { type: "json_object" } as const;

export function requestBody(
  messages: Message[],
  kind: ProviderKind = "subject",
) {
  const judge = kind === "judge";
  return {
    model: judge ? JUDGE_MODEL : MODEL,
    messages,
    max_tokens: judge ? JUDGE_MAX_TOKENS : MAX_TOKENS,
    reasoning: { effort: judge ? "high" : "low" },
    ...(judge ? { response_format: JUDGE_RESPONSE_FORMAT } : {}),
    provider: {
      only: [judge ? "deepseek" : "anthropic"],
      allow_fallbacks: false,
      require_parameters: true,
      // Direct endpoint prices verified 2026-09-13 via the public model endpoints API.
      // USD per million tokens is numerically microdollars per token.
      max_price: judge
        ? { prompt: 0.15, completion: 0.6, request: 0 }
        : { prompt: 2, completion: 10, request: 0 },
    },
  };
}
export function reservationMicro(
  messages: Message[],
  kind: ProviderKind = "subject",
): number {
  const body = requestBody(messages, kind);
  // UTF-8 bytes upper-bound text tokens, plus generous framing; no tools/images.
  // Quarter-microdollar arithmetic is exact for both pinned price ceilings.
  const inputTokens =
    new TextEncoder().encode(JSON.stringify(messages)).length + 4096;
  return Math.ceil(
    (inputTokens * (body.provider.max_price.prompt * 4) +
      body.max_tokens * (body.provider.max_price.completion * 4)) /
      4,
  );
}

export function validateProviderKeyFormat(key: unknown): key is string {
  return (
    typeof key === "string" &&
    key.length <= 256 &&
    key.trim() === key &&
    /^sk-or-v1-[A-Za-z0-9]{20,}$/.test(key)
  );
}

export type ProviderKeyVerification =
  | { ok: true; error: null }
  | {
      ok: false;
      error: "provider_key_invalid" | "provider_key_verification_unavailable";
    };

export async function verifyProviderKey(
  key: string,
  fetcher: typeof fetch = fetch,
): Promise<ProviderKeyVerification> {
  if (!validateProviderKeyFormat(key))
    return { ok: false, error: "provider_key_invalid" };
  try {
    const response = await fetcher("https://openrouter.ai/api/v1/key", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    // Account metadata and upstream errors stay local to this call and are discarded.
    const text = await readBounded(response.body, 16_384);
    if (response.status === 401 || response.status === 403)
      return { ok: false, error: "provider_key_invalid" };
    if (!response.ok)
      return { ok: false, error: "provider_key_verification_unavailable" };
    const body: unknown = JSON.parse(text);
    if (!record(body)) return { ok: false, error: "provider_key_invalid" };
    const data = body.data;
    if (
      !record(data) ||
      data.is_management_key === true ||
      data.disabled === true
    )
      return { ok: false, error: "provider_key_invalid" };
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "provider_key_verification_unavailable" };
  }
}

// Only transport failures are repeated: they carry no usage and no cost, so a retry
// cannot double-charge. Anything that arrived with a 2xx body is already billed.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
// Backoff before each retry. The last entry applies only if the attempt cap is raised.
const RETRY_DELAYS_MS = [500, 1000, 2000];
const JITTER_MS = 250;
export type Sleep = (ms: number) => Promise<void>;
const realSleep: Sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function emptyResult(attempts: number): ProviderResult {
  return {
    text: null,
    costMicro: null,
    model: null,
    provider: null,
    finishReason: null,
    promptTokens: null,
    completionTokens: null,
    latencyMs: 0,
    attempts,
    error: null,
    fatal: false,
  };
}

/** One request. Returns true only for a transport failure that is safe to repeat. */
async function attemptCall(
  key: string,
  messages: Message[],
  fetcher: typeof fetch,
  kind: ProviderKind,
  result: ProviderResult,
): Promise<boolean> {
  let billable = false;
  try {
    const response = await fetcher(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "Underclass?",
          "X-OpenRouter-Metadata": "enabled",
        },
        body: JSON.stringify(requestBody(messages, kind)),
        signal: AbortSignal.timeout(60_000),
        redirect: "manual",
      },
    );
    if (!response.ok) {
      result.error = "provider_http_" + response.status;
      result.fatal = true;
      return RETRYABLE_STATUS.has(response.status);
    }
    // A 2xx response may already be billed. Never repeat the request past this point.
    billable = true;
    const text = await readBounded(response.body, 262144);
    const body = JSON.parse(text);
    const cost = body?.usage?.cost;
    if (
      typeof cost === "number" &&
      cost >= 0 &&
      Number.isSafeInteger(Math.ceil(cost * 1_000_000))
    )
      result.costMicro = Math.ceil(cost * 1_000_000);
    const expectedModel = kind === "judge" ? JUDGE_MODEL : MODEL;
    const expectedProvider = kind === "judge" ? "DeepSeek" : "Anthropic";
    const allowedModels = [expectedModel, CANONICAL_MODELS[kind]];
    result.model = reportedRoute(body.model, key);
    const endpoints: unknown = body.openrouter_metadata?.endpoints?.available;
    const selected = Array.isArray(endpoints)
      ? endpoints.filter(
          (endpoint: unknown) => record(endpoint) && endpoint.selected === true,
        )
      : [];
    const selectedRoute =
      selected.length === 1 && record(selected[0]) ? selected[0] : null;
    const provider = body.provider ?? selectedRoute?.provider;
    result.provider = reportedRoute(provider, key);
    const metadataMismatch =
      selected.length > 0 &&
      (!selectedRoute ||
        selectedRoute.provider !== expectedProvider ||
        !allowedModels.includes(String(selectedRoute.model)));
    result.promptTokens =
      Number.isSafeInteger(body.usage?.prompt_tokens) &&
      body.usage.prompt_tokens >= 0
        ? body.usage.prompt_tokens
        : null;
    result.completionTokens =
      Number.isSafeInteger(body.usage?.completion_tokens) &&
      body.usage.completion_tokens >= 0
        ? body.usage.completion_tokens
        : null;
    const choice = body.choices?.[0];
    result.finishReason = [
      "stop",
      "length",
      "tool_calls",
      "content_filter",
      "error",
      "function_call",
    ].includes(choice?.finish_reason)
      ? choice.finish_reason
      : null;
    if (
      !allowedModels.includes(body.model) ||
      provider !== expectedProvider ||
      metadataMismatch
    ) {
      result.error = "route_mismatch";
      result.fatal = true;
      return false;
    }
    if (result.costMicro === null) {
      result.error = "cost_unavailable";
      result.fatal = true;
      return false;
    }
    if (body.error || !choice) {
      result.error = "provider_error";
      result.fatal = true;
      return false;
    }
    if (choice.finish_reason !== "stop") {
      result.error = "incomplete_response";
      return false;
    }
    if (
      typeof choice.message?.content !== "string" ||
      choice.message.content.trim() === ""
    ) {
      result.error = "missing_response";
      return false;
    }
    result.text = choice.message.content;
    if (Array.isArray(choice.message.reasoning_details))
      result.reasoningDetails = choice.message.reasoning_details;
    return false;
  } catch {
    result.error = "provider_connection_failed";
    result.fatal = true;
    return !billable;
  }
}

export async function callProvider(
  key: string,
  messages: Message[],
  fetcher: typeof fetch = fetch,
  kind: ProviderKind = "subject",
  sleep: Sleep = realSleep,
): Promise<ProviderResult> {
  const start = Date.now();
  let result = emptyResult(1);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    result = emptyResult(attempt);
    const retryable = await attemptCall(key, messages, fetcher, kind, result);
    result.latencyMs = Date.now() - start;
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    await sleep(
      RETRY_DELAYS_MS[attempt - 1] + Math.round(Math.random() * JITTER_MS),
    );
  }
  return result;
}
