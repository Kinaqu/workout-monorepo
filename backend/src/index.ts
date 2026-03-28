import { authenticate } from "./auth/clerk";
import { Env } from "./env";
import { noContent, json } from "./http/response";
import { handleAuth } from "./routes/auth";
import { handleLog } from "./routes/log";
import { handleProgram } from "./routes/program";
import { handleProgression } from "./routes/progression";
import { handleSessions } from "./routes/sessions";
import { handleWorkout } from "./routes/workout";

export { Env };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return noContent();
    }

    try {
      if (pathname === "/auth/register" || pathname === "/auth/login") {
        return handleAuth();
      }

      const auth = await authenticate(request, env);
      if (auth instanceof Response) {
        return auth;
      }

      if (method === "GET" && pathname === "/workout/today") return handleWorkout(request, env, auth);
      if (pathname === "/program") return handleProgram(request, env, auth);
      if (pathname === "/program/reset") return handleProgram(request, env, auth);
      if (pathname === "/progression/run") return handleProgression(request, env, auth);
      if (pathname === "/log" || pathname.startsWith("/log/")) return handleLog(request, env, auth);
      if (pathname === "/sessions" || pathname.startsWith("/sessions/")) return handleSessions(request, env, auth);

      return json({ error: "Not found" }, 404);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      return json({ error: "Internal server error", detail }, 500);
    }
  },
};
