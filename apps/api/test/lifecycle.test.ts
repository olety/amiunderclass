import { env, exports } from "cloudflare:workers";
import { reset, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Funding, Identity, RunSnapshot } from "@underclass/contracts";
import worker, { validateIdentity } from "../src/index";
import { JUDGE_MODEL } from "../src/judge";
import { MODEL } from "../src/protocol";
import { reservationMicro, verifyProviderKey, type Message } from "../src/provider";
import { sha256 } from "../src/util";

const capability = "c".repeat(64);
const providerKey = "sk-or-v1-" + "K".repeat(32);
const identity: Identity = {
  name: "Private Fixture Person",
  pronouns: "they/them",
  affiliation: "Private Fixture Company",
  email: "private-fixture@example.test",
};
const headers = {
  Authorization: `Bearer ${capability}`,
  "Content-Type": "application/json",
  Origin: "http://localhost:5173",
  "CF-Connecting-IP": "192.0.2.20",
};
const input = { identity, providerKey, consent: true, turnstileToken: "mock-verification" };
const api = (path: string, init?: RequestInit) => exports.default.fetch("https://underclass.test" + path, init);
const releases: (() => void)[] = [];

beforeEach(async () => {
  await reset();
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Unmocked outbound request blocked"); }));
});
afterEach(async () => {
  releases.splice(0).forEach((release) => release());
  await reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  releases.push(release);
  return { promise, release };
}
interface RequestRecord { url: string; init?: RequestInit; body?: { model: string; messages: Message[] } }
function network(options: { barrier?: Promise<void>; missingCost?: "subject" | "judge"; malformedJudge?: boolean } = {}) {
  const requests: RequestRecord[] = [];
  let judgeCount = 0;
  const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const record: RequestRecord = { url: String(url), init };
    requests.push(record);
    if (record.url === "https://challenges.cloudflare.com/turnstile/v0/siteverify")
      return Response.json({ success: true, hostname: "underclass.test", action: "underclass" });
    if (record.url === "https://openrouter.ai/api/v1/key")
      return Response.json({ data: { label: "private account metadata", limit_remaining: 1 } });
    if (record.url !== "https://openrouter.ai/api/v1/chat/completions")
      throw new Error("Unexpected outbound URL");
    const body = JSON.parse(String(init?.body));
    record.body = body;
    if (options.barrier) await options.barrier;
    const judge = body.model === JUDGE_MODEL;
    if (judge) judgeCount++;
    const content = judge
      ? options.malformedJudge && judgeCount === 1 ? "not JSON" : JSON.stringify({
        refusal: "no", substantive: "yes", suspicious: "no",
        summary: "Mock classification.", evidence: { substantive: "", suspicious: "" },
      })
      : "Mock subject response.";
    return Response.json({
      model: judge ? JUDGE_MODEL : MODEL,
      provider: judge ? "OpenAI" : "Anthropic",
      usage: options.missingCost === (judge ? "judge" : "subject")
        ? {} : { cost: 0.001, prompt_tokens: 80, completion_tokens: 10 },
      choices: [{ finish_reason: "stop", message: { role: "assistant", content } }],
    });
  });
  vi.stubGlobal("fetch", fetcher);
  return { requests, calls: () => requests.filter((request) => request.body), fetcher };
}
async function create() {
  const response = await api("/api/runs", { method: "POST", headers, body: JSON.stringify(input) });
  expect(response.status).toBe(202);
  return ((await response.json()) as { id: string }).id;
}
async function snapshot(id: string) {
  const response = await api(`/api/runs/${id}`, { headers });
  expect(response.status).toBe(200);
  const result = await response.json() as RunSnapshot;
  expect(JSON.stringify(result)).not.toContain(providerKey);
  expect(result).not.toHaveProperty("providerKey");
  return result;
}
async function stored(id: string) {
  return runInDurableObject(env.RUNS.getByName(id), (_, state) => {
    const rows = state.storage.sql.exec<{ data: string }>("SELECT data FROM meta").toArray();
    return { meta: rows[0] ? JSON.parse(rows[0].data) : null, jobs: state.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM jobs").one().n };
  });
}
async function settled(id: string) {
  let result!: RunSnapshot;
  await vi.waitFor(async () => {
    result = await snapshot(id);
    expect(["queued", "running"]).not.toContain(result.status);
    expect(result.spending.reservedUsd).toBe(0);
    expect((await stored(id)).meta).not.toHaveProperty("providerKey");
    expect((await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).active).toBe(0);
  }, { timeout: 5000, interval: 10 });
  return result;
}
async function fixture(options: { funding?: Funding; identity?: Identity | null; patch?: Record<string, unknown>; rehearsalEnabled?: boolean } = {}) {
  const id = await sha256(capability);
  const stub = env.RUNS.getByName(id);
  await runInDurableObject(stub, async (instance, state) => {
    if (options.rehearsalEnabled)
      (instance as unknown as { env: Env }).env = { ...env, REHEARSAL_RUNS: "true" };
    await instance.initialize({
      id, identity: options.identity === undefined ? identity : options.identity,
      funding: options.funding ?? "visitor", providerKey: options.funding === "rehearsal" ? undefined : providerKey,
      fingerprint: "fixture", client: "fixture-client", cap: 300000,
    });
    const meta = JSON.parse(state.storage.sql.exec<{ data: string }>("SELECT data FROM meta").one().data);
    Object.assign(meta, options.patch);
    state.storage.sql.exec("UPDATE meta SET data=? WHERE id=1", JSON.stringify(meta));
    await state.storage.setAlarm(Date.now() + 60000);
  });
  return { id, stub };
}

describe("provider key lifecycle", () => {
  it("keeps a BYOK key only while running and never puts credentials or identity in logs or URLs", async () => {
    const gate = barrier();
    const mock = network({ barrier: gate.promise });
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "info"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    const id = await create();
    await vi.waitFor(() => expect(mock.calls()).toHaveLength(4));
    expect((await stored(id)).meta.providerKey).toBe(providerKey);
    expect((await snapshot(id)).funding).toBe("visitor");
    gate.release();
    expect((await settled(id)).status).toBe("completed");
    expect(mock.calls()).toHaveLength(72);
    const keyCheck = mock.requests.find((request) => request.url.endsWith("/key"))!;
    expect(keyCheck.init).toMatchObject({ method: "GET", redirect: "manual" });
    expect(keyCheck.init?.signal).toBeInstanceOf(AbortSignal);
    for (const request of mock.requests) {
      expect(request.url).not.toContain(providerKey);
      for (const value of Object.values(identity)) expect(request.url).not.toContain(value);
      if (request.url.startsWith("https://openrouter.ai/"))
        expect(new Headers(request.init?.headers).get("Authorization")).toBe(`Bearer ${providerKey}`);
    }
    const logText = JSON.stringify(logs.flatMap((log) => log.mock.calls));
    expect(logText).not.toContain(providerKey);
    for (const value of Object.values(identity)) expect(logText).not.toContain(value);
    expect(JSON.stringify((await stored(id)).meta)).not.toContain("private account metadata");
    expect((await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).committed).toBe(0);
  });

  it("removes the key after a failed subject call and retains its uncertain charge", async () => {
    const mock = network({ missingCost: "subject" });
    const done = await settled(await create());
    expect(done.status).toBe("failed");
    expect(done.stopReason).toBe("cost_unavailable");
    expect(mock.calls()).toHaveLength(4);
    const reserved = mock.calls().reduce((sum, request) => sum + reservationMicro(request.body!.messages), 0);
    expect(done.spending.uncertainUsd).toBe(reserved / 1_000_000);
  });

  it("accounts for missing judge cost using judge reservations and never retries the batch", async () => {
    const mock = network({ missingCost: "judge" });
    const done = await settled(await create());
    const judges = mock.calls().filter((request) => request.body!.model === JUDGE_MODEL);
    expect(done.status).toBe("failed");
    expect(done.stopReason).toBe("cost_unavailable");
    expect(mock.calls()).toHaveLength(8);
    expect(judges).toHaveLength(4);
    const reserved = judges.reduce((sum, request) => sum + reservationMicro(request.body!.messages, "judge"), 0);
    expect(done.spending).toMatchObject({ knownUsd: 0.004, uncertainUsd: reserved / 1_000_000, reservedUsd: 0 });
    expect(done.progress.finishedCalls).toBe(8);
    expect(done.progress.failedCalls).toBe(4);
  });

  it("removes the key after a partial run while retaining the failed judge provenance", async () => {
    const mock = network({ malformedJudge: true });
    const done = await settled(await create());
    expect(done.status).toBe("partial");
    expect(mock.calls()).toHaveLength(72);
    expect(done.trials.filter((trial) => trial.status === "missing")).toHaveLength(1);
    const missing = done.trials.find((trial) => trial.status === "missing")!;
    expect(missing.judge?.error).toBe("judge_invalid_json");
    expect(missing.calls.find((call) => call.turn === "judge")).toMatchObject({ reportedProvider: "OpenAI", costUsd: 0.001 });
  });

  it("erases the key on cancellation before in-flight calls finish", async () => {
    const gate = barrier();
    const mock = network({ barrier: gate.promise });
    const id = await create();
    await vi.waitFor(() => expect(mock.calls()).toHaveLength(4));
    expect((await api(`/api/runs/${id}/cancel`, { method: "POST", headers })).status).toBe(200);
    expect((await stored(id)).meta).not.toHaveProperty("providerKey");
    expect((await snapshot(id)).status).toBe("cancelled");
    gate.release();
    const done = await settled(id);
    expect(done.spending.knownUsd).toBe(0.004);
    expect(mock.calls()).toHaveLength(4);
  });

  it("erases key, identity and jobs on deletion and ignores late provider text", async () => {
    const gate = barrier();
    const mock = network({ barrier: gate.promise });
    const id = await create();
    await vi.waitFor(() => expect(mock.calls()).toHaveLength(4));
    expect((await api(`/api/runs/${id}`, { method: "DELETE", headers })).status).toBe(204);
    const deleted = await stored(id);
    expect(deleted.meta).not.toHaveProperty("providerKey");
    expect(deleted.meta.identity).toBeNull();
    expect(deleted.jobs).toBe(0);
    gate.release();
    await vi.waitFor(async () => expect((await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).active).toBe(0));
    expect((await api(`/api/runs/${id}`, { headers })).status).toBe(410);
    expect((await stored(id)).jobs).toBe(0);
    expect(JSON.stringify((await stored(id)).meta)).not.toContain(providerKey);
    expect(mock.calls()).toHaveLength(4);
  });

  it.each(["protocol_changed", "run_deadline"])("erases the key when recovery stops for %s", async (reason) => {
    const { id, stub } = await fixture({ patch: reason === "run_deadline" ? { deadline: Date.now() - 1 } : undefined });
    if (reason === "protocol_changed") await runInDurableObject(stub, (_, state) => {
      const meta = JSON.parse(state.storage.sql.exec<{ data: string }>("SELECT data FROM meta").one().data);
      meta.protocol.hash = "0".repeat(64);
      state.storage.sql.exec("UPDATE meta SET data=? WHERE id=1", JSON.stringify(meta));
    });
    expect((await stored(id)).meta.providerKey).toBe(providerKey);
    await runDurableObjectAlarm(stub);
    expect(await settled(id)).toMatchObject({ status: "failed", stopReason: reason });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("erases key and identity immediately when an expired run is read", async () => {
    const { id } = await fixture({ patch: { expires: Date.now() - 1 } });
    expect((await stored(id)).meta.providerKey).toBe(providerKey);
    expect((await api(`/api/runs/${id}`, { headers })).status).toBe(410);
    const expired = await stored(id);
    expect(expired.meta).not.toHaveProperty("providerKey");
    expect(expired.meta?.identity ?? null).toBeNull();
    expect(expired.jobs).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("identity and rehearsal boundaries", () => {
  it("accepts the four bounded identity fields and normalizes their text", () => {
    expect(validateIdentity({ name: "  E\u0301lodie  ", pronouns: " they/them ", affiliation: " Example ", email: " person@example.test " }))
      .toEqual({ name: "Élodie", pronouns: "they/them", affiliation: "Example", email: "person@example.test" });
    expect(validateIdentity(null)).toBeNull();
    expect(validateIdentity({ name: "Example", pronouns: "", affiliation: "", email: "" })).toEqual({ name: "Example" });
  });

  it.each([
    { name: "x".repeat(121) }, { name: "Example", pronouns: "x".repeat(41) },
    { name: "Example", affiliation: "x".repeat(161) }, { name: "Example", email: "x".repeat(255) },
    { name: "Example\n" }, { name: "Example", pronouns: "they\u0000them" },
    { name: "Example", affiliation: "left\u202eright" }, { name: "Example", email: "person@example.test\r" },
    { name: "Example", email: "Person <person@example.test>" }, { name: "Example", email: "a@example.test,b@example.test" },
    { name: "Example", role: "administrator" },
  ])("rejects invalid or unbounded identity input before network access", async (invalid) => {
    const response = await api("/api/runs", { method: "POST", headers, body: JSON.stringify({ ...input, identity: invalid }) });
    expect(response.status).toBe(400);
    expect((await response.json()) as unknown).toMatchObject({ error: { code: "invalid_identity" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects rehearsal requests while the deployment flag is absent", async () => {
    const disabledEnv: Env = { ...env };
    Reflect.deleteProperty(disabledEnv, "REHEARSAL_RUNS");
    const response = await worker.fetch(new Request("https://underclass.test/api/runs", {
      method: "POST", headers,
      body: JSON.stringify({ identity, consent: true, turnstileToken: "", rehearsal: true }),
    }), disabledEnv);
    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("creates a rehearsal through HTTP with live spending disabled and no verification calls", async () => {
    const rehearsalEnv = { ...env, LIVE_RUNS_ENABLED: "false", REHEARSAL_RUNS: "true" };
    const id = await sha256(capability);
    // A direct handler call uses the supplied bindings only for the HTTP layer.
    // Give the real Durable Object the same deployment flags before its alarm starts.
    await runInDurableObject(env.RUNS.getByName(id), (instance) => {
      (instance as unknown as { env: Env }).env = rehearsalEnv;
    });
    const request = () => new Request("https://underclass.test/api/runs", {
      method: "POST", headers,
      body: JSON.stringify({ identity, consent: true, turnstileToken: "", rehearsal: true }),
    });
    const created = await worker.fetch(request(), rehearsalEnv);
    expect(created.status).toBe(202);
    expect(await created.json()).toMatchObject({ id, status: "queued" });
    const replay = await worker.fetch(request(), rehearsalEnv);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ id });
    await vi.waitFor(async () => {
      const current = await snapshot(id);
      expect(current.funding).toBe("rehearsal");
      expect(current.progress.finishedCalls).toBe(4);
      expect(current.spending).toMatchObject({ knownUsd: 0, uncertainUsd: 0, reservedUsd: 0 });
    });
    const data = await stored(id);
    expect(data.meta).not.toHaveProperty("providerKey");
    expect(data.meta.client).toBe("rehearsal");
    expect((await api(`/api/runs/${id}/cancel`, { method: "POST", headers })).status).toBe(200);
    expect((await settled(id)).status).toBe("cancelled");
    expect(fetch).not.toHaveBeenCalled();
    expect((await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).active).toBe(0);
  });

  it("rejects a provider key on an enabled rehearsal before creating a run", async () => {
    const response = await worker.fetch(new Request("https://underclass.test/api/runs", {
      method: "POST", headers, body: JSON.stringify({ ...input, rehearsal: true }),
    }), { ...env, REHEARSAL_RUNS: "true" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
    expect(await stored(await sha256(capability))).toEqual({ meta: null, jobs: 0 });
    expect(fetch).not.toHaveBeenCalled();
    const campaign = await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability();
    expect(campaign).toMatchObject({ active: 0, committed: 0, count: 0 });
  });

  it.each([false, true])("runs a paced synthetic rehearsal without network access, nameless=%s", async (nameless) => {
    const { id, stub } = await fixture({ funding: "rehearsal", identity: nameless ? null : identity, rehearsalEnabled: true });
    const planned = nameless ? 48 : 72;
    for (let finished = 4; finished <= planned; finished += 4) {
      await runDurableObjectAlarm(stub);
      const current = await snapshot(id);
      expect(current.progress.finishedCalls).toBe(finished);
      expect(current.spending).toMatchObject({ knownUsd: 0, uncertainUsd: 0, reservedUsd: 0 });
      if (finished < planned) {
        expect(current.status).toBe("running");
        const next = await runInDurableObject(stub, (_, state) => state.storage.getAlarm());
        expect(next! - Date.now()).toBeGreaterThan(nameless ? 5000 : 3000);
      }
    }
    const done = await settled(id);
    expect(done.status).toBe("completed");
    expect(done.funding).toBe("rehearsal");
    expect(done.limitations.join(" ")).toContain("SYNTHETIC REHEARSAL");
    expect(done.trials.every((trial) => trial.response?.includes("SYNTHETIC REHEARSAL"))).toBe(true);
    expect(done.trials.some((trial) => trial.condition === "visitor")).toBe(!nameless);
    expect(fetch).not.toHaveBeenCalled();
    expect((await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).committed).toBe(0);
  });

  it("exposes rehearsal availability only when its environment flag is enabled", async () => {
    const response = await worker.fetch(new Request("https://underclass.test/api/config"), { ...env, REHEARSAL_RUNS: "true" });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ rehearsalEnabled: true });
  });

  it("bounds key verification response size and discards account data", async () => {
    const oversized = vi.fn(async () => new Response(" ".repeat(16_385)));
    expect(await verifyProviderKey(providerKey, oversized)).toEqual({ ok: false, error: "provider_key_verification_unavailable" });
    expect(oversized).toHaveBeenCalledTimes(1);
    const invalid = vi.fn(async () => Response.json({ data: { label: providerKey } }, { status: 401 }));
    expect(await verifyProviderKey(providerKey, invalid)).toEqual({ ok: false, error: "provider_key_invalid" });
  });
});
