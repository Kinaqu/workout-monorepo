import { Env, json } from "./index";
import { JWTPayload } from "./lib/types";

// ─── JWT ────────────────────────────────────────────────────

function b64url(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromB64url(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

async function getHmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;

  const key = await getHmacKey(secret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = b64url(String.fromCharCode(...new Uint8Array(sig)));

  return `${data}.${sigB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sigB64] = parts;
  const data = `${header}.${body}`;

  try {
    const key = await getHmacKey(secret, "verify");
    const sig = Uint8Array.from(fromB64url(sigB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(fromB64url(body));
    if (Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Password ────────────────────────────────────────────────

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSecretKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Middleware ───────────────────────────────────────────────

export async function authenticate(
  request: Request,
  env: Env
): Promise<{ userId: string; username: string } | Response> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);

  if (!payload) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  return { userId: payload.secretKey, username: payload.username };
}