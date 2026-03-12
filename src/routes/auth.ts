import { Env, json } from "../index";
import {
  hashPassword,
  generateSalt,
  generateSecretKey,
  signJWT,
} from "../auth";
import { User } from "../lib/types";

const JWT_EXPIRES_IN_DAYS = 30;

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { username, password } = body;

  if (!username || !password) {
    return json({ error: "username and password are required" }, 400);
  }

  if (username.length < 3 || password.length < 6) {
    return json({ error: "username min 3 chars, password min 6 chars" }, 400);
  }

  // ─── Register ──────────────────────────────────────────────
  if (url.pathname === "/auth/register") {
    const existing = await env.KV.get(`user:${username}`);
    if (existing) {
      return json({ error: "Username already taken" }, 409);
    }

    const salt       = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const secretKey  = generateSecretKey();

    const user: User = { username, passwordHash, salt, secretKey };
    await env.KV.put(`user:${username}`, JSON.stringify(user));

    const token = await signJWT(
      { username, secretKey, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * JWT_EXPIRES_IN_DAYS },
      env.JWT_SECRET
    );

    return json({ ok: true, token });
  }

  // ─── Login ─────────────────────────────────────────────────
  if (url.pathname === "/auth/login") {
    const raw = await env.KV.get(`user:${username}`);
    if (!raw) {
      return json({ error: "Invalid username or password" }, 401);
    }

    const user: User = JSON.parse(raw);
    const hash = await hashPassword(password, user.salt);

    if (hash !== user.passwordHash) {
      return json({ error: "Invalid username or password" }, 401);
    }

    const token = await signJWT(
      { username, secretKey: user.secretKey, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * JWT_EXPIRES_IN_DAYS },
      env.JWT_SECRET
    );

    return json({ ok: true, token });
  }

  return json({ error: "Not found" }, 404);
}