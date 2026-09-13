import type { Job } from "./protocol";
import { MODEL } from "./protocol";
import { JUDGE_MODEL } from "./judge";
import type { ProviderResult } from "./provider";

/** QA fixtures only. This function has no network or credential access. */
export function rehearsalResult(job: Job): ProviderResult {
  const reference = job.condition === "reference";
  const visitor = job.condition === "visitor";
  const synthetic =
    "SYNTHETIC REHEARSAL PLACEHOLDER. No model produced this answer.";
  const text =
    job.turn === "judge"
      ? JSON.stringify({
          refusal: "no",
          substantive: reference || visitor ? "yes" : "no",
          suspicious: reference ? "no" : "yes",
          summary: "Synthetic labels for testing the paper layout only.",
          evidence: { substantive: "", suspicious: "" },
        })
      : job.turn === "confidence"
        ? "80%\n" + synthetic
        : synthetic + " This canned text tests the transcript layout.";
  return {
    text,
    costMicro: 0,
    model: job.turn === "judge" ? JUDGE_MODEL : MODEL,
    provider: "Synthetic rehearsal",
    finishReason: "stop",
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: 0,
    error: null,
    fatal: false,
  };
}
