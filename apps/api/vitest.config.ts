import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          LIVE_RUNS_ENABLED: "true",
          // The deployed run budget, so a batch behaves in tests as it does live.
          SPONSORED_BUDGET_USD: "1.50",
          RUN_BUDGET_USD: "0.75",
          MAX_ACTIVE_RUNS: "4",
          OPENROUTER_API_KEY: "test-key-never-live",
          TURNSTILE_SECRET_KEY: "test-secret",
          ABUSE_HASH_SECRET: "test-hmac-secret",
          TURNSTILE_SITE_KEY: "test-site",
          TURNSTILE_HOSTNAME: "underclass.test",
          ALLOWED_ORIGINS: "http://localhost:5173,http://127.0.0.1:5173",
        },
      },
    }),
  ],
  test: { fileParallelism: false, testTimeout: 20000, hookTimeout: 20000 },
});
