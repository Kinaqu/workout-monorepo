import { handleWorkout }    from "./routes/workout";
import { handleLog }        from "./routes/log";
import { handleProgram }    from "./routes/program";
import { handleProgression }from "./routes/progression";
import { handleAuth }       from "./routes/auth";
import { authenticate }     from "./auth";

export interface Env {
  KV: KVNamespace;
  JWT_SECRET: string;
  RESET_TOKEN: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Workout-Date, X-Reset-Token",
        },
      });
    }

    try {
      // Публичные роуты — без авторизации
      if (path === "/auth/register" || path === "/auth/login") {
        return handleAuth(request, env);
      }

      // Все остальные роуты — требуют JWT
      const auth = await authenticate(request, env);
      if (auth instanceof Response) return auth;

      if (method === "GET"  && path === "/workout/today")    return handleWorkout(request, env, auth);
      if (method === "POST" && path === "/log")              return handleLog(request, env, auth);
      if (method === "GET"  && path.startsWith("/log/"))     return handleLog(request, env, auth);
      if (method === "GET"  && path === "/program")          return handleProgram(request, env, auth);
      if (method === "POST" && path === "/program")          return handleProgram(request, env, auth);
      if (method === "POST" && path === "/program/reset")    return handleProgram(request, env, auth);
      if (method === "POST" && path === "/progression/run")  return handleProgression(request, env, auth);

      return json({ error: "Not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return json({ error: "Internal server error", detail: message }, 500);
    }
  },
};