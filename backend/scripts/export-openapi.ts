// Exports the OpenAPI document served at /openapi.json into a committed
// backend/openapi.json artifact. The frontend generates its API types from
// that file, and `npm run openapi:check` fails the build when it is stale.
//
// Runs under Node (npx tsx scripts/export-openapi.ts): the /openapi.json
// route touches no Cloudflare bindings, so an empty Env stub is sufficient.
// If that ever changes, fall back to `wrangler dev` + curl.
import { writeFileSync } from "node:fs";

import app from "../src/app";

// Fixed origin keeps the committed document deterministic; it is embedded
// as servers[0].url by createOpenApiDocument.
const CANONICAL_ORIGIN = "https://workout-api.dimer133745.workers.dev";

async function main() {
  const response = await app.request(`${CANONICAL_ORIGIN}/openapi.json`, {}, {} as never);

  if (!response.ok) {
    throw new Error(`Failed to render OpenAPI document: HTTP ${response.status}`);
  }

  const document = await response.json();
  const outputPath = new URL("../openapi.json", import.meta.url);
  writeFileSync(outputPath, JSON.stringify(document, null, 2) + "\n");

  console.log(`Wrote ${outputPath.pathname}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
