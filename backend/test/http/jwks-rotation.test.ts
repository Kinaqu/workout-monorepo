import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { __resetClerkJwksCacheForTests } from "../../src/auth/clerk";
import { fetchJson, resetPersistence } from "../helpers/runtime";

const TEST_ISSUER = "https://clerk.test";
const TEST_JWKS_URL = `${TEST_ISSUER}/.well-known/jwks.json`;
const TEST_AUDIENCE = "workout-tests";

function base64UrlEncode(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createSigningKey(kid: string) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  publicJwk.alg = "RS256";
  publicJwk.kid = kid;
  publicJwk.use = "sig";

  return { keyPair, publicJwk };
}

async function signToken(keyPair: CryptoKeyPair, kid: string, sub: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT", kid }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub,
      username: sub,
      iss: TEST_ISSUER,
      aud: TEST_AUDIENCE,
      exp: now + 3600,
      nbf: now - 60,
    })
  );
  const signedPart = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(signedPart)
  );
  return `${signedPart}.${base64UrlEncode(new Uint8Array(signature))}`;
}

describe("Clerk JWKS rotation", () => {
  beforeEach(async () => {
    await resetPersistence();
    __resetClerkJwksCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refetches the JWKS once when a token carries an unknown kid", async () => {
    const keyA = await createSigningKey("key-a");
    const keyB = await createSigningKey("key-b");

    let servedJwks = { keys: [keyA.publicJwk] };
    let jwksFetches = 0;

    const originalFetch = globalThis.fetch.bind(globalThis);
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url === TEST_JWKS_URL) {
        jwksFetches += 1;
        return Response.json(servedJwks);
      }
      return originalFetch(input, init);
    });

    const tokenA = await signToken(keyA.keyPair, "key-a", "user_rotation_a");
    const tokenB = await signToken(keyB.keyPair, "key-b", "user_rotation_b");

    // Warm the cache with the original key.
    const first = await fetchJson(app.request.bind(app), "/me", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(first.response.status).toBe(200);
    expect(jwksFetches).toBe(1);

    // Clerk rotates its keys while our cache is still fresh.
    servedJwks = { keys: [keyB.publicJwk] };

    // A token signed with the new key triggers exactly one refetch and verifies.
    const rotated = await fetchJson(app.request.bind(app), "/me", {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(rotated.response.status).toBe(200);
    expect(jwksFetches).toBe(2);

    // The old key is gone: one refetch happens, then 401 - no retry loop.
    const stale = await fetchJson(app.request.bind(app), "/me", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(stale.response.status).toBe(401);
    expect(jwksFetches).toBe(3);

    // The refreshed JWKS is cached: the new key keeps verifying without fetches.
    const cached = await fetchJson(app.request.bind(app), "/me", {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(cached.response.status).toBe(200);
    expect(jwksFetches).toBe(3);
  });
});
