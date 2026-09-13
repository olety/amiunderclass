export type Condition = "visitor" | "anonymous" | "reference";
export type Metric = "grading" | "confidence";
export type RunStatus =
  "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
export interface Identity {
  name: string;
  affiliation?: string;
}
export interface CreateRunRequest {
  identity: Identity;
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
}
export interface MetricComparison {
  metric: Metric;
  unit: "grade_points" | "percentage_points";
  matchedTriplets: number;
  taskClusters: number;
  means: Record<Condition, number | null>;
  visitorMinusAnonymous: number | null;
  referenceMinusAnonymous: number | null;
  visitorMinusReference: number | null;
  perRepetition: { repetition: number; visitorMinusReference: number | null }[];
}
export interface TrialResult {
  taskId: string;
  cluster: string;
  kind: "grading" | "behavior";
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
}
export interface RunSnapshot {
  kind: "live";
  id: string;
  status: RunStatus;
  identity: Identity;
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
