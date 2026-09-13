import { DurableObject } from "cloudflare:workers";
import { intSetting, microdollars } from "./util";

export type Funding = "sponsored" | "visitor";

export class Campaign extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, client TEXT NOT NULL, reserved INTEGER NOT NULL, accounted INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL, created INTEGER NOT NULL, funding TEXT NOT NULL DEFAULT 'sponsored')",
    );
    // Existing v1 bookings were all sponsored. Preserve their accounting on upgrade.
    if (
      !ctx.storage.sql
        .exec<{ name: string }>("PRAGMA table_info(bookings)")
        .toArray()
        .some((column) => column.name === "funding")
    )
      ctx.storage.sql.exec(
        "ALTER TABLE bookings ADD COLUMN funding TEXT NOT NULL DEFAULT 'sponsored'",
      );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY, halted INTEGER NOT NULL DEFAULT 0)",
    );
    ctx.storage.sql.exec("INSERT OR IGNORE INTO control(id) VALUES (1)");
  }
  availability() {
    const row = this.ctx.storage.sql
      .exec<{ active: number; count: number; committed: number }>(
        "SELECT COALESCE(SUM(state='active'),0) AS active,COALESCE(SUM(funding='sponsored'),0) AS count,COALESCE(SUM(CASE WHEN funding='sponsored' THEN CASE WHEN state='active' THEN reserved ELSE accounted END ELSE 0 END),0) AS committed FROM bookings",
      )
      .one();
    const halted = this.ctx.storage.sql
      .exec<{ halted: number }>("SELECT halted FROM control WHERE id=1")
      .one().halted;
    const cap = microdollars(this.env.SPONSORED_BUDGET_USD),
      runCap = microdollars(this.env.RUN_BUDGET_USD);
    const remaining = Math.max(0, cap - row.committed);
    const remainingRuns =
      halted || runCap <= 0
        ? 0
        : Math.max(
            0,
            Math.min(
              intSetting(this.env.MAX_SPONSORED_RUNS) - row.count,
              Math.floor(remaining / runCap),
            ),
          );
    return {
      ...row,
      cap,
      remaining,
      remainingRuns,
      reason: halted
        ? "campaign_halted"
        : remainingRuns === 0
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
    funding: Funding = "sponsored",
  ): { ok: boolean; reason: string | null } {
    return this.ctx.storage.transactionSync(() => {
      if (funding !== "sponsored" && funding !== "visitor")
        return { ok: false, reason: "invalid_funding" };
      const existing = this.ctx.storage.sql
        .exec<{
          state: string;
          client: string;
          reserved: number;
          funding: Funding;
        }>("SELECT state,client,reserved,funding FROM bookings WHERE id=?", id)
        .toArray()[0];
      if (existing) {
        if (
          existing.client !== client ||
          existing.reserved !== reserved ||
          existing.funding !== funding
        )
          return { ok: false, reason: "booking_conflict" };
        return {
          ok: existing.state === "active",
          reason: existing.state === "active" ? null : "run_already_settled",
        };
      }
      if (this.env.LIVE_RUNS_ENABLED !== "true")
        return { ok: false, reason: "live_disabled" };
      if (reserved !== microdollars(this.env.RUN_BUDGET_USD) || reserved <= 0)
        return { ok: false, reason: "invalid_budget" };
      const a = this.availability();
      if (funding === "sponsored" && a.reason)
        return { ok: false, reason: a.reason };
      if (a.active >= intSetting(this.env.MAX_ACTIVE_RUNS, 20))
        return { ok: false, reason: "campaign_busy" };
      // client is an HMAC of the network address and UTC date, never a raw address.
      const count = this.ctx.storage.sql
        .exec<{ n: number }>(
          "SELECT COUNT(*) AS n FROM bookings WHERE client=? AND funding=?",
          client,
          funding,
        )
        .one().n;
      const dailyLimit =
        funding === "visitor"
          ? (this.env.MAX_BYOK_RUNS_PER_CLIENT_DAY ?? "6")
          : (this.env.MAX_RUNS_PER_CLIENT_DAY ?? "1");
      if (count >= intSetting(dailyLimit, 20))
        return { ok: false, reason: "daily_limit" };
      this.ctx.storage.sql.exec(
        "INSERT INTO bookings(id,client,reserved,state,created,funding) VALUES (?,?,?,'active',?,?)",
        id,
        client,
        reserved,
        Date.now(),
        funding,
      );
      return { ok: true, reason: null };
    });
  }
  settle(id: string, accounted: number): void {
    this.ctx.storage.transactionSync(() => {
      const row = this.ctx.storage.sql
        .exec<{ reserved: number; accounted: number; funding: Funding }>(
          "SELECT reserved,accounted,funding FROM bookings WHERE id=?",
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
      if (row.funding === "sponsored" && cost > row.reserved)
        this.ctx.storage.sql.exec("UPDATE control SET halted=1 WHERE id=1");
    });
  }
}
