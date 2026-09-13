import { env } from "cloudflare:workers";
import { reset, runInDurableObject } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Campaign } from "../src/campaign";
import { JUDGE_MAX_TOKENS, JUDGE_MODEL } from "../src/judge";
import { MAX_TOKENS, MODEL } from "../src/protocol";
import {
  callProvider,
  requestBody,
  reservationMicro,
  validateProviderKeyFormat,
  verifyProviderKey,
  type Message,
  type ProviderKind,
} from "../src/provider";

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
  await reset();
  vi.unstubAllGlobals();
});

const cap = 300_000;
const ledgerEnv = (overrides: Partial<Env> = {}): Env => ({
  ...env,
  LIVE_RUNS_ENABLED: "true",
  RUN_BUDGET_USD: "0.30",
  SPONSORED_BUDGET_USD: "1.20",
  MAX_SPONSORED_RUNS: "4",
  MAX_ACTIVE_RUNS: "4",
  MAX_RUNS_PER_CLIENT_DAY: "1",
  MAX_BYOK_RUNS_PER_CLIENT_DAY: "6",
  ...overrides,
});

describe("separate funding accounting", () => {
  it("reserves visitors with no sponsored allowance and keeps them out of sponsored totals", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("no-sponsor"),
      (_, state) => {
        const ledger = new Campaign(
          state,
          ledgerEnv({ SPONSORED_BUDGET_USD: "0" }),
        );
        expect(ledger.reserve("free", "client", cap)).toEqual({
          ok: false,
          reason: "budget_exhausted",
        });
        expect(ledger.reserve("visitor", "client", cap, "visitor")).toEqual({
          ok: true,
          reason: null,
        });
        expect(ledger.availability()).toMatchObject({
          active: 1,
          count: 0,
          committed: 0,
          remainingRuns: 0,
        });
        ledger.settle("visitor", cap + 1);
        expect(ledger.availability()).toMatchObject({
          active: 0,
          count: 0,
          committed: 0,
          reason: "budget_exhausted",
        });
        const rows = state.storage.sql.exec("SELECT * FROM bookings").toArray();
        expect(Object.keys(rows[0]).sort()).toEqual([
          "accounted",
          "client",
          "created",
          "funding",
          "id",
          "reserved",
          "state",
        ]);
      },
    );
  });

  it("uses one active-run limit across both funding types", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("shared-capacity"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv({ MAX_ACTIVE_RUNS: "2" }));
        expect(ledger.reserve("sponsor", "sponsor", cap).ok).toBe(true);
        expect(ledger.reserve("visitor", "visitor", cap, "visitor").ok).toBe(
          true,
        );
        for (const funding of ["sponsored", "visitor"] as const)
          expect(
            ledger.reserve("next-" + funding, "next", cap, funding),
          ).toEqual({ ok: false, reason: "campaign_busy" });
        expect(ledger.availability()).toMatchObject({
          active: 2,
          count: 1,
          committed: cap,
        });
        ledger.settle("visitor", 5_000);
        expect(ledger.reserve("next-visitor", "next", cap, "visitor").ok).toBe(
          true,
        );
      },
    );
  });

  it("enforces the one sponsored and six visitor daily limits separately", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("separate-daily"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv());
        expect(ledger.reserve("sponsor", "same-client", cap).ok).toBe(true);
        ledger.settle("sponsor", 1_000);
        expect(ledger.reserve("sponsor-two", "same-client", cap)).toEqual({
          ok: false,
          reason: "daily_limit",
        });
        for (let i = 0; i < 6; i++) {
          expect(
            ledger.reserve("visitor-" + i, "same-client", cap, "visitor").ok,
          ).toBe(true);
          ledger.settle("visitor-" + i, 1_000);
        }
        expect(
          ledger.reserve("visitor-seven", "same-client", cap, "visitor"),
        ).toEqual({ ok: false, reason: "daily_limit" });
        expect(
          ledger.reserve("new-day", "next-day-hmac", cap, "visitor").ok,
        ).toBe(true);
        expect(ledger.availability()).toMatchObject({
          count: 1,
          committed: 1_000,
          remainingRuns: 3,
        });
      },
    );
  });

  it("halts only sponsored admissions after a sponsored overrun", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("sponsor-overrun"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv());
        ledger.reserve("sponsor", "sponsor", cap);
        ledger.settle("sponsor", cap + 1);
        expect(ledger.availability()).toMatchObject({
          reason: "campaign_halted",
          remainingRuns: 0,
        });
        expect(ledger.reserve("sponsor-two", "another", cap)).toEqual({
          ok: false,
          reason: "campaign_halted",
        });
        expect(ledger.reserve("visitor", "another", cap, "visitor").ok).toBe(
          true,
        );
      },
    );
  });

  it("does not halt sponsored runs after a visitor overrun and never reduces settled cost", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("visitor-overrun"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv());
        ledger.reserve("visitor", "visitor", cap, "visitor");
        ledger.settle("visitor", cap + 50);
        ledger.settle("visitor", 1);
        expect(ledger.availability()).toMatchObject({
          reason: null,
          count: 0,
          committed: 0,
        });
        expect(ledger.reserve("sponsor", "sponsor", cap).ok).toBe(true);
        ledger.settle("sponsor", 10_000);
        ledger.settle("sponsor", 1_000);
        ledger.settle("sponsor", 12_000);
        expect(ledger.availability().committed).toBe(12_000);
        expect(
          state.storage.sql
            .exec<{ accounted: number }>(
              "SELECT accounted FROM bookings WHERE id='visitor'",
            )
            .one().accounted,
        ).toBe(cap + 50);
      },
    );
  });

  it("keeps sponsorship count limits independent of visitor admissions", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("sponsor-count"),
      (_, state) => {
        const ledger = new Campaign(
          state,
          ledgerEnv({ MAX_SPONSORED_RUNS: "1" }),
        );
        ledger.reserve("sponsor", "sponsor", cap);
        ledger.settle("sponsor", 0);
        expect(ledger.availability()).toMatchObject({
          count: 1,
          committed: 0,
          remainingRuns: 0,
        });
        expect(ledger.reserve("sponsor-two", "another", cap).reason).toBe(
          "budget_exhausted",
        );
        expect(ledger.reserve("visitor", "another", cap, "visitor").ok).toBe(
          true,
        );
      },
    );
  });

  it("retains the live switch and run budget for visitor funding", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("visitor-kill-switch"),
      (_, state) => {
        const disabled = new Campaign(
          state,
          ledgerEnv({ LIVE_RUNS_ENABLED: "false" }),
        );
        expect(disabled.reserve("visitor", "client", cap, "visitor")).toEqual({
          ok: false,
          reason: "live_disabled",
        });
        const enabled = new Campaign(state, ledgerEnv());
        for (const wrong of [0, cap + 1, NaN, Infinity])
          expect(
            enabled.reserve("visitor", "client", wrong, "visitor").reason,
          ).toBe("invalid_budget");
        expect(enabled.availability().active).toBe(0);
      },
    );
  });

  it("makes duplicate admission idempotent without changing its funding or client", async () => {
    await runInDurableObject(
      env.CAMPAIGNS.getByName("idempotent"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv());
        expect(ledger.reserve("visitor", "client", cap, "visitor").ok).toBe(
          true,
        );
        expect(ledger.reserve("visitor", "client", cap, "visitor").ok).toBe(
          true,
        );
        expect(ledger.availability().active).toBe(1);
        expect(
          ledger.reserve("visitor", "client", cap, "sponsored").reason,
        ).toBe("booking_conflict");
        expect(ledger.reserve("visitor", "other", cap, "visitor").reason).toBe(
          "booking_conflict",
        );
        ledger.settle("visitor", 1_000);
        expect(ledger.reserve("visitor", "client", cap, "visitor").reason).toBe(
          "run_already_settled",
        );
      },
    );
  });

  it("migrates existing bookings to sponsored without losing cost or admission state", async () => {
    await runInDurableObject(env.CAMPAIGNS.getByName("legacy"), (_, state) => {
      state.storage.sql.exec("DROP TABLE bookings");
      state.storage.sql.exec(
        "CREATE TABLE bookings(id TEXT PRIMARY KEY,client TEXT NOT NULL,reserved INTEGER NOT NULL,accounted INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL,created INTEGER NOT NULL)",
      );
      state.storage.sql.exec(
        "INSERT INTO bookings VALUES ('legacy','client',300000,0,'active',1)",
      );
      const ledger = new Campaign(state, ledgerEnv());
      expect(ledger.availability()).toMatchObject({
        active: 1,
        count: 1,
        committed: cap,
      });
      ledger.settle("legacy", 12_000);
      expect(ledger.availability()).toMatchObject({
        active: 0,
        count: 1,
        committed: 12_000,
      });
      expect(
        state.storage.sql
          .exec<{ funding: string }>("SELECT funding FROM bookings")
          .one().funding,
      ).toBe("sponsored");
    });
  });
});

