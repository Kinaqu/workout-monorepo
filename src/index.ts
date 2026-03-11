import { handleWorkout } from "./routes/workout";
import { handleLog } from "./routes/log";
import { handleProgram } from "./routes/program";
import { handleProgression } from "./routes/progression";
import { authenticate } from "./auth";

export interface Env {
  KV: KVNamespace;
  SECRET_KEY: string;
  RESET_TOKEN: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Авторизация на все роуты
    const authError = authenticate(request, env);
    if (authError) return authError;

    try {
      if (method === "GET"  && path === "/workout/today")   return handleWorkout(request, env);
      if (method === "POST" && path === "/log")             return handleLog(request, env);
      if (method === "GET"  && path.startsWith("/log/"))    return handleLog(request, env);
      if (method === "GET"  && path === "/program")         return handleProgram(request, env);
      if (method === "POST" && path === "/program")         return handleProgram(request, env);
      if (method === "POST" && path === "/program/reset")   return handleProgram(request, env);
      if (method === "POST" && path === "/progression/run") return handleProgression(request, env);

      return json({ error: "Not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return json({ error: "Internal server error", detail: message }, 500);
    }
  },
};