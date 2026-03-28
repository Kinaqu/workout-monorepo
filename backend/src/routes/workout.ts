import { AuthContext } from "../auth/clerk";
import { Env } from "../env";
import { errorResponse, json } from "../http/response";
import { createAppContext } from "../services/app-context";
import { isValidDate, todayDate } from "../lib/time";

export async function handleWorkout(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? todayDate();
  if (!isValidDate(date)) {
    return errorResponse("Invalid date. Use format: 2026-03-11", 400);
  }

  const { workoutService } = createAppContext(env);
  return json(await workoutService.getWorkoutForDate(auth.userId, auth.username, date));
}
