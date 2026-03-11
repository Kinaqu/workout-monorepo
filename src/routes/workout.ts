import { Env, json } from "../index";
import { getUserId } from "../auth";
import { DEFAULT_PROGRAM } from "../lib/defaults";
import { getTodayWorkout } from "../lib/schedule";
import { Program, UserState } from "../lib/types";

export async function handleWorkout(request: Request, env: Env): Promise<Response> {
  const userId = await getUserId(request);

  const programRaw = await env.KV.get(`program:${userId}`);
  const program: Program = programRaw ? JSON.parse(programRaw) : DEFAULT_PROGRAM;

  const stateRaw = await env.KV.get(`state:${userId}`);
  let state: UserState | null = stateRaw ? JSON.parse(stateRaw) : null;

  if (!state) {
    const allExerciseIds = Object.values(program.workouts)
      .flatMap(w => w.exercises.map(e => e.id));

    const sets: Record<string, number> = {};
    for (const id of allExerciseIds) {
      sets[id] = 1;
    }

    state = {
      program_id: program.id,
      sets,
      last_progression: null,
    };

    await env.KV.put(`state:${userId}`, JSON.stringify(state));
  }

  const result = getTodayWorkout(program, state.sets);

  if (!("name" in result)) {
    return json({ type: "rest", message: "Сегодня выходной 🛋️" });
  }

  return json({
    type: result.type,
    name: result.name,
    exercises: result.exercises,
  });
}