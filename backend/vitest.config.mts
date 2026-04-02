import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.join(__dirname, "migrations"));

      return {
        wrangler: {
          configPath: "./wrangler.toml",
        },
        miniflare: {
          d1Databases: ["DB"],
          kvNamespaces: ["KV"],
          bindings: {
            RESET_TOKEN: "test-reset-token",
            CLERK_ISSUER: "https://clerk.test",
            CLERK_AUDIENCE: "workout-tests",
            CLERK_JWKS_URL: "https://clerk.test/.well-known/jwks.json",
            TEST_MIGRATIONS: migrations,
          },
        },
      };
    }),
  ],
  test: {
    setupFiles: ["./test/setup/apply-migrations.ts"],
  },
});