const messages: Message[] = [
  { role: "user", content: "日本語 is measured in UTF-8 bytes." },
];
const fixtureKey = "sk-or-v1-" + "A".repeat(40);
const completion = (
  kind: ProviderKind,
  overrides: Record<string, unknown> = {},
) => ({
  model: kind === "judge" ? JUDGE_MODEL : MODEL,
  provider: kind === "judge" ? "DeepSeek" : "Anthropic",
  usage: { cost: 0.000_001_1, prompt_tokens: 50, completion_tokens: 10 },
  choices: [{ finish_reason: "stop", message: { content: "{}" } }],
  ...overrides,
});

describe("provider reservations and routes", () => {
  it.each(["subject", "judge"] as const)(
    "reserves %s using its exact max_price ceilings",
    (kind) => {
      const request = requestBody(messages, kind);
      const bytes = new TextEncoder().encode(JSON.stringify(messages)).length;
      const exactQuarters =
        kind === "judge"
          ? (bytes + 4096) * (0.15 * 4) + JUDGE_MAX_TOKENS * (0.6 * 4)
          : (bytes + 4096) * 8 + MAX_TOKENS * 40;
      expect(reservationMicro(messages, kind)).toBe(
        Math.ceil(exactQuarters / 4),
      );
      expect(request.provider.max_price).toEqual(
        kind === "judge"
          ? { prompt: 0.15, completion: 0.6, request: 0 }
          : { prompt: 2, completion: 10, request: 0 },
      );
    },
  );

  it("pins the judge to DeepSeek with JSON-object mode, high reasoning effort and no fallbacks", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe(JUDGE_MODEL);
        expect(body.max_tokens).toBe(JUDGE_MAX_TOKENS);
        expect(body.reasoning).toEqual({ effort: "high" });
        expect(body).not.toHaveProperty("temperature");
        expect(body.provider).toMatchObject({
          only: ["deepseek"],
          allow_fallbacks: false,
          require_parameters: true,
        });
        // DeepSeek supports JSON-object mode, not strict schemas. parseJudge enforces the shape.
        expect(body.response_format).toEqual({ type: "json_object" });
        expect(init?.redirect).toBe("manual");
        return Response.json(completion("judge"));
      },
    );
    const result = await callProvider(fixtureKey, messages, fetcher, "judge");
    expect(result).toMatchObject({
      model: JUDGE_MODEL,
      provider: "DeepSeek",
      costMicro: 2,
      error: null,
      attempts: 1,
    });
    const subject = requestBody(messages);
    expect(subject).not.toHaveProperty("response_format");
    expect(subject.reasoning).toEqual({ effort: "low" });
  });

  it("rejects a judge response from the subject route without leaking unknown metadata", async () => {
    const result = await callProvider(
      fixtureKey,
      messages,
      async () =>
        Response.json(
          completion("subject", {
            provider: fixtureKey,
            finish_reason: fixtureKey,
            id: fixtureKey,
          }),
        ),
      "judge",
    );
    expect(result).toMatchObject({
      text: null,
      provider: null,
      error: "route_mismatch",
      fatal: true,
      costMicro: 2,
    });
    expect(JSON.stringify(result)).not.toContain(fixtureKey);
  });

  it("retains bounded route evidence for mismatches and preserves nonempty response text", async () => {
    const mismatch = await callProvider(
      fixtureKey,
      messages,
      async () =>
        Response.json(
          completion("judge", {
            model: "wrong-model",
            provider: "Other\u0000" + "x".repeat(250),
          }),
        ),
      "judge",
    );
    expect(mismatch).toMatchObject({
      model: "wrong-model",
      error: "route_mismatch",
      text: null,
    });
    expect(mismatch.provider).toBe("Other" + "x".repeat(195));
    const text = "  Original reply\n";
    const result = await callProvider(fixtureKey, messages, async () =>
      Response.json(
        completion("subject", {
          choices: [{ finish_reason: "stop", message: { content: text } }],
        }),
      ),
    );
    expect(result.text).toBe(text);
  });

  it("accepts the verified canonical ID and selected metadata when top-level provider is absent", async () => {
    const model = "anthropic/claude-sonnet-5-20260630";
    const result = await callProvider(fixtureKey, messages, async () =>
      Response.json(
        completion("subject", {
          model,
          provider: undefined,
          openrouter_metadata: {
            endpoints: {
              available: [{ provider: "Anthropic", model, selected: true }],
            },
          },
        }),
      ),
    );
    expect(result).toMatchObject({ model, provider: "Anthropic", error: null });
  });

  it("rejects contradictory routing metadata even with an expected top-level provider", async () => {
    const result = await callProvider(
      fixtureKey,
      messages,
      async () =>
        Response.json(
          completion("judge", {
            openrouter_metadata: {
              endpoints: {
                available: [
                  { provider: "Other", model: JUDGE_MODEL, selected: true },
                ],
              },
            },
          }),
        ),
      "judge",
    );
    expect(result.error).toBe("route_mismatch");
  });

  it("rejects unusable costs rather than returning an unsafe settlement integer", async () => {
    const result = await callProvider(
      fixtureKey,
      messages,
      async () =>
        Response.json(
          completion("judge", {
            usage: { cost: Number.MAX_VALUE },
          }),
        ),
      "judge",
    );
    expect(result).toMatchObject({
      costMicro: null,
      error: "cost_unavailable",
      fatal: true,
    });
  });

  it("preserves the judge reservation as uncertain when its response has no cost", async () => {
    const reserved = reservationMicro(messages, "judge");
    const result = await callProvider(
      fixtureKey,
      messages,
      async () =>
        Response.json(
          completion("judge", {
            usage: { prompt_tokens: 50, completion_tokens: 10 },
          }),
        ),
      "judge",
    );
    expect(result).toMatchObject({
      text: null,
      costMicro: null,
      error: "cost_unavailable",
      fatal: true,
    });
    await runInDurableObject(
      env.CAMPAIGNS.getByName("uncertain-judge"),
      (_, state) => {
        const ledger = new Campaign(state, ledgerEnv());
        ledger.reserve("run", "client", cap);
        ledger.settle("run", result.costMicro ?? reserved);
        expect(ledger.availability()).toMatchObject({
          active: 0,
          committed: reserved,
        });
      },
    );
  });

  it.each(["", " \\n\\t "])(
    "rejects an empty provider response before it can be judged",
    async (text) => {
      const result = await callProvider(fixtureKey, messages, async () =>
        Response.json(
          completion("subject", {
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: text.replaceAll("\\n", "\n").replaceAll("\\t", "\t"),
                },
              },
            ],
          }),
        ),
      );
      expect(result).toMatchObject({
        text: null,
        error: "missing_response",
        fatal: false,
        costMicro: 2,
      });
    },
  );
});

