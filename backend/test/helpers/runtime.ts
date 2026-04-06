import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";

const USER_TABLES = [
  "program_runtime_state",
  "progression_events",
  "exercise_progression_state",
  "workout_session_sets",
  "workout_session_exercises",
  "workout_session_imports",
  "workout_sessions",
  "generated_program_metadata",
  "program_schedule",
  "workout_exercises",
  "exercises",
  "workouts",
  "programs",
  "user_profile_goal_tags",
  "user_profile_equipment",
  "user_profile_focus_areas",
  "user_profile_limitation_tags",
  "user_profile_preferred_styles",
  "user_profiles",
  "onboarding_answers",
  "users",
] as const;

export async function fetchJson(
  handler: (
    input: string,
    requestInit: RequestInit | undefined,
    env: typeof import("cloudflare:workers").env,
    ctx: ExecutionContext
  ) => Response | Promise<Response>,
  path: string,
  init: RequestInit = {}
) {
  const ctx = createExecutionContext();
  const response = await handler(path, init, env, ctx);
  await waitOnExecutionContext(ctx);

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  return { response, body };
}

export async function resetPersistence(): Promise<void> {
  await env.DB.exec("PRAGMA foreign_keys = OFF;");
  const statements = USER_TABLES.map(table => env.DB.prepare(`DELETE FROM ${table}`));
  try {
    await env.DB.batch(statements);
  } finally {
    await env.DB.exec("PRAGMA foreign_keys = ON;");
  }

  let cursor: string | undefined;
  do {
    const page = await env.KV.list({ cursor });
    await Promise.all(page.keys.map(key => env.KV.delete(key.name)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}
