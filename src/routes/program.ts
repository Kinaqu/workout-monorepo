import { Env, json } from "../index";
import { getUserId } from "../auth";
import { DEFAULT_PROGRAM } from "../lib/defaults";
import { Program, UserState } from "../lib/types";

export async function handleProgram(request: Request, env: Env): Promise<Response> {
  const userId = await getUserId(request);
  const url = new URL(request.url);

  // GET /program — вернуть текущую программу пользователя
  if (request.method === "GET") {
    const raw = await env.KV.get(`program:${userId}`);
    if (!raw) {
      // Нет своей программы — отдаём дефолтную
      return json(DEFAULT_PROGRAM);
    }
    return json(JSON.parse(raw));
  }

  // POST /program/reset — сброс на дефолтную
  if (request.method === "POST" && url.pathname === "/program/reset") {
    const resetToken = request.headers.get("X-Reset-Token");
    if (!resetToken || resetToken !== env.RESET_TOKEN) {
      return json({ error: "Invalid reset token" }, 403);
    }

    await env.KV.delete(`program:${userId}`);
    await resetState(userId, DEFAULT_PROGRAM, env);

    return json({ ok: true, message: "Program reset to default" });
  }

  // POST /program — загрузить новую программу
  if (request.method === "POST") {
    let body: Program;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    // Минимальная валидация
    if (!body.id || !body.workouts || !body.schedule) {
      return json({ error: "Missing required fields: id, workouts, schedule" }, 400);
    }

    // Сохраняем программу
    await env.KV.put(`program:${userId}`, JSON.stringify(body));

    // Обновляем state — сохраняем прогресс совпадающих упражнений
    await resetState(userId, body, env);

    return json({ ok: true, message: "Program saved" });
  }

  return json({ error: "Method not allowed" }, 405);
}

// Пересчитывает state при смене программы
async function resetState(userId: string, program: Program, env: Env): Promise<void> {
  const existingRaw = await env.KV.get(`state:${userId}`);
  const existingState: UserState | null = existingRaw ? JSON.parse(existingRaw) : null;

  // Собираем все id упражнений из новой программы
  const allExerciseIds = Object.values(program.workouts)
    .flatMap(w => w.exercises.map(e => e.id));

  // Переносим старый прогресс, новые упражнения стартуют с 1
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