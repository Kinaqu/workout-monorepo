import type { Env } from "../env";

const DEFAULT_DEV_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function getAllowedCorsOrigins(env: Pick<Env, "CORS_ALLOWED_ORIGINS">): string[] {
  const configuredOrigins = (env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  const sourceOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_DEV_ORIGINS;
  const normalizedOrigins = new Set<string>();

  for (const origin of sourceOrigins) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (normalizedOrigin) {
      normalizedOrigins.add(normalizedOrigin);
    }
  }

  return [...normalizedOrigins];
}
