import type { Env } from "../env";

const DEFAULT_DEV_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

interface CompiledOriginPattern {
  protocol: string;
  hostname: RegExp;
  port: string;
}

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function splitConfiguredList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileHostnamePattern(hostnamePattern: string): RegExp | null {
  const normalized = hostnamePattern.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const escapedSegments = normalized
    .split("*")
    .map(segment => escapeRegex(segment))
    .join("[^.]*");

  return new RegExp(`^${escapedSegments}$`);
}

function compileOriginPattern(pattern: string): CompiledOriginPattern | null {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      return null;
    }

    const hostname = compileHostnamePattern(url.hostname);
    if (!hostname) {
      return null;
    }

    return {
      protocol: url.protocol,
      hostname,
      port: url.port,
    };
  } catch {
    return null;
  }
}

function getConfiguredCorsOrigins(env: Pick<Env, "CORS_ALLOWED_ORIGINS">): string[] {
  const configuredOrigins = splitConfiguredList(env.CORS_ALLOWED_ORIGINS);
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

function getConfiguredCorsOriginPatterns(
  env: Pick<Env, "CORS_ALLOWED_ORIGIN_PATTERNS">
): CompiledOriginPattern[] {
  const configuredPatterns = splitConfiguredList(env.CORS_ALLOWED_ORIGIN_PATTERNS);

  return configuredPatterns
    .map(compileOriginPattern)
    .filter((pattern): pattern is CompiledOriginPattern => pattern !== null);
}

export function getAllowedCorsOrigins(env: Pick<Env, "CORS_ALLOWED_ORIGINS">): string[] {
  return getConfiguredCorsOrigins(env);
}

export function isCorsOriginAllowed(
  origin: string,
  env: Pick<Env, "CORS_ALLOWED_ORIGINS" | "CORS_ALLOWED_ORIGIN_PATTERNS">
): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  const exactOrigins = getConfiguredCorsOrigins(env);
  if (exactOrigins.includes(normalizedOrigin)) {
    return true;
  }

  const originUrl = new URL(normalizedOrigin);
  const compiledPatterns = getConfiguredCorsOriginPatterns(env);

  return compiledPatterns.some(pattern => {
    return (
      pattern.protocol === originUrl.protocol &&
      pattern.port === originUrl.port &&
      pattern.hostname.test(originUrl.hostname.toLowerCase())
    );
  });
}

export function resolveCorsOrigin(
  origin: string,
  env: Pick<Env, "CORS_ALLOWED_ORIGINS" | "CORS_ALLOWED_ORIGIN_PATTERNS">
): string | null {
  return isCorsOriginAllowed(origin, env) ? origin : null;
}
