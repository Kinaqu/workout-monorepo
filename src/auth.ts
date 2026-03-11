import { Env } from "./index";

export function authenticate(request: Request, env: Env): Response | null {
  const key = request.headers.get("X-Secret-Key");
  if (!key || key !== env.SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

// Хэшируем ключ → безопасный userId для KV
export async function getUserId(request: Request): Promise<string> {
  const key = request.headers.get("X-Secret-Key")!;
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}