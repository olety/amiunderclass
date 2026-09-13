import { DurableObject } from "cloudflare:workers";
import type {
  CreatedRun,
  Identity,
  ProtocolInfo,
  RunSnapshot,
  RunStatus,
} from "@underclass/contracts";
import { comparisons, parseAction, trialResults } from "./analysis";
import {
  LIMITATIONS,
  makeJobs,
  protocolInfo,
  systemPrompt,
  TASKS,
  type Job,
} from "./protocol";
import { callProvider, reservationMicro, type Message } from "./provider";
import { HttpError, usd } from "./util";

interface Meta {
  id: string;
  identity: Identity;
  fingerprint: string;
  client: string;
  status: RunStatus;
  created: number;
  expires: number;
  deadline: number;
  protocol: ProtocolInfo;
  seed: number;
  cap: number;
  spent: number;
  uncertain: number;
  reserved: number;
  admitted: boolean;
  settled: boolean;
  stopReason: string | null;
  deleted: boolean;
}
const terminal = (status: RunStatus) =>
  status !== "queued" && status !== "running";

export class ExperimentRun extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS meta (id INTEGER PRIMARY KEY, data TEXT NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, position INTEGER NOT NULL, data TEXT NOT NULL)",
    );
  }
  private meta(): Meta | null {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM meta WHERE id=1")
      .toArray()[0];
    return row ? JSON.parse(row.data) : null;
  }
  private save(meta: Meta) {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO meta(id,data) VALUES (1,?)",
      JSON.stringify(meta),
    );
  }
  private jobs(): Job[] {
    return this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM jobs ORDER BY position")
      .toArray()
      .map((x) => JSON.parse(x.data));
  }
  private saveJob(job: Job) {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO jobs(id,position,data) VALUES (?,?,?)",
      job.id,
      job.position,
      JSON.stringify(job),
    );
  }
  private ticket(meta: Meta): CreatedRun {
    return {
      id: meta.id,
      status: meta.status,
      expiresAt: new Date(meta.expires).toISOString(),
      pollAfterMs: 1500,
    };
  }
  async existing(fingerprint: string): Promise<CreatedRun | null> {
    const meta = this.meta();
    if (!meta) return null;
    if (meta.deleted || Date.now() >= meta.expires)
      throw new HttpError(
        410,
        "run_expired",
        "This run has been deleted or expired.",
      );
    if (meta.fingerprint !== fingerprint)
      throw new HttpError(
        409,
        "identity_conflict",
        "Use a new access token for a different identity.",
      );
    return this.ticket(meta);
  }
  async initialize(input: {
    id: string;
    identity: Identity;
    fingerprint: string;
    client: string;
    cap: number;
  }): Promise<CreatedRun> {
    const info = await protocolInfo();
    // Recheck after the asynchronous hash: duplicate POSTs must not replace a run.
    const old = this.meta();
    if (old) {
      if (old.deleted || Date.now() >= old.expires)
        throw new HttpError(410, "run_expired", "This run has expired.");
      if (old.fingerprint !== input.fingerprint)
        throw new HttpError(
          409,
          "identity_conflict",
          "Use a new access token for a different identity.",
        );
      return this.ticket(old);
    }
    const now = Date.now(),
      seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const meta: Meta = {
      ...input,
      status: "queued",
      created: now,
      expires: now + 86400000,
      deadline: now + 600000,
      protocol: info,
      seed,
      spent: 0,
      uncertain: 0,
      reserved: 0,
      admitted: false,
      settled: false,
      stopReason: null,
      deleted: false,
    };
    this.ctx.storage.transactionSync(() => {
      this.save(meta);
      for (const job of makeJobs(seed)) this.saveJob(job);
    });
    await this.ctx.storage.setAlarm(now + 1);
    return this.ticket(meta);
  }
  async snapshot(): Promise<RunSnapshot | null> {
    const meta = this.meta();
    if (!meta) return null;
    if (meta.deleted || Date.now() >= meta.expires)
      throw new HttpError(
        410,
        "run_expired",
        "This run has been deleted or expired.",
      );
    const jobs = this.jobs(),
      trials = trialResults(jobs);
    return {
      kind: "live",
      id: meta.id,
      status: meta.status,
      identity: meta.identity,
      protocol: meta.protocol,
      createdAt: new Date(meta.created).toISOString(),
      expiresAt: new Date(meta.expires).toISOString(),
      progress: {
        plannedCalls: meta.protocol.plannedCalls,
        finishedCalls: jobs.filter(
          (j) => j.status === "done" || j.status === "failed",
        ).length,
        failedCalls: jobs.filter((j) => j.status === "failed").length,
        skippedCalls: jobs.filter((j) => j.status === "skipped").length,
        inFlightCalls: jobs.filter((j) => j.status === "inflight").length,
      },
      spending: {
        knownUsd: usd(meta.spent),
        uncertainUsd: usd(meta.uncertain),
        reservedUsd: usd(meta.reserved),
        capUsd: usd(meta.cap),
      },
      stopReason: meta.stopReason,
      comparisons: comparisons(trials),
      trials,
      limitations: LIMITATIONS,
    };
  }
  async cancel(): Promise<CreatedRun | null> {
    const meta = this.meta();
    if (!meta) return null;
    if (meta.deleted)
      throw new HttpError(410, "run_expired", "This run has been deleted.");
    if (!terminal(meta.status)) {
      meta.status = "cancelled";
      meta.stopReason = "cancelled";
      this.save(meta);
      await this.ctx.storage.setAlarm(Date.now() + 1);
    }
    return this.ticket(meta);
  }
  async remove(): Promise<void> {
    const meta = this.meta();
    if (!meta) return;
    meta.deleted = true;
    meta.identity = { name: "" };
    meta.fingerprint = "";
    meta.client = "";
    meta.status = "cancelled";
    meta.stopReason = "deleted";
    // In-flight work cannot reliably be cancelled at the provider. Keep its entire
    // reservation accounted, and never let a late response recreate deleted text.
    meta.uncertain += meta.reserved;
    meta.reserved = 0;
    this.ctx.storage.transactionSync(() => {
      this.save(meta);
      this.ctx.storage.sql.exec("DELETE FROM jobs");
    });
    await this.ctx.storage.setAlarm(Date.now() + 1);
  }
  async alarm(): Promise<void> {
    try {
      // Drain bounded batches in one alarm. Each chargeable call is checkpointed
      // separately, and the ten-minute deadline bounds this invocation.
      while (await this.tick()) {}
    } catch {
      await this.ctx.storage.setAlarm(Date.now() + 5000);
    }
  }
  private async tick(): Promise<boolean> {
    let meta = this.meta();
    if (!meta) return false;
    if (terminal(meta.status) || meta.deleted) {
      await this.finish();
      return false;
    }
    const currentProtocol = await protocolInfo();
    meta = this.meta();
    if (!meta) return false;
    if (terminal(meta.status) || meta.deleted) {
      await this.finish();
      return false;
    }
    if (currentProtocol.hash !== meta.protocol.hash) {
      meta.stopReason = "protocol_changed";
      this.save(meta);
      await this.finish();
      return false;
    }
    if (this.env.LIVE_RUNS_ENABLED !== "true") {
      meta.stopReason = "live_disabled";
      this.save(meta);
      await this.finish();
      return false;
    }
    if (Date.now() > meta.deadline) {
      meta.stopReason = "run_deadline";
      this.save(meta);
      await this.finish();
      return false;
    }
    if (!meta.admitted) {
      const booking = await this.env.CAMPAIGNS.getByName(
        this.env.CAMPAIGN_ID,
      ).reserve(meta.id, meta.client, meta.cap);
      meta = this.meta()!;
      if (!booking.ok) {
        meta.status = meta.status === "cancelled" ? "cancelled" : "failed";
        meta.stopReason = booking.reason;
        this.save(meta);
        await this.finish();
        return false;
      }
      meta.admitted = true;
      this.save(meta);
      if (terminal(meta.status) || meta.deleted) {
        await this.finish();
        return false;
      }
    }
    const campaign = await this.env.CAMPAIGNS.getByName(
      this.env.CAMPAIGN_ID,
    ).availability();
    meta = this.meta()!;
    if (terminal(meta.status) || meta.deleted) {
      await this.finish();
      return false;
    }
    if (
      campaign.reason === "campaign_halted" ||
      campaign.committed > campaign.cap
    ) {
      meta.stopReason = "campaign_halted";
      this.save(meta);
      await this.finish();
      return false;
    }
    // Alarm execution is at least once. A surviving in-flight row means its result
    // was not durably recorded. Never replay that chargeable request.
    const abandoned = this.jobs().filter((j) => j.status === "inflight");
    if (abandoned.length) {
      this.ctx.storage.transactionSync(() => {
        meta = this.meta()!;
        for (const job of abandoned) {
          meta.uncertain += job.reservedMicro;
          meta.reserved -= job.reservedMicro;
          job.status = "failed";
          job.error = "interrupted_request";
          this.saveJob(job);
        }
        meta.stopReason = "interrupted_request";
        this.save(meta);
      });
      await this.finish();
      return false;
    }
    if (!this.env.OPENROUTER_API_KEY) {
      meta.stopReason = "provider_not_configured";
      this.save(meta);
      await this.finish();
      return false;
    }
    meta.status = "running";
    this.save(meta);
    const jobs = this.jobs(),
      byId = new Map(jobs.map((j) => [j.id, j]));
    const batch: { job: Job; messages: Message[] }[] = [];
    this.ctx.storage.transactionSync(() => {
      meta = this.meta()!;
      for (const job of jobs) {
        if (job.status !== "pending") continue;
        const first = job.dependency ? byId.get(job.dependency) : undefined;
        if (first && first.status !== "done") {
          if (first.status === "failed" || first.status === "skipped") {
            job.status = "skipped";
            job.error = "first_turn_missing";
            this.saveJob(job);
          }
          continue;
        }
        if (first && !parseAction(first.result?.text)) {
          job.status = "skipped";
          job.error = "invalid_action";
          this.saveJob(job);
          continue;
        }
        const task = TASKS.find((t) => t.id === job.taskId)!;
        const messages: Message[] = [
          {
            role: "system",
            content: systemPrompt(job.condition, meta.identity),
          },
          { role: "user", content: task.prompt },
        ];
        if (first)
          messages.push(
            {
              role: "assistant",
              content: first.result!.text!,
              ...(first.result!.reasoningDetails
                ? { reasoning_details: first.result!.reasoningDetails }
                : {}),
            },
            { role: "user", content: task.followup! },
          );
        const ceiling = reservationMicro(messages);
        if (meta.spent + meta.uncertain + meta.reserved + ceiling > meta.cap) {
          // Complete the selected batch before deciding there is no budget left.
          if (!batch.length) meta.stopReason = "run_budget_exhausted";
          break;
        }
        job.reservedMicro = ceiling;
        job.status = "inflight";
        meta.reserved += ceiling;
        this.saveJob(job);
        batch.push({ job, messages });
        if (batch.length === 4) break;
      }
      this.save(meta);
    });
    if (!batch.length) {
      await this.finish();
      return false;
    }
    await Promise.all(
      batch.map(async ({ job, messages }) => {
        const result = await callProvider(
          this.env.OPENROUTER_API_KEY!,
          messages,
        );
        this.ctx.storage.transactionSync(() => {
          const current = this.meta();
          if (!current || current.deleted) return;
          current.reserved -= job.reservedMicro;
          if (result.costMicro === null) current.uncertain += job.reservedMicro;
          else current.spent += result.costMicro;
          job.result = result;
          job.status = result.error ? "failed" : "done";
          job.error = result.error ?? undefined;
          if (result.fatal) current.stopReason = result.error;
          if (result.costMicro !== null && result.costMicro > job.reservedMicro)
            current.stopReason = "reservation_exceeded";
          this.saveJob(job);
          this.save(current);
        });
      }),
    );
    meta = this.meta()!;
    if (
      meta.deleted ||
      terminal(meta.status) ||
      meta.stopReason ||
      !this.jobs().some((j) => j.status === "pending")
    ) {
      await this.finish();
      return false;
    }
    return true;
  }
  private async finish(): Promise<void> {
    let meta = this.meta();
    if (!meta) return;
    const jobs = this.jobs();
    this.ctx.storage.transactionSync(() => {
      // Also handles deadline/cancel recovery if a previous alarm died in flight.
      for (const job of jobs) {
        if (job.status === "inflight") {
          meta!.uncertain += job.reservedMicro;
          meta!.reserved -= job.reservedMicro;
          job.status = "failed";
          job.error = "interrupted_request";
          this.saveJob(job);
        } else if (job.status === "pending") {
          job.status = "skipped";
          job.error = meta!.stopReason ?? "not_dispatched";
          this.saveJob(job);
        }
      }
      if (!terminal(meta!.status)) {
        const results = trialResults(jobs),
          valid = results.filter((t) => t.status === "complete").length;
        meta!.status =
          valid === results.length && valid > 0
            ? "completed"
            : valid > 0
              ? "partial"
              : "failed";
      }
      this.save(meta!);
    });
    if (meta.admitted && !meta.settled) {
      await this.env.CAMPAIGNS.getByName(this.env.CAMPAIGN_ID).settle(
        meta.id,
        meta.spent + meta.uncertain,
      );
      meta = this.meta()!;
      meta.settled = true;
      // Reasoning details are only needed within a two-turn trial.
      for (const job of this.jobs())
        if (job.result?.reasoningDetails) {
          delete job.result.reasoningDetails;
          this.saveJob(job);
        }
      this.save(meta);
    }
    if (Date.now() >= meta.expires) {
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.ctx.storage.setAlarm(meta.expires);
  }
}
