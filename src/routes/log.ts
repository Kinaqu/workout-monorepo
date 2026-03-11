import { Env, json } from "../index";
import { getUserId } from "../auth";
import { DEFAULT_PROGRAM } from "../lib/defaults";
import { parseLogText } from "../lib/parser";
import { Program } from "../lib/types";

export async function handleLog(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = await getUserId(request);

  // GET /log/:date
  if (request.method === "GET") {
    const date = url.pathname.split("/log/")[1];
    if (!date || !isValidDate(date)) {
      return json({ error: "Invalid date. Use format: 2026-03-11" }, 400);
    }

    const raw = await env.KV.get(`log:${userId}:${date}`);
    if (!raw) return json({ error: "No log for this date" }, 404);

    return json(JSON.parse(raw));
  }

  // POST /log
  if (request.method === "POST") {
    const contentType = request.headers.get("Content-Type") ?? "";
    const dateHeader = request.headers.get("X-Workout-Date");
    const date = dateHeader ?? getTodayDate();

    if (!isValidDate(date)) {
      return json({ error: "Invalid date in X-Workout-Date header" }, 400);
    }

    const programRaw = await env.KV.get(`program:${userId}`);
    const program: Program = programRaw ? JSON.parse(programRaw) : DEFAULT_PROGRAM;

    let logEntry: object;

    if (contentType.includes("application/json")) {
      try {
        const body = await request.json() as {
          exercises?: { id: string; sets: number[] }[];
          note?: string;
          workout_type?: string;
        };

        logEntry = {
          date,
          workout_type: body.workout_type ?? null,
          exercises: body.exercises ?? [],
          note: body.note ?? "",
          source: "json",
        };
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
    } else {
      const text = await request.text();
      if (!text.trim()) {
        return json({ error: "Empty body" }, 400);
      }

      const parsed = parseLogText(text, program);

      logEntry = {
        date,
        workout_type: null,
        exercises: parsed.exercises,
        note: parsed.note,
        unmatched: parsed.unmatched,
        source: "text",
      };
    }

    await env.KV.put(`log:${userId}:${date}`, JSON.stringify(logEntry));

    return json({ ok: true, date, entry: logEntry });
  }

  return json({ error: "Method not allowed" }, 405);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}