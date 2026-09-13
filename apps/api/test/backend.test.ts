import { env, exports } from "cloudflare:workers";
import {
  reset,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  makeJobs,
  NAMELESS_CONDITIONS,
  MODEL,
  protocolInfo,
  systemPrompt,
  TASKS,
} from "../src/protocol";
import {
  comparisons,
  parseAction,
  parseNumber,
  trialResults,
} from "../src/analysis";
import { callProvider, requestBody, reservationMicro } from "../src/provider";
import { JUDGE_MODEL } from "../src/judge";
import { sha256 } from "../src/util";
import { createAccessToken } from "@underclass/contracts/client";
import type { RunSnapshot } from "@underclass/contracts";

beforeEach(async () => {
  await reset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Unmocked outbound request blocked");
    }),
  );
});
afterEach(async () => {
  // Stop scheduled work before restoring a real global fetch.
  await reset();
  vi.unstubAllGlobals();
});
const token = "a".repeat(64);
const auth = (t = token) => ({
  Authorization: "Bearer " + t,
  "Content-Type": "application/json",
  Origin: "http://localhost:5173",
  "CF-Connecting-IP": "192.0.2.10",
});
const createBody = {
  identity: { name: "Test Person", affiliation: "Example" },
  consent: true,
  turnstileToken: "mock-verification",
};
const api = (path: string, init?: RequestInit) =>
  exports.default.fetch("https://underclass.test" + path, init);
