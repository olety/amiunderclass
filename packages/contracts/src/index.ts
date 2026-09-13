export type Condition = "visitor" | "anonymous" | "reference";
export type Metric = "grading" | "confidence" | "latitude" | "suspicion" | "substantive" | "refusal";
export type Funding = "sponsored" | "visitor" | "rehearsal";
export type YesNo = "yes" | "no";
export type RunStatus =
  "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
export interface Identity {
  name: string;
  pronouns?: string;
  affiliation?: string;
  email?: string;
}
export interface CreateRunRequest {
  identity: Identity | null;
  providerKey?: string;
  rehearsal?: boolean;
  consent: true;
  turnstileToken: string;
}
export interface ApiError {
  error: { code: string; message: string };
}
export interface ProtocolInfo {
  version: string;
  hash: string;
  model: string;
  provider: string;
  taskCount: number;
  repetitions: number;
  plannedTrials: number;
  plannedCalls: number;
  conditions: Condition[];
  sourceUrl: string;
  reference: Identity;
  blocks: { kind: "grading" | "behavior" | "borderline"; items: number; calls: number }[];
}
export interface AppConfig {
  protocol: ProtocolInfo;
  liveEnabled: boolean;
  availability: "available" | "disabled" | "exhausted" | "busy";
  runBudgetUsd: number;
  estimatedCostUsd: number;
  estimatedSeconds: number;
  turnstileSiteKey: string;
  retentionHours: number;
  byokEnabled: boolean;
  rehearsalEnabled: boolean;
  freeRunsPerClientDay: number;
  byokRunsPerClientDay: number;
  sponsoredRunsRemaining: number | null;
  judgeModel: string;
  pilot: { status: "pending_key" | "measured"; costUsd: number | null; wallSeconds: number | null };
}
export interface MetricComparison {
  metric: Metric;
  unit: "grade_points" | "percentage_points" | "latitude_points";
  matchedTriplets: number;
  /** Nameless runs use matched anonymous/reference pairs; visitor means stay null. */
  matchedPairs: number;
  taskClusters: number;
  means: Record<Condition, number | null>;
  visitorMinusAnonymous: number | null;
  referenceMinusAnonymous: number | null;
  visitorMinusReference: number | null;
  perRepetition: { repetition: number; visitorMinusReference: number | null }[];
}
export interface JudgeVerdict {
  refusal: YesNo | null;
  substantive: YesNo | null;
  suspicious: YesNo | null;
  summary: string | null;
  evidence: { substantive: string; suspicious: string } | null;
  model: string;
  error: string | null;
}
export interface WindowVerdict {
  window: 1 | 2 | 3 | 4 | 5 | null;
  label: "OVERLORD" | "COMRADE" | "UNDERCLASS" | null;
  t: number | null;
  tRaw: number | null;
  referenceGap: number | null;
  anonymousNoise: number | null;
  matchedTriplets: number;
  matchedPairs: number;
  reason: "measured" | "nameless" | "insufficient_matches" | "gap_unresolved" | "repeats_disagree" | "pending";
  /** A nameless window is a convention. Only sufficient evidence supports today's measured gap. */
  evidenceStatus: "pending" | "sufficient" | "insufficient";
  perRepetition: { repetition: number; window: number | null }[];
}
export interface TrialCall {
  turn: "first" | "confidence" | "judge";
  status: "pending" | "inflight" | "done" | "failed" | "skipped";
  requestedModel: string;
  reportedModel: string | null;
  reportedProvider: string | null;
  costUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  error: string | null;
}
export interface TrialResult {
  taskId: string;
  cluster: string;
  kind: "grading" | "behavior" | "borderline";
  condition: Condition;
  repetition: number;
  status: "pending" | "complete" | "missing";
  prompt: string | null;
  followupPrompt: string | null;
  response: string | null;
  followup: string | null;
  value: number | null;
  rawConfidence: number | null;
  action: "yes" | "no" | null;
  error: string | null;
  judge: JudgeVerdict | null;
  latitude: -1 | 0 | 1 | null;
  calls: TrialCall[];
}
export interface RunSnapshot {
  kind: "live";
  id: string;
  status: RunStatus;
  identity: Identity | null;
  funding: Funding;
  told: Record<Condition, string>;
  verdict: WindowVerdict;
  seed: number;
  completedAt: string | null;
  protocol: ProtocolInfo;
  createdAt: string;
  expiresAt: string;
  progress: {
    plannedCalls: number;
    finishedCalls: number;
    failedCalls: number;
    skippedCalls: number;
    inFlightCalls: number;
  };
  spending: {
    knownUsd: number;
    uncertainUsd: number;
    reservedUsd: number;
    capUsd: number;
  };
  stopReason: string | null;
  comparisons: MetricComparison[];
  trials: TrialResult[];
  limitations: string[];
}
export interface CreatedRun {
  id: string;
  status: RunStatus;
  expiresAt: string;
  pollAfterMs: number;
}
export interface RecordedExample {
  kind: "recorded-pilot";
  recordedAt: string;
  model: string;
  provider: string;
  conditions: ["anonymous_a", "anonymous_b", "reference"];
  calls: number;
  trials: number;
  wallSeconds: number;
  costUsd: number;
  grading: {
    anonymousA: number;
    anonymousB: number;
    anonymousMean: number;
    reference: number;
    referenceDelta: number;
  };
  confidence: {
    anonymousMean: number;
    reference: number;
    referenceDelta: number;
  };
  examples: {
    taskId: string;
    repetition: number;
    prompt: string;
    source: string;
    sourceUrl: string;
    responses: {
      condition: "anonymous_a" | "anonymous_b" | "reference";
      text: string;
      value: number;
    }[];
  }[];
  limitations: string[];
  sourceUrl: string;
}
