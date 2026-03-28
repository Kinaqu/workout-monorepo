import { Env } from "../env";
import { errorResponse } from "../http/response";

const CLERK_JWKS_CACHE_TTL_MS = 10 * 60 * 1000;

interface ClerkJwtPayload {
  sub?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
  email?: string;
  username?: string;
}

interface Jwk {
  kid?: string;
  kty: string;
  alg?: string;
  n?: string;
  e?: string;
}

interface JwksResponse {
  keys: Jwk[];
}

type CachedJwks = {
  expiresAt: number;
  jwks: JwksResponse;
};

let clerkJwksCache: CachedJwks | null = null;

export interface AuthContext {
  userId: string;
  username: string;
}

function fromB64url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(padLen));
}

function parseJwt(token: string): { header: { kid?: string; alg?: string }; payload: ClerkJwtPayload; signedPart: string; signature: Uint8Array } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(fromB64url(headerB64)) as { kid?: string; alg?: string };
    const payload = JSON.parse(fromB64url(payloadB64)) as ClerkJwtPayload;
    const signature = Uint8Array.from(fromB64url(signatureB64), char => char.charCodeAt(0));
    return {
      header,
      payload,
      signedPart: `${headerB64}.${payloadB64}`,
      signature,
    };
  } catch {
    return null;
  }
}

async function getClerkJwks(env: Env): Promise<JwksResponse> {
  const now = Date.now();
  if (clerkJwksCache && clerkJwksCache.expiresAt > now) {
    return clerkJwksCache.jwks;
  }

  const jwksUrl = env.CLERK_JWKS_URL ?? `${env.CLERK_ISSUER}/.well-known/jwks.json`;
  const response = await fetch(jwksUrl, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) {
    throw new Error(`Failed to fetch Clerk JWKS: ${response.status}`);
  }

  const jwks = await response.json<JwksResponse>();
  if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    throw new Error("Clerk JWKS is empty");
  }

  clerkJwksCache = {
    jwks,
    expiresAt: now + CLERK_JWKS_CACHE_TTL_MS,
  };

  return jwks;
}

async function verifySignature(token: string, env: Env): Promise<ClerkJwtPayload | null> {
  const parsed = parseJwt(token);
  if (!parsed || parsed.header.alg !== "RS256" || !parsed.header.kid) {
    return null;
  }

  const jwks = await getClerkJwks(env);
  const jwk = jwks.keys.find(key => key.kid === parsed.header.kid && key.kty === "RSA" && key.n && key.e);
  if (!jwk) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    parsed.signature,
    new TextEncoder().encode(parsed.signedPart)
  );

  return valid ? parsed.payload : null;
}

function isAudienceValid(payloadAud: string | string[] | undefined, expectedAud?: string): boolean {
  if (!expectedAud) return true;
  if (!payloadAud) return false;
  return Array.isArray(payloadAud) ? payloadAud.includes(expectedAud) : payloadAud === expectedAud;
}

export async function authenticate(request: Request, env: Env): Promise<AuthContext | Response> {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    return errorResponse("Unauthorized", 401);
  }

  let payload: ClerkJwtPayload | null = null;
  try {
    payload = await verifySignature(token, env);
  } catch {
    return errorResponse("Auth provider unavailable", 503);
  }

  if (!payload) {
    return errorResponse("Invalid or expired token", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.exp || payload.exp < now) {
    return errorResponse("Invalid or expired token", 401);
  }

  if (payload.nbf && payload.nbf > now) {
    return errorResponse("Token is not active yet", 401);
  }

  if (env.CLERK_ISSUER && payload.iss !== env.CLERK_ISSUER) {
    return errorResponse("Invalid token issuer", 401);
  }

  if (!isAudienceValid(payload.aud, env.CLERK_AUDIENCE)) {
    return errorResponse("Invalid token audience", 401);
  }

  return {
    userId: payload.sub,
    username: payload.username ?? payload.email ?? payload.sub,
  };
}
