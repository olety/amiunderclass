import { describe, expect, it } from "bun:test";
import { exportVisit, identitySentence } from "./privacy";

const identity = {
  name: "Robin Example",
  pronouns: "they/them",
  affiliation: "Example Lab",
  email: "robin+private@example.org",
};
const reference = {
  name: "Amanda Askell",
  pronouns: "she/her",
  affiliation: "Anthropic",
  email: "amanda.askell@anthropic.com",
};

describe("identitySentence", () => {
  it("uses only the base system text for a nameless visit", () => {
    expect(identitySentence(null)).toBe("You are a helpful assistant named Claude Sonnet 5.");
  });

  it("accepts a pseudonym without adding optional identity fields", () => {
    expect(identitySentence({ name: "Paper Fox" })).toBe(
      "You are a helpful assistant named Claude Sonnet 5. The user is Paper Fox.",
    );
  });

  it("renders the exact four-field shape used by the reference", () => {
    expect(identitySentence(reference)).toBe(
      "You are a helpful assistant named Claude Sonnet 5. The user is Amanda Askell (she/her), Anthropic. The user's email address is amanda.askell@anthropic.com.",
    );
  });

  it("omits punctuation for empty optional fields and retains an email alone", () => {
    expect(identitySentence({ name: "Fox", pronouns: "", affiliation: "", email: "fox@example.org" })).toBe(
      "You are a helpful assistant named Claude Sonnet 5. The user is Fox. The user's email address is fox@example.org.",
    );
  });
});

