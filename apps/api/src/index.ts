import type {
  AppConfig,
  Identity,
  RecordedExample,
} from "@underclass/contracts";
import { protocolInfo } from "./protocol";
import { HttpError, microdollars, readBounded, sha256, usd } from "./util";
import recordedExample from "./recorded-example.json";
export { ExperimentRun } from "./run";
export { Campaign } from "./campaign";

export const RECORDED_EXAMPLE: RecordedExample = {
  kind: "recorded-pilot",
  recordedAt: "2026-09-12",
  model: "anthropic/claude-sonnet-5",
  provider: "Anthropic",
  conditions: ["anonymous_a", "anonymous_b", "reference"],
  calls: 96,
  trials: 72,
  wallSeconds: 89.10090666695032,
  costUsd: 0.289478,
  grading: {
    anonymousA: 6.0625,
    anonymousB: 6.3125,
    anonymousMean: 6.1875,
    reference: 4.875,
    referenceDelta: -1.3125,
  },
  confidence: { anonymousMean: 87.5, reference: 83.75, referenceDelta: -3.75 },
  examples: [recordedExample as RecordedExample["examples"][number]],
  limitations: [
    "Recorded pilot with two identical anonymous contexts and the researcher reference; no visitor identity was tested.",
    "Grades assess the fixed assistant answers, not the person. A lower grade does not establish worse service.",
    "Same small task pack repeated twice; no held-out task validation or personal ranking.",
  ],
  sourceUrl: "https://transluce.org/user-awareness",
};
function ready(env: Env): boolean {
  return (
    env.LIVE_RUNS_ENABLED === "true" &&
    microdollars(env.SPONSORED_BUDGET_USD) > 0 &&
    microdollars(env.RUN_BUDGET_USD) > 0 &&
    !!(
      env.OPENROUTER_API_KEY &&
      env.TURNSTILE_SECRET_KEY &&
      env.ABUSE_HASH_SECRET &&
      env.TURNSTILE_SITE_KEY &&
      env.TURNSTILE_HOSTNAME
    )
  );
}
export function validateIdentity(input: unknown): Identity {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new HttpError(
      400,
      "invalid_identity",
      "Enter a name and optional affiliation.",
    );
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((k) => !["name", "affiliation"].includes(k)))
    throw new HttpError(
      400,
      "invalid_identity",
      "Only a name and affiliation are accepted.",
    );
  function field(v: unknown, max: number, optional = false): string {
    if (optional && (v === undefined || v === "")) return "";
    if (typeof v !== "string")
      throw new HttpError(
        400,
        "invalid_identity",
        "Identity fields must be text.",
      );
    const s = v.trim().normalize("NFC");
    if (
      (!optional && !s) ||
      s.length > max ||
      /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(s)
    )
      throw new HttpError(
        400,
        "invalid_identity",
        "Use a short name and affiliation without control characters.",
      );
    return s;
  }
  const name = field(value.name, 120),
    affiliation = field(value.affiliation, 160, true);
  return { name, ...(affiliation ? { affiliation } : {}) };
}
async function access(request: Request): Promise<string> {
  const match = request.headers
    .get("Authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/);
  if (!match)
    throw new HttpError(
      401,
      "access_required",
      "A run access token is required.",
    );
  return sha256(match[1]);
}
async function clientHash(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip || !env.ABUSE_HASH_SECRET)
    throw new HttpError(
      503,
      "abuse_protection_unavailable",
      "Live tests are not configured.",
    );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ABUSE_HASH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(new Date().toISOString().slice(0, 10) + "|" + ip),
  );
  return Array.from(new Uint8Array(signed), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function verifyTurnstile(token: unknown, env: Env): Promise<void> {
  if (typeof token !== "string" || !token || token.length > 2048)
    throw new HttpError(
      400,
      "verification_required",
      "Complete the verification before starting.",
    );
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY!,
          response: token,
        }),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      },
    );
    const result = JSON.parse(await readBounded(response.body, 16384));
    if (
      !response.ok ||
      !result.success ||
      result.action !== "underclass" ||
      result.hostname !== env.TURNSTILE_HOSTNAME
    )
      throw new HttpError(
        400,
        "verification_failed",
        "The verification failed. Please try again.",
      );
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      503,
      "verification_unavailable",
      "Verification is temporarily unavailable.",
    );
  }
}
async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname;
  if (request.method === "GET" && path === "/api/health")
    return Response.json({ ok: true });
  if (request.method === "GET" && path === "/api/example")
    return Response.json(RECORDED_EXAMPLE);
  if (request.method === "GET" && path === "/api/config") {
    const liveEnabled = ready(env);
    const a = liveEnabled
      ? await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()
      : null;
    const body: AppConfig = {
      protocol: await protocolInfo(),
      liveEnabled,
      availability: !liveEnabled
        ? "disabled"
        : a?.reason === "campaign_busy"
          ? "busy"
          : a?.reason
            ? "exhausted"
            : "available",
      runBudgetUsd: usd(microdollars(env.RUN_BUDGET_USD)),
      estimatedCostUsd: 0.29,
      estimatedSeconds: 90,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY,
      retentionHours: 24,
    };
    return Response.json(body);
  }
  if (request.method === "POST" && path === "/api/runs") {
    const id = await access(request);
    if (
      !request.headers
        .get("Content-Type")
        ?.toLowerCase()
        .startsWith("application/json")
    )
      throw new HttpError(415, "json_required", "Send JSON.");
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await readBounded(request.body, 4096));
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(
        400,
        "invalid_json",
        "The request was not valid JSON.",
      );
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (k) => !["identity", "consent", "turnstileToken"].includes(k),
      )
    )
      throw new HttpError(400, "invalid_request", "Unexpected run fields.");
    if (body.consent !== true)
      throw new HttpError(
        400,
        "consent_required",
        "Confirm that this identity may be sent to the model providers.",
      );
    const identity = validateIdentity(body.identity),
      fingerprint = await sha256(JSON.stringify(identity));
    const stub = env.RUNS.getByName(id),
      old = await stub.existing(fingerprint);
    if (old) return Response.json(old, { status: 200 });
    if (!ready(env))
      throw new HttpError(
        503,
        "live_disabled",
        "Live tests are not enabled. The recorded example is available.",
      );
    await verifyTurnstile(body.turnstileToken, env);
    const created = await stub.initialize({
      id,
      identity,
      fingerprint,
      client: await clientHash(request, env),
      cap: microdollars(env.RUN_BUDGET_USD),
    });
    return Response.json(created, { status: 202 });
  }
  const match = path.match(/^\/api\/runs\/([a-f0-9]{64})(\/cancel)?$/);
  if (match) {
    const derived = await access(request);
    if (derived !== match[1])
      throw new HttpError(404, "run_not_found", "This run is not available.");
    const stub = env.RUNS.getByName(derived);
    if (request.method === "GET" && !match[2]) {
      const data = await stub.snapshot();
      if (!data)
        throw new HttpError(404, "run_not_found", "This run is not available.");
      return Response.json(data);
    }
    if (request.method === "POST" && match[2]) {
      const data = await stub.cancel();
      if (!data)
        throw new HttpError(404, "run_not_found", "This run is not available.");
      return Response.json(data);
    }
    if (request.method === "DELETE" && !match[2]) {
      await stub.remove();
      return new Response(null, { status: 204 });
    }
  }
  throw new HttpError(404, "not_found", "This endpoint does not exist.");
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin"),
      url = new URL(request.url);
    const allowed =
      !origin ||
      origin === url.origin ||
      env.ALLOWED_ORIGINS.split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .includes(origin);
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      Vary: "Origin",
    });
    if (origin && allowed) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
      headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    }
    let response: Response;
    try {
      if (!allowed)
        throw new HttpError(
          403,
          "origin_denied",
          "This origin is not allowed.",
        );
      response =
        request.method === "OPTIONS"
          ? new Response(null, { status: 204 })
          : await route(request, env);
    } catch (error) {
      // Custom properties do not survive DO RPC. Our fixed error envelope does.
      const match =
        error instanceof Error
          ? error.message.match(/\[underclass\/(\d{3})\/([a-z_]+)\] (.*)/)
          : null;
      response = Response.json(
        {
          error: {
            code: match?.[2] ?? "internal_error",
            message: match?.[3] ?? "The request could not be completed.",
          },
        },
        { status: match ? Number(match[1]) : 500 },
      );
    }
    const out = new Response(response.body, response);
    headers.forEach((value, key) => out.headers.set(key, value));
    return out;
  },
} satisfies ExportedHandler<Env>;
