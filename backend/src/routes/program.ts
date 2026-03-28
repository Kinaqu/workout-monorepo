import { AuthContext } from "../auth/clerk";
import { Env } from "../env";
import { errorResponse, methodNotAllowed, json } from "../http/response";
import { readJson } from "../http/request";
import { createAppContext } from "../services/app-context";

export async function handleProgram(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const { programService } = createAppContext(env);

  if (request.method === "GET" && url.pathname === "/program") {
    return json(await programService.getCurrentProgram(auth.userId, auth.username));
  }

  if (request.method === "POST" && url.pathname === "/program/reset") {
    const resetToken = request.headers.get("X-Reset-Token");
    if (!resetToken || resetToken !== env.RESET_TOKEN) {
      return errorResponse("Invalid reset token", 403);
    }

    return json(await programService.resetProgram(auth.userId, auth.username));
  }

  if (request.method === "POST" && url.pathname === "/program") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;

    try {
      return json(await programService.saveProgram(auth.userId, auth.username, body));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid program body";
      return errorResponse(message, 400);
    }
  }

  return methodNotAllowed();
}
