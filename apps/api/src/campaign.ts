import { DurableObject } from "cloudflare:workers";
import { intSetting, microdollars } from "./util";

export class Campaign extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, client TEXT NOT NULL, reserved INTEGER NOT NULL, accounted INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL, created INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY, halted INTEGER NOT NULL DEFAULT 0)",
    );
    ctx.storage.sql.exec("INSERT OR IGNORE INTO control(id) VALUES (1)");
  }
  availability() {
    const row = this.ctx.storage.sql
      .exec<{ active: number; count: number; committed: number }>(
        "SELECT COALESCE(SUM(state='active'),0) AS active,COUNT(*) AS count,COALESCE(SUM(CASE WHEN state='active' THEN reserved ELSE accounted END),0) AS committed FROM bookings",
      )
      .one();
    const halted = this.ctx.storage.sql
      .exec<{ halted: number }>("SELECT halted FROM control WHERE id=1")
      .one().halted;
    const cap = microdollars(this.env.SPONSORED_BUDGET_USD),
      runCap = microdollars(this.env.RUN_BUDGET_USD);
    return {
      ...row,
      cap,
      remaining: Math.max(0, cap - row.committed),
      reason: halted
        ? "campaign_halted"
        : row.count >= intSetting(this.env.MAX_SPONSORED_RUNS) ||
            row.committed + runCap > cap
          ? "budget_exhausted"
          : row.active >= intSetting(this.env.MAX_ACTIVE_RUNS, 20)
            ? "campaign_busy"
            : null,
    };
  }
  reserve(
    id: string,
    client: string,
    reserved: number,
  ): { ok: boolean; reason: string | null } {
    return this.ctx.storage.transactionSync(() => {
      const existing = this.ctx.storage.sql
        .exec<{ state: string }>("SELECT state FROM bookings WHERE id=?", id)
        .toArray()[0];
      if (existing)
        return {
          ok: existing.state === "active",
          reason: existing.state === "active" ? null : "run_already_settled",
        };
      if (this.env.LIVE_RUNS_ENABLED !== "true")
        return { ok: false, reason: "live_disabled" };
      if (reserved !== microdollars(this.env.RUN_BUDGET_USD) || reserved <= 0)
        return { ok: false, reason: "invalid_budget" };
      const a = this.availability();
      if (a.reason) return { ok: false, reason: a.reason };
      // client is an HMAC of the network address and UTC date, never a raw address.
      const count = this.ctx.storage.sql
        .exec<{ n: number }>(
          "SELECT COUNT(*) AS n FROM bookings WHERE client=?",
          client,
        )
        .one().n;
      if (count >= intSetting(this.env.MAX_RUNS_PER_CLIENT_DAY, 20))
        return { ok: false, reason: "daily_limit" };
      this.ctx.storage.sql.exec(
        "INSERT INTO bookings(id,client,reserved,state,created) VALUES (?,?,?,'active',?)",
        id,
        client,
        reserved,
        Date.now(),
      );
      return { ok: true, reason: null };
    });
  }
  settle(id: string, accounted: number): void {
    this.ctx.storage.transactionSync(() => {
      const row = this.ctx.storage.sql
        .exec<{ reserved: number; state: string; accounted: number }>(
          "SELECT reserved,state,accounted FROM bookings WHERE id=?",
          id,
        )
        .toArray()[0];
      if (!row) return;
      if (!Number.isSafeInteger(accounted) || accounted < 0)
        throw new Error("Invalid settlement");
      // Idempotent and monotonic: a late reconciliation may add cost, never erase it.
      const cost = Math.max(row.accounted, accounted);
      this.ctx.storage.sql.exec(
        "UPDATE bookings SET state='settled',accounted=? WHERE id=?",
        cost,
        id,
      );
      if (cost > row.reserved)
        this.ctx.storage.sql.exec("UPDATE control SET halted=1 WHERE id=1");
    });
  }
}
