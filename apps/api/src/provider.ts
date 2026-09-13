import { MAX_TOKENS, MODEL } from "./protocol";
import { readBounded } from "./util";
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
  error: string | null;
  fatal: boolean;
}
export function requestBody(messages: Message[]) {
  return {
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    reasoning: { effort: "low" },
    provider: {
      only: ["anthropic"],
      allow_fallbacks: false,
      require_parameters: true,
      max_price: { prompt: 2, completion: 10, request: 0 },
    },
  };
}
export function reservationMicro(messages: Message[]): number {
  // UTF-8 bytes upper-bound text tokens, plus generous framing; no tools/images.
  return (
    (new TextEncoder().encode(JSON.stringify(messages)).length + 4096) * 2 +
    MAX_TOKENS * 10
  );
}
export async function callProvider(
  key: string,
  messages: Message[],
  fetcher: typeof fetch = fetch,
): Promise<ProviderResult> {
  const start = Date.now();
  const result: ProviderResult = {
    text: null,
    costMicro: null,
    model: null,
    provider: null,
    finishReason: null,
    promptTokens: null,
    completionTokens: null,
    latencyMs: 0,
    error: null,
    fatal: false,
  };
  try {
    const response = await fetcher(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "Underclass?",
        },
        body: JSON.stringify(requestBody(messages)),
        signal: AbortSignal.timeout(60_000),
        redirect: "error",
      },
    );
    const text = await readBounded(response.body, 262144);
    if (!response.ok) {
      result.error = "provider_http_" + response.status;
      result.fatal = true;
      return result;
    }
    const body = JSON.parse(text);
    const cost = body?.usage?.cost;
    if (typeof cost === "number" && Number.isFinite(cost) && cost >= 0)
      result.costMicro = Math.ceil(cost * 1_000_000);
    result.model = typeof body.model === "string" ? body.model : null;
    result.provider = typeof body.provider === "string" ? body.provider : null;
    result.promptTokens = Number.isInteger(body.usage?.prompt_tokens)
      ? body.usage.prompt_tokens
      : null;
    result.completionTokens = Number.isInteger(body.usage?.completion_tokens)
      ? body.usage.completion_tokens
      : null;
    const choice = body.choices?.[0];
    result.finishReason = choice?.finish_reason ?? null;
    if (result.model !== MODEL || result.provider !== "Anthropic") {
      result.error = "route_mismatch";
      result.fatal = true;
      return result;
    }
    if (result.costMicro === null) {
      result.error = "cost_unavailable";
      result.fatal = true;
      return result;
    }
    if (body.error || !choice) {
      result.error = "provider_error";
      result.fatal = true;
      return result;
    }
    if (choice.finish_reason !== "stop") {
      result.error = "incomplete_response";
      return result;
    }
    if (typeof choice.message?.content !== "string") {
      result.error = "missing_response";
      return result;
    }
    result.text = choice.message.content;
    if (Array.isArray(choice.message.reasoning_details))
      result.reasoningDetails = choice.message.reasoning_details;
  } catch {
    result.error = "provider_connection_failed";
    result.fatal = true;
  } finally {
    result.latencyMs = Date.now() - start;
  }
  return result;
}
