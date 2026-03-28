import { AuthContext } from "../auth/clerk";
import { Env } from "../env";
import { errorResponse, json, methodNotAllowed } from "../http/response";
import { getNumberParam } from "../http/request";
import { createAppContext } from "../services/app-context";

export async function handleSessions(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const { sessionService } = createAppContext(env);

  if (request.method === "GET" && url.pathname === "/sessions") {
    try {
      const limit = Math.min(getNumberParam(url, "limit", 20), 100);
      const date = url.searchParams.get("date") ?? undefined;
      return json(await sessionService.listSessions(auth.userId, auth.username, limit, date));
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Invalid request", 400);
    }
  }

  if (request.method === "GET" && url.pathname.startsWith("/sessions/")) {
    const sessionId = url.pathname.slice("/sessions/".length);
    const session = await sessionService.getSession(auth.userId, auth.username, sessionId);
    if (!session) {
      return errorResponse("Session not found", 404);
    }
    return json(session);
  }

  return methodNotAllowed();
}
