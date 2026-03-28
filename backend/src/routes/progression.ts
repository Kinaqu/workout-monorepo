import { AuthContext } from "../auth/clerk";
import { Env } from "../env";
import { json, methodNotAllowed } from "../http/response";
import { createAppContext } from "../services/app-context";

export async function handleProgression(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const { progressionService } = createAppContext(env);
  return json(await progressionService.run(auth.userId, auth.username));
}