function response(text = "6", overrides: Record<string, unknown> = {}) {
  return {
    model: MODEL,
    provider: "Anthropic",
    usage: { cost: 0.001, prompt_tokens: 80, completion_tokens: 10 },
    choices: [
      { finish_reason: "stop", message: { role: "assistant", content: text } },
    ],
    ...overrides,
  };
}
function mockNetwork(
  options: { noCost?: boolean; route?: string; barrier?: Promise<void> } = {},
) {
  const requests: any[] = [];
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify")
      return Response.json({
        success: true,
        hostname: "underclass.test",
        action: "underclass",
      });
    if (url !== "https://openrouter.ai/api/v1/chat/completions")
      throw new Error("Unexpected outbound URL");
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    if (options.barrier) await options.barrier;
    const judge = body.model === JUDGE_MODEL;
    const reference = judge
      ? JSON.parse(body.messages[1].content).response === "Reference response."
      : body.messages[0].content.includes("Amanda Askell");
    const text = judge
      ? JSON.stringify({ refusal: reference ? "no" : "yes", substantive: reference ? "yes" : "no", suspicious: reference ? "no" : "yes", summary: "Mock response classification.", evidence: { substantive: "", suspicious: "" } })
      : reference ? "Reference response." : "Other response.";
    return Response.json(
      response(text, {
        ...(judge ? { model: JUDGE_MODEL, provider: "DeepSeek" } : {}),
        ...(options.noCost ? { usage: {} } : {}),
        ...(options.route ? { provider: options.route } : {}),
      }),
    );
  });
  vi.stubGlobal("fetch", spy);
  return { requests, spy };
}
async function create(body: Record<string, unknown> = createBody) {
  const res = await api("/api/runs", {
    method: "POST",
    headers: auth(),
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(202);
  return (await res.json()) as { id: string };
}
async function snapshot(id: string) {
  const r = await api("/api/runs/" + id, { headers: auth() });
  expect(r.status).toBe(200);
  return (await r.json()) as RunSnapshot;
}
async function drain(id: string) {
  let result!: RunSnapshot;
  await vi.waitFor(
    async () => {
      result = await snapshot(id);
      expect(["queued", "running"]).not.toContain(result.status);
      expect(result.spending.reservedUsd).toBe(0);
    },
    { timeout: 15000, interval: 25 },
  );
  await vi.waitFor(
    async () => {
      expect(
        (await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).active,
      ).toBe(0);
    },
    { timeout: 3000, interval: 25 },
  );
  return result;
}

describe("protocol and measurements", () => {
  it("creates fresh, interleaved visitor trials with 12 subject calls and 12 judge calls", async () => {
    const jobs = makeJobs(17);
    expect(TASKS).toHaveLength(6);
    expect(TASKS.every((task) => task.kind === "borderline")).toBe(true);
    expect(jobs).toHaveLength(24);
    expect(new Set(jobs.map((j) => j.id)).size).toBe(24);
    expect(jobs.filter((j) => j.dependency)).toHaveLength(12);
    expect(jobs.filter((j) => j.turn === "judge")).toHaveLength(12);
    expect(jobs.filter((j) => j.condition === "visitor")).toHaveLength(24);
    expect(makeJobs(17)).toEqual(jobs);
    expect(makeJobs(18)).not.toEqual(jobs);
    expect(systemPrompt("anonymous", { name: "Private Name" })).not.toContain(
      "Private",
    );
    expect(systemPrompt("reference", { name: "Private Name" })).not.toContain(
      "Private",
    );
    const named = await protocolInfo();
    const nameless = await protocolInfo(NAMELESS_CONDITIONS);
    expect(named.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(named).toMatchObject({ version: "underclass-v3", plannedTrials: 12, plannedCalls: 24 });
    expect(nameless).toMatchObject({ plannedTrials: 0, plannedCalls: 0 });
    expect(nameless.hash).not.toBe(named.hash);
    expect(makeJobs(17, NAMELESS_CONDITIONS)).toEqual([]);
  });
  it("keeps unsupported, ambiguous and out-of-range measurements missing", () => {
    expect(parseNumber("**Score: 6/10**\nReason", "grading")).toBe(6);
    expect(parseNumber("About65%", "behavior")).toBe(65);
    for (const value of [
      "7-8",
      "7 – 8",
      "11/10",
      "I cannot grade this. 6/10",
      "0",
      "",
    ])
      expect(parseNumber(value, "grading")).toBeNull();
    expect(parseNumber("101%", "behavior")).toBeNull();
    expect(parseAction("yes.")).toBe("yes");
    expect(parseAction("yes or no")).toBeNull();
  });
  it("pairs every complete visitor trial with the published figures and drops missing labels", () => {
    const jobs = makeJobs(1).map((j) => ({
      ...j,
      status: "done" as const,
      result: {
        text: j.turn === "judge" ? JSON.stringify({
          refusal: "no",
          substantive: "yes",
          suspicious: "no",
          summary: "Mock response classification.",
          evidence: { substantive: "", suspicious: "" },
        }) : "Mock subject response.",
      },
    })) as any;
    const trials = trialResults(jobs),
      result = comparisons(trials);
    expect(result[0].metric).toBe("latitude");
    expect(result[0].matchedTriplets).toBe(12);
    expect(result[0].matchedPairs).toBe(0);
    expect(result[0].taskClusters).toBe(6);
    expect(result[0].means.visitor).toBe(1);
    // Amanda's published latitude over the same six requests averages 0.75.
    expect(result[0].visitorMinusReference).toBeCloseTo(0.25, 10);
    expect(result[1].means.visitor).toBe(0);
    const missing = trials[0];
    missing.status = "missing";
    missing.value = null;
    expect(comparisons(trials)[0].matchedTriplets).toBe(11);
    expect(JSON.stringify(result)).not.toMatch(/tier|percentile/);
  });
});
describe("provider boundaries", () => {
  it("pins the route, preserves two-turn reasoning payloads and bounds requests", async () => {
    const messages: any = [
      { role: "system", content: "system" },
      { role: "user", content: "hi" },
      {
        role: "assistant",
        content: "yes",
        reasoning_details: [{ type: "reasoning.encrypted", data: "opaque" }],
      },
      { role: "user", content: "confidence?" },
    ];
    const body = requestBody(messages);
    expect(body.provider).toMatchObject({
      only: ["anthropic"],
      allow_fallbacks: false,
      require_parameters: true,
    });
    expect(body.messages[2].reasoning_details).toEqual(
      messages[2].reasoning_details,
    );
    expect(body).not.toHaveProperty("temperature");
    expect(reservationMicro(messages)).toBeGreaterThan(20480);
    const r = await callProvider("fake", messages, async () =>
      Response.json(response("yes")),
    );
    expect(r.error).toBeNull();
    expect(r.costMicro).toBe(1000);
    const judge = requestBody(messages.slice(0, 2), "judge");
    expect(judge.model).toBe(JUDGE_MODEL);
    expect(judge.provider).toMatchObject({ only: ["deepseek"], allow_fallbacks: false });
    expect(judge.response_format).toEqual({ type: "json_object" });
    expect(judge.reasoning).toEqual({ effort: "high" });
    const judged = await callProvider("fake", messages.slice(0, 2), async () =>
      Response.json(response("{}", { model: JUDGE_MODEL, provider: "DeepSeek" })), "judge");
    expect(judged.error).toBeNull();
  });
  it.each([
    [{ provider: "Other" }, "route_mismatch"],
    [{ usage: {} }, "cost_unavailable"],
    [
      { choices: [{ finish_reason: "length", message: { content: "6" } }] },
      "incomplete_response",
    ],
  ])(
    "does not measure an invalid upstream response",
    async (overrides, error) => {
      const r = await callProvider(
        "fake",
        [{ role: "user", content: "hi" }],
        async () => Response.json(response("6", overrides as any)),
      );
      expect(r.error).toBe(error);
      expect(r.text).toBeNull();
    },
  );
});
describe("campaign accounting", () => {
  it("atomically caps concurrent reservations and settles idempotently", async () => {
    const ledger = env.CAMPAIGNS.getByName(env.CAMPAIGN_ID);
    const reservations = await Promise.all(
      ["one", "two", "three"].map((id) => ledger.reserve(id, id, 750000)),
    );
    expect(reservations.filter((r) => r.ok)).toHaveLength(2);
    expect((await ledger.availability()).committed).toBe(1500000);
    await ledger.settle("one", 100000);
    await ledger.settle("one", 100000);
    await ledger.settle("two", 100000);
    expect((await ledger.availability()).committed).toBe(200000);
    expect((await ledger.reserve("four", "four", 750000)).ok).toBe(true);
  });
  it("halts the campaign after a reservation overrun", async () => {
    const ledger = env.CAMPAIGNS.getByName(env.CAMPAIGN_ID);
    await ledger.reserve("one", "client", 750000);
    await ledger.settle("one", 750001);
    expect((await ledger.availability()).reason).toBe("campaign_halted");
  });
});
describe("HTTP and durable execution", () => {
  it("serves a clearly marked recorded example without credentials or visitor data", async () => {
    const res = await api("/api/example"),
      body = (await res.json()) as any;
    expect(body.kind).toBe("recorded-pilot");
    expect(body.conditions).not.toContain("visitor");
    expect(body.grading.referenceDelta).toBe(-1.3125);
    expect(body.examples[0].taskId).toBe("marbles");
    expect(
      body.examples[0].responses.map((r: { value: number }) => r.value),
    ).toEqual([6, 6, 2]);
    expect(JSON.stringify(body)).not.toContain("test-key");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it("advertises the visitor-only plan, its estimate and the published baseline", async () => {
    const res = await api("/api/config"),
      body = (await res.json()) as any;
    expect(body.protocol).toMatchObject({
      version: "underclass-v3",
      conditions: ["visitor"],
      plannedCalls: 24,
      plannedTrials: 12,
    });
    expect(body.protocol.baseline.items).toHaveLength(6);
    expect(body.judgeModel).toBe(JUDGE_MODEL);
    expect(body.estimatedCostUsd).toBe(0.1);
    expect(body.estimatedSeconds).toBe(20);
    expect(JSON.stringify(body)).not.toContain("test-key");
  });
  it("rejects cross-origin, no-consent and arbitrary model requests before provider access", async () => {
    const cross = await api("/api/runs", {
      method: "POST",
      headers: { ...auth(), Origin: "https://evil.test" },
      body: JSON.stringify(createBody),
    });
    expect(cross.status).toBe(403);
    for (const body of [
      { ...createBody, consent: false },
      { ...createBody, model: "other" },
      { ...createBody, identity: { name: "a\nb" } },
    ]) {
      const r = await api("/api/runs", {
        method: "POST",
        headers: auth(),
        body: JSON.stringify(body),
      });
      expect(r.status).toBe(400);
    }
  });
  it("uses an unguessable capability and idempotently recovers a duplicate create", async () => {
    mockNetwork();
    const { id } = await create();
    const duplicate = await api("/api/runs", {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(createBody),
    });
    expect(duplicate.status).toBe(200);
    expect(((await duplicate.json()) as any).id).toBe(id);
    const conflict = await api("/api/runs", {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ ...createBody, identity: { name: "Another" } }),
    });
    expect(conflict.status).toBe(409);
    expect(
      (await api("/api/runs/" + id, { headers: auth("b".repeat(64)) })).status,
    ).toBe(404);
    expect(createAccessToken()).toMatch(/^[a-f0-9]{64}$/);
  });
  it("completes 24 pinned calls and gives the judge only the prompt and response", async () => {
    const network = mockNetwork();
    const { id } = await create();
    const done = await drain(id);
    expect(done.status).toBe("completed");
    expect(network.requests).toHaveLength(24);
    expect(done.progress.finishedCalls).toBe(24);
    expect(done.trials).toHaveLength(12);
    expect(done.trials.every((trial) => trial.condition === "visitor")).toBe(true);
    // Every mocked visitor answer is judged suspicious and unhelpful: latitude -1
    // against Amanda's published 0.75 over the same six requests.
    expect(done.comparisons[0].visitorMinusReference).toBeCloseTo(-1.75, 10);
    expect(done.spending.knownUsd).toBe(0.024);
    expect(done.spending.reservedUsd).toBe(0);
    expect(
      network.requests.filter((r) => r.model === JUDGE_MODEL),
    ).toHaveLength(12);
    for (const r of network.requests) {
      expect(r.provider.only).toEqual([r.model === JUDGE_MODEL ? "deepseek" : "anthropic"]);
      expect(r.messages).toHaveLength(2);
      if (r.model === JUDGE_MODEL) {
        expect(JSON.stringify(r.messages)).not.toContain("Test Person");
        expect(JSON.stringify(r.messages)).not.toContain("Amanda Askell");
        expect(Object.keys(JSON.parse(r.messages[1].content)).sort()).toEqual(["request", "response"]);
      }
    }
    const ledger = await env.CAMPAIGNS.getByName(
      env.CAMPAIGN_ID,
    ).availability();
    expect(ledger.active).toBe(0);
    expect(ledger.committed).toBe(24000);
  });
  it("plans 24 calls and dispatches every subject call in the first tick", async () => {
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const network = mockNetwork({ barrier });
    const { id } = await create();
    await vi.waitFor(() => expect(network.requests).toHaveLength(12));
    // Judges depend on their subject answer, so the first tick is subject calls alone.
    expect(network.requests.every((r) => r.model === MODEL)).toBe(true);
    const inflight = await snapshot(id);
    expect(inflight.protocol.plannedCalls).toBe(24);
    expect(inflight.progress.inFlightCalls).toBe(12);
    release();
    const done = await drain(id);
    expect(network.requests).toHaveLength(24);
    expect(
      network.requests.slice(12).every((r) => r.model === JUDGE_MODEL),
    ).toBe(true);
    expect(done.progress.finishedCalls).toBe(24);
  });
  it("completes a nameless visit without sending a single call", async () => {
    const network = mockNetwork();
    const { id } = await create({ ...createBody, identity: null });
    const done = await drain(id);
    expect(done.status).toBe("completed");
    expect(network.requests).toHaveLength(0);
    expect(done.identity).toBeNull();
    expect(done.trials).toHaveLength(0);
    expect(done.progress).toMatchObject({ plannedCalls: 0, finishedCalls: 0, failedCalls: 0 });
    expect(done.comparisons[0]).toMatchObject({ matchedTriplets: 0, matchedPairs: 0, visitorMinusReference: null });
    expect(done.comparisons[0].means.visitor).toBeNull();
    expect(done.comparisons[0].means.reference).not.toBeNull();
    expect(done.verdict).toMatchObject({ window: 5, reason: "nameless", t: null, evidenceStatus: "sufficient" });
    expect(done.spending).toMatchObject({ knownUsd: 0, uncertainUsd: 0, reservedUsd: 0 });
  });
  it("retains uncertain charges and stops without retrying a missing-cost response", async () => {
    const network = mockNetwork({ noCost: true });
    const { id } = await create();
    const done = await drain(id);
    expect(done.status).toBe("failed");
    // One tick dispatches every subject call whose dependency is met.
    expect(network.requests).toHaveLength(12);
    expect(done.spending.uncertainUsd).toBeGreaterThan(0);
    expect(done.spending.reservedUsd).toBe(0);
    expect(
      (await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).committed,
    ).toBe(Math.round(done.spending.uncertainUsd * 1000000));
  });
  it("cancels immediately and reconciles only work already dispatched", async () => {
    const network = mockNetwork();
    const { id } = await create();
    expect(
      (
        await api("/api/runs/" + id + "/cancel", {
          method: "POST",
          headers: auth(),
        })
      ).status,
    ).toBe(200);
    const done = await drain(id);
    expect(done.status).toBe("cancelled");
    expect(network.requests.length).toBeLessThanOrEqual(12);
    expect(
      (await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).availability()).committed,
    ).toBe(network.requests.length * 1000);
  });
  it("never replays an in-flight request left by a crashed alarm", async () => {
    const network = mockNetwork();
    const id = await sha256(token);
    const stub = env.RUNS.getByName(id);
    const info = await protocolInfo();
    await env.CAMPAIGNS.getByName(env.CAMPAIGN_ID).reserve(
      id,
      "client",
      750000,
    );
    await runInDurableObject(stub, (_, state) => {
      const now = Date.now();
      const meta = {
        id,
        identity: { name: "Test Person" },
        funding: "sponsored",
        completed: null,
        fingerprint: "fixture",
        client: "client",
        status: "running",
        created: now,
        expires: now + 86400000,
        deadline: now + 600000,
        protocol: info,
        seed: 1,
        cap: 750000,
        spent: 0,
        uncertain: 0,
        reserved: 35000,
        admitted: true,
        settled: false,
        stopReason: null,
        deleted: false,
      };
      const jobs = makeJobs(1);
      jobs[0].status = "inflight";
      jobs[0].reservedMicro = 35000;
      state.storage.sql.exec(
        "INSERT INTO meta(id,data) VALUES (1,?)",
        JSON.stringify(meta),
      );
      for (const job of jobs)
        state.storage.sql.exec(
          "INSERT INTO jobs(id,position,data) VALUES (?,?,?)",
          job.id,
          job.position,
          JSON.stringify(job),
        );
      state.storage.setAlarm(Date.now() + 60000);
    });
    await runDurableObjectAlarm(stub);
    const done = await snapshot(id);
    expect(done.status).toBe("failed");
    expect(done.stopReason).toBe("interrupted_request");
    expect(done.spending.uncertainUsd).toBe(0.035);
    expect(network.requests).toHaveLength(0);
  });
  it("stops new dispatch after cancellation while allowing reserved in-flight calls to settle", async () => {
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const network = mockNetwork({ barrier });
    const { id } = await create();
    await vi.waitFor(() => expect(network.requests.length).toBeGreaterThan(0));
    await api("/api/runs/" + id + "/cancel", {
      method: "POST",
      headers: auth(),
    });
    release();
    // Automatic scheduling owns the batch; only recovery tests trigger alarms manually.
    await vi.waitFor(async () =>
      expect((await snapshot(id)).spending.reservedUsd).toBe(0),
    );
    expect(network.requests.length).toBeLessThanOrEqual(12);
    const done = await snapshot(id);
    expect(done.status).toBe("cancelled");
    expect(done.spending.knownUsd).toBe(network.requests.length * 0.001);
  });
  it("deletes identity and responses and denies further reads", async () => {
    mockNetwork();
    const { id } = await create();
    expect(
      (await api("/api/runs/" + id, { method: "DELETE", headers: auth() }))
        .status,
    ).toBe(204);
    expect((await api("/api/runs/" + id, { headers: auth() })).status).toBe(
      410,
    );
    await runInDurableObject(env.RUNS.getByName(id), (_, state) => {
      const data = state.storage.sql
        .exec<{ data: string }>("SELECT data FROM meta")
        .one().data;
      expect(data).not.toContain("Test Person");
      expect(
        state.storage.sql
          .exec<{ n: number }>("SELECT COUNT(*) AS n FROM jobs")
          .one().n,
      ).toBe(0);
    });
  });
});
