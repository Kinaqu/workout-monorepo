import { vi } from "vitest";
import { TEST_USER } from "./fixtures";

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

export async function installClerkTestAuth(): Promise<{ token: string }> {
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
  publicJwk.kid = "test-key";
  publicJwk.use = "sig";

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: TEST_USER.userId,
      username: TEST_USER.username,
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
  const token = `${signedPart}.${base64UrlEncode(new Uint8Array(signature))}`;

  const originalFetch = globalThis.fetch.bind(globalThis);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === TEST_JWKS_URL) {
      return Response.json({ keys: [publicJwk] });
    }
    return originalFetch(input, init);
  });

  return { token };
}