describe("transport retries", () => {
  function recorder() {
    const sleeps: number[] = [];
    return {
      sleeps,
      sleep: async (ms: number) => {
        sleeps.push(ms);
      },
    };
  }

  it.each([408, 429, 500, 502, 503, 504])(
    "retries HTTP %s once and keeps the successful response",
    async (status) => {
      const timer = recorder();
      let calls = 0;
      const result = await callProvider(
        fixtureKey,
        messages,
        async () => {
          calls++;
          return calls === 1
            ? new Response("upstream unavailable", { status })
            : Response.json(completion("judge"));
        },
        "judge",
        timer.sleep,
      );
      expect(calls).toBe(2);
      expect(result).toMatchObject({
        error: null,
        costMicro: 2,
        attempts: 2,
        provider: "DeepSeek",
      });
      expect(timer.sleeps).toHaveLength(1);
      expect(timer.sleeps[0]).toBeGreaterThanOrEqual(500);
      expect(timer.sleeps[0]).toBeLessThanOrEqual(750);
    },
  );

  it("retries a thrown transport failure three times with growing backoff", async () => {
    const timer = recorder();
    let calls = 0;
    const result = await callProvider(
      fixtureKey,
      messages,
      async () => {
        calls++;
        throw new Error("connection reset");
      },
      "subject",
      timer.sleep,
    );
    expect(calls).toBe(3);
    expect(result).toMatchObject({
      text: null,
      error: "provider_connection_failed",
      fatal: true,
      attempts: 3,
    });
    expect(timer.sleeps).toHaveLength(2);
    expect(timer.sleeps[0]).toBeGreaterThanOrEqual(500);
    expect(timer.sleeps[0]).toBeLessThanOrEqual(750);
    expect(timer.sleeps[1]).toBeGreaterThanOrEqual(1000);
    expect(timer.sleeps[1]).toBeLessThanOrEqual(1250);
  });

  it.each([400, 401, 402, 403, 404, 422])(
    "never retries HTTP %s",
    async (status) => {
      const timer = recorder();
      let calls = 0;
      const result = await callProvider(
        fixtureKey,
        messages,
        async () => {
          calls++;
          return Response.json({ error: { message: "refused" } }, { status });
        },
        "judge",
        timer.sleep,
      );
      expect(calls).toBe(1);
      expect(result).toMatchObject({
        error: "provider_http_" + status,
        fatal: true,
        attempts: 1,
      });
      expect(timer.sleeps).toHaveLength(0);
    },
  );

  it("never repeats a request once a 2xx body has been received", async () => {
    const timer = recorder();
    let unusable = 0;
    // A priced response with no cost is already billed, so it is never sent again.
    const noCost = await callProvider(
      fixtureKey,
      messages,
      async () => {
        unusable++;
        return Response.json(completion("judge", { usage: {} }));
      },
      "judge",
      timer.sleep,
    );
    expect(unusable).toBe(1);
    expect(noCost).toMatchObject({ error: "cost_unavailable", attempts: 1 });
    let unreadable = 0;
    // Neither is a 2xx whose body cannot be parsed at all.
    const broken = await callProvider(
      fixtureKey,
      messages,
      async () => {
        unreadable++;
        return new Response("not json", { status: 200 });
      },
      "judge",
      timer.sleep,
    );
    expect(unreadable).toBe(1);
    expect(broken).toMatchObject({
      error: "provider_connection_failed",
      attempts: 1,
    });
    expect(timer.sleeps).toHaveLength(0);
  });
});

