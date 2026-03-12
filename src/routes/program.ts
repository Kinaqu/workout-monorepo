import { Env, json } from "../index";
import { DEFAULT_PROGRAM } from "../lib/defaults";
import { Program, UserState } from "../lib/types";

export async function handleProgram(
  request: Request,
  env: Env,
  auth: { userId: string; username: string }
): Promise<Response> {
  const url = new URL(request.url);
  const { userId } = auth;

  // GET /program
  if (request.method === "GET") {
    const raw = await env.KV.get(`program:${userId}`);
    if (!raw) return json(DEFAULT_PROGRAM);
    return json(JSON.parse(raw));
  }

  // POST /program/reset
  if (request.method === "POST" && url.pathname === "/program/reset") {
    const resetToken = request.headers.get("X-Reset-Token");
    if (!resetToken || resetToken !== env.RESET_TOKEN) {
      return json({ error: "Invalid reset token" }, 403);
    }

    await env.KV.delete(`program:${userId}`);
    await resetState(userId, DEFAULT_PROGRAM, env);

    return json({ ok: true, message: "Program reset to default" });
  }

  // POST /program
  if (request.method === "POST") {
    let body: Program;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!body.id || !body.workouts || !body.schedule) {
      return json({ error: "Missing required fields: id, workouts, schedule" }, 400);
    }

    await env.KV.put(`program:${userId}`, JSON.stringify(body));
    await resetState(userId, body, env);

    return json({ ok: true, message: "Program saved" });
  }

  return json({ error: "Method not allowed" }, 405);
}

async function resetState(userId: string, program: Program, env: Env): Promise<void> {
  const existingRaw = await env.KV.get(`state:${userId}`);
  const existingState: UserState | null = existingRaw ? JSON.parse(existingRaw) : null;

  const allExerciseIds = Object.values(program.workouts)
    .flatMap(w => w.exercises.map(e => e.id));

  const newSets: Record<string, number> = {};
  for (const id of allExerciseIds) {
    newSets[id] = existingState?.sets[id] ?? 1;
  }

  const newState: UserState = {
    program_id: program.id,
    sets: newSets,
    last_progression: existingState?.last_progression ?? null,
  };

  await env.KV.put(`state:${userId}`, JSON.stringify(newState));
}