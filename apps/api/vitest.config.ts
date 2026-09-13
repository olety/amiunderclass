import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          LIVE_RUNS_ENABLED: "true",
          SPONSORED_BUDGET_USD: "1.00",
          MAX_ACTIVE_RUNS: "4",
          OPENROUTER_API_KEY: "test-key-never-live",
          TURNSTILE_SECRET_KEY: "test-secret",
          ABUSE_HASH_SECRET: "test-hmac-secret",
          TURNSTILE_SITE_KEY: "test-site",
          TURNSTILE_HOSTNAME: "underclass.test",
        },
      },
    }),
  ],
  test: { fileParallelism: false, testTimeout: 20000, hookTimeout: 20000 },
});