describe("read-only provider key verification", () => {
  it("validates the exact key format and length without network access for invalid keys", async () => {
    for (const invalid of [
      null,
      123,
      "",
      "sk-or-v1-" + "a".repeat(19),
      " " + fixtureKey,
      fixtureKey + "\n",
      "sk-or-v1-" + "a".repeat(248),
    ])
      expect(validateProviderKeyFormat(invalid)).toBe(false);
    expect(validateProviderKeyFormat("sk-or-v1-" + "a".repeat(247))).toBe(true);
    expect(validateProviderKeyFormat(fixtureKey)).toBe(true);
    const fetcher = vi.fn();
    expect(await verifyProviderKey("invalid", fetcher)).toEqual({
      ok: false,
      error: "provider_key_invalid",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns only a verification result and discards account data", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe("https://openrouter.ai/api/v1/key");
        expect(init?.method).toBe("GET");
        expect(init?.body).toBeUndefined();
        expect(init?.redirect).toBe("manual");
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer " + fixtureKey,
        );
        return Response.json({
          data: {
            label: fixtureKey,
            user_id: "private-account",
            limit: null,
            limit_remaining: null,
            is_free_tier: false,
          },
        });
      },
    );
    expect(await verifyProviderKey(fixtureKey, fetcher)).toEqual({
      ok: true,
      error: null,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 429, 500])(
    "sanitizes HTTP %s key-check failures",
    async (status) => {
      const result = await verifyProviderKey(fixtureKey, async () =>
        Response.json({ error: { message: fixtureKey } }, { status }),
      );
      expect(result).toEqual({
        ok: false,
        error:
          status === 401 || status === 403
            ? "provider_key_invalid"
            : "provider_key_verification_unavailable",
      });
      expect(JSON.stringify(result)).not.toContain(fixtureKey);
    },
  );

  it("bounds account responses, malformed JSON, and thrown errors without returning their contents", async () => {
    const fixtures = [
      async () => new Response("x".repeat(16_385)),
      async () => new Response(fixtureKey),
      async () => {
        throw new Error(fixtureKey);
      },
    ];
    for (const fetcher of fixtures)
      expect(await verifyProviderKey(fixtureKey, fetcher)).toEqual({
        ok: false,
        error: "provider_key_verification_unavailable",
      });
    for (const data of [
      null,
      [],
      { disabled: true },
      { is_management_key: true },
    ])
      expect(
        await verifyProviderKey(fixtureKey, async () =>
          Response.json({ data }),
        ),
      ).toEqual({ ok: false, error: "provider_key_invalid" });
  });
});