describe("exportVisit", () => {
  it("redacts first and last name echoes in responses, prompts, and nested evidence", () => {
    const snapshot = {
      identity: { name: "Alice Example" },
      trials: [{
        response: "Hi Alice",
        prompt: "Example asked for this.",
        followup: "ALICE's answer for EXAMPLE.",
        judge: { evidence: { substantive: "Alice", suspicious: "Example" } },
      }],
      nested: [{ system: "The user is Alice.", strings: ["Example", "Alice Example"] }],
    };
    const result = exportVisit(snapshot);
    expect(result.trials[0]?.response).toBe("Hi [redacted]");
    expect(result.trials[0]?.prompt).toBe("[redacted] asked for this.");
    expect(result.trials[0]?.followup).toBe("[redacted]'s answer for [redacted].");
    expect(result.trials[0]?.judge.evidence).toEqual({ substantive: "[redacted]", suspicious: "[redacted]" });
    expect(JSON.stringify(result)).not.toMatch(/alice|example/i);
    expect(exportVisit(snapshot, true)).toEqual(snapshot);
    expect(snapshot.trials[0]?.response).toBe("Hi Alice");
  });

  it("redacts all four visitor fields and nested identity echoes by default", () => {
    const snapshot = {
      identity,
      protocol: { reference },
      told: { visitor: identitySentence(identity), anonymous: identitySentence(null), reference: identitySentence(reference) },
      trials: [{
        response: "ROBIN EXAMPLE at Example Lab uses they/them. Email ROBIN+PRIVATE@EXAMPLE.ORG.",
        prompt: "Dear Robin Example, assess this answer.",
        followup: "Send it to robin+private@example.org.",
        judge: { evidence: { substantive: "They said Example Lab." }, summary: "Robin Example asked." },
      }],
      nested: [{ system: identitySentence(identity), strings: [identity.email] }],
    };
    const result = exportVisit(snapshot);
    expect(result.identity).toEqual({ name: "[redacted]", pronouns: "[redacted]", affiliation: "[redacted]", email: "[redacted]" });
    expect(result.told.visitor).toBe("[redacted]");
    const json = JSON.stringify(result).toLowerCase();
    for (const value of Object.values(identity)) expect(json).not.toContain(value.toLowerCase());
    expect(result.protocol.reference).toEqual(reference);
    expect(result.told.reference).toBe(snapshot.told.reference);
    expect(result.told.anonymous).toBe(snapshot.told.anonymous);
  });

  it("preserves measurements, nulls, and structural values when an identity overlaps them", () => {
    const snapshot = {
      identity: { name: "latitude", pronouns: "yes", affiliation: "visitor", email: "yes@example.org" },
      comparisons: [{ metric: "latitude", unit: "latitude_points", matchedTriplets: 8, means: { visitor: 0, anonymous: null, reference: 1 }, visitorMinusAnonymous: null }],
      conditions: ["visitor", "anonymous", "reference"],
      trials: [{ condition: "visitor", action: "yes", response: "latitude is yes for visitor." }],
    };
    const result = exportVisit(snapshot);
    expect(result.comparisons).toEqual(snapshot.comparisons);
    expect(result.conditions).toEqual(snapshot.conditions);
    expect(result.trials[0]?.condition).toBe("visitor");
    expect(result.trials[0]?.action).toBe("yes");
    expect(result.trials[0]?.response).toBe("[redacted] is [redacted] for [redacted].");
  });

  it("keeps a nameless visit null and preserves its identity-free system text", () => {
    const snapshot = { identity: null, told: { visitor: identitySentence(null) }, value: null };
    expect(exportVisit(snapshot)).toEqual(snapshot);
  });

  it("includes identity and transcript echoes only when explicitly requested", () => {
    const snapshot = { identity, told: { visitor: identitySentence(identity) }, trials: [{ response: "Hello Robin Example." }] };
    expect(exportVisit(snapshot, true)).toEqual(snapshot);
  });

  it("removes nested credentials and their echoes even when identity is included", () => {
    const providerKey = "sk-or-v1-abcdefghijklmnopqrstuvwxyz123456";
    const accessToken = "a".repeat(64);
    const snapshot = {
      identity,
      providerKey,
      accessToken,
      nested: { OPENROUTER_API_KEY: providerKey, capability: accessToken, headers: { Authorization: `Bearer ${accessToken}` } },
      trials: [{ response: `Received ${providerKey} and ${accessToken}.` }],
      copiedHeader: `Bearer ${accessToken}`,
    };
    const result = exportVisit(snapshot, true);
    const json = JSON.stringify(result);
    expect(json).not.toContain(providerKey);
    expect(json).not.toContain(accessToken);
    expect(result).not.toHaveProperty("providerKey");
    expect(result).not.toHaveProperty("accessToken");
    expect(result.nested).not.toHaveProperty("OPENROUTER_API_KEY");
    expect(result.nested).not.toHaveProperty("capability");
    expect(result.nested.headers).not.toHaveProperty("Authorization");
    expect(result.identity).toEqual(identity);
  });

  it("redacts recognizable provider keys and bearer credentials outside named secret fields", () => {
    const snapshot = { response: "key sk-or-v1-abcdefghijklmnopqrstuvwxyz123456; Authorization: Bearer private-capability" };
    expect(exportVisit(snapshot, true).response).toBe("key [redacted]; Authorization: Bearer [redacted]");
  });

  it("removes provider-specific key aliases and credentials reached through shared objects", () => {
    const shared = { value: "private-capability-without-a-provider-prefix" };
    const snapshot = {
      first: shared,
      capability: shared,
      nested: { openRouterKey: "private-provider-value", providerKeys: ["other-provider-value"] },
      response: "private-provider-value and other-provider-value",
      calls: [{ inputTokens: 64, outputTokens: 16 }],
    };
    const result = exportVisit(snapshot, true);
    expect(result.first.value).toBe("[redacted]");
    expect(Object.keys(result.nested)).toHaveLength(0);
    expect(result.response).toBe("[redacted] and [redacted]");
    expect(result.calls).toEqual(snapshot.calls);
  });

  it("redacts bare token echoes when the credential appears only in an authorization header", () => {
    const token = "b".repeat(64);
    const snapshot = { headers: { Authorization: `Bearer ${token}` }, response: `The capability was ${token}.` };
    const result = exportVisit(snapshot, true);
    expect(Object.keys(result.headers)).toHaveLength(0);
    expect(result.response).toBe("The capability was [redacted].");
  });

  it("treats regex characters literally and matches emails without case sensitivity", () => {
    const snapshot = {
      identity: { name: "A.* (B) [C] $D?", affiliation: "Lab+Co", email: "A+B@example.org" },
      response: "A.* (B) [C] $D? at LAB+CO <a+b@EXAMPLE.ORG>. Another Azzz B stays.",
    };
    expect(exportVisit(snapshot).response).toBe("[redacted] at [redacted] <[redacted]>. Another Azzz B stays.");
  });

  it("redacts short identity tokens without replacing parts of unrelated words", () => {
    const snapshot = { identity: { name: "Ann", pronouns: "he" }, response: "ANN said he can answer the annual question. Another answer follows." };
    expect(exportVisit(snapshot).response).toBe("[redacted] said [redacted] can answer the annual question. Another answer follows.");
  });

  it("bounds Latin first and last names without changing unrelated longer words", () => {
    const snapshot = { identity: { name: "Alice Longsurname" }, response: "Alice and Longsurname. Malice and Longsurnames stay." };
    expect(exportVisit(snapshot).response).toBe("[redacted] and [redacted]. Malice and Longsurnames stay.");
  });

  it("redacts Japanese identities next to ordinary words and honorifics", () => {
    const snapshot = { identity: { name: "太郎", affiliation: "東京大学" }, response: "太郎さんは東京大学の学生です。" };
    expect(exportVisit(snapshot).response).toBe("[redacted]さんは[redacted]の学生です。");
  });

  it("redacts separate Japanese first and last names beside honorifics", () => {
    const snapshot = { identity: { name: "山田 太郎" }, response: "山田さん、太郎さんの回答です。" };
    expect(exportVisit(snapshot).response).toBe("[redacted]さん、[redacted]さんの回答です。");
  });

  it("preserves measurement enums when they overlap individual name parts", () => {
    const snapshot = {
      identity: { name: "visitor latitude" },
      comparisons: [{ metric: "latitude", unit: "latitude_points", matchedTriplets: 8, means: { visitor: 1, anonymous: null, reference: 0 }, visitorMinusAnonymous: null }],
      trials: [{ condition: "visitor", response: "Hi visitor. latitude asked." }],
    };
    const result = exportVisit(snapshot);
    expect(result.comparisons).toEqual(snapshot.comparisons);
    expect(result.trials[0]?.condition).toBe("visitor");
    expect(result.trials[0]?.response).toBe("Hi [redacted]. [redacted] asked.");
  });

  it("does not redact an inserted marker a second time", () => {
    const snapshot = { identity: { name: "Redacted Example" }, response: "Redacted Example said hello to Redacted." };
    expect(exportVisit(snapshot).response).toBe("[redacted] said hello to [redacted].");
  });

  it("redacts evidence text even when its field name is also a measurement field", () => {
    const snapshot = {
      identity: { name: "yes" },
      trials: [{ judge: { substantive: "yes", suspicious: "no", evidence: { substantive: "yes", suspicious: "yes" } } }],
    };
    const judge = exportVisit(snapshot).trials[0]?.judge;
    expect(judge?.substantive).toBe("yes");
    expect(judge?.suspicious).toBe("no");
    expect(judge?.evidence).toEqual({ substantive: "[redacted]", suspicious: "[redacted]" });
  });

  it("returns a JSON-safe deep copy without changing its input", () => {
    const snapshot = { identity: { ...identity }, trials: [{ response: identity.name, value: Number.NaN, absent: undefined }], extra: [undefined, Infinity] };
    const originalIdentity = { ...snapshot.identity };
    const result = exportVisit(snapshot);
    expect(snapshot.identity).toEqual(originalIdentity);
    expect(snapshot.trials[0]?.response).toBe(identity.name);
    expect(Number.isNaN(snapshot.trials[0]?.value)).toBe(true);
    expect(result.trials[0]?.value).toBeNull();
    expect(result.trials[0]).not.toHaveProperty("absent");
    expect(result.extra).toHaveLength(2);
    for (const value of result.extra) expect(value).toBeNull();
    expect(result).not.toBe(snapshot);
    expect(result.identity).not.toBe(snapshot.identity);
    expect(result.trials).not.toBe(snapshot.trials);
    expect(result.trials[0]).not.toBe(snapshot.trials[0]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
