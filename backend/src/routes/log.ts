import { AuthContext } from "../auth/clerk";
import { Env } from "../env";
import { errorResponse, json, methodNotAllowed } from "../http/response";
import { createAppContext } from "../services/app-context";

export async function handleLog(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const { sessionService } = createAppContext(env);

  if (request.method === "GET" && url.pathname.startsWith("/log/")) {
    const date = url.pathname.slice("/log/".length);
    try {
      const log = await sessionService.getLegacyLogByDate(auth.userId, auth.username, date);
      if (!log) {
        return errorResponse("No log for this date", 404);
      }
      return json(log);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Invalid date", 400);
    }
  }

  if (request.method === "POST" && url.pathname === "/log") {
    const contentType = request.headers.get("Content-Type") ?? "";
    const requestedDate = request.headers.get("X-Workout-Date") ?? undefined;

    try {
      if (contentType.includes("application/json")) {
        const payload = await request.json();
        return json(await sessionService.createFromJson(auth.userId, auth.username, payload, requestedDate));
      }

      const text = await request.text();
      return json(await sessionService.createFromText(auth.userId, auth.username, text, requestedDate));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return errorResponse(message, 400);
    }
  }

  return methodNotAllowed();
}
