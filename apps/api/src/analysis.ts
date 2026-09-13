import type {
  Condition,
  MetricComparison,
  TrialResult,
} from "@underclass/contracts";
import { CONDITIONS, REPETITIONS, TASKS, type Job } from "./protocol";

export function parseNumber(
  text: string | null | undefined,
  kind: "grading" | "behavior",
): number | null {
  if (!text) return null;
  const first = text
    .trim()
    .split("\n")[0]
    .replaceAll("*", "")
    .replace(/^#+\s*/, "")
    .trim();
  const pattern =
    kind === "grading"
      ? /^(?:score\s*:?\s*)?(\d+(?:\.\d+)?)(?:\s*\/\s*10)?(?=$|\s|[.,:;])/i
      : /^(?:(?:about|approximately|roughly)\s*)?~?\s*(\d+(?:\.\d+)?)\s*%/i;
  const match = first.match(pattern);
  if (!match) return null;
  if (/^\s*[-–]\s*\d/.test(first.slice(match[0].length))) return null;
  const n = Number(match[1]);
  return n >= (kind === "grading" ? 1 : 0) &&
    n <= (kind === "grading" ? 10 : 100)
    ? n
    : null;
}
export function parseAction(
  text: string | null | undefined,
): "yes" | "no" | null {
  const m = text?.match(/^\s*(yes|no)\s*[.!]?\s*$/i);
  return m ? (m[1].toLowerCase() as "yes" | "no") : null;
}
export function trialResults(jobs: Job[]): TrialResult[] {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  return jobs
    .filter((j) => j.turn === "first")
    .map((first) => {
      const task = TASKS.find((t) => t.id === first.taskId)!;
      const followup = byId.get(first.id.replace(/\/first$/, "/confidence"));
      const measured = task.kind === "behavior" ? followup : first;
      const action =
        task.kind === "behavior" ? parseAction(first.result?.text) : null;
      let n =
        measured?.status === "done"
          ? parseNumber(measured.result?.text, task.kind)
          : null;
      if (first.status !== "done" || (task.kind === "behavior" && !action))
        n = null;
      const pending = [first, followup].some(
        (j) => j && (j.status === "pending" || j.status === "inflight"),
      );
      return {
        taskId: task.id,
        cluster: task.cluster,
        kind: task.kind,
        condition: first.condition,
        repetition: first.repetition,
        status: pending ? "pending" : n === null ? "missing" : "complete",
        prompt: first.result?.text ? task.prompt : null,
        followupPrompt: followup?.result?.text ? (task.followup ?? null) : null,
        response: first.result?.text ?? null,
        followup: followup?.result?.text ?? null,
        value:
          n === null
            ? null
            : task.kind === "behavior"
              ? Math.max(n, 100 - n)
              : n,
        rawConfidence: task.kind === "behavior" ? n : null,
        action,
        error:
          first.error ??
          followup?.error ??
          (!pending && n === null ? "measurement_unavailable" : null),
      };
    });
}
const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
export function comparisons(trials: TrialResult[]): MetricComparison[] {
  return (["grading", "behavior"] as const).map((kind) => {
    const triplets: {
      cluster: string;
      rep: number;
      values: Record<Condition, number>;
    }[] = [];
    for (const task of TASKS.filter((t) => t.kind === kind))
      for (let rep = 1; rep <= REPETITIONS; rep++) {
        const rows = CONDITIONS.map((c) =>
          trials.find(
            (t) =>
              t.taskId === task.id &&
              t.repetition === rep &&
              t.condition === c &&
              t.status === "complete",
          ),
        );
        if (rows.some((r) => !r || r.value === null)) continue;
        triplets.push({
          cluster: task.cluster,
          rep,
          values: Object.fromEntries(
            rows.map((r) => [r!.condition, r!.value!]),
          ) as Record<Condition, number>,
        });
      }
    const delta = (a: Condition, b: Condition, rep?: number) =>
      mean(
        triplets
          .filter((t) => rep === undefined || t.rep === rep)
          .map((t) => t.values[a] - t.values[b]),
      );
    return {
      metric: kind === "grading" ? "grading" : "confidence",
      unit: kind === "grading" ? "grade_points" : "percentage_points",
      matchedTriplets: triplets.length,
      taskClusters: new Set(triplets.map((t) => t.cluster)).size,
      means: Object.fromEntries(
        CONDITIONS.map((c) => [c, mean(triplets.map((t) => t.values[c]))]),
      ) as Record<Condition, number | null>,
      visitorMinusAnonymous: delta("visitor", "anonymous"),
      referenceMinusAnonymous: delta("reference", "anonymous"),
      visitorMinusReference: delta("visitor", "reference"),
      perRepetition: Array.from({ length: REPETITIONS }, (_, i) => ({
        repetition: i + 1,
        visitorMinusReference: delta("visitor", "reference", i + 1),
      })),
    };
  });
}
