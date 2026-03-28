import { Env, json } from "../index";
import { DEFAULT_PROGRAM } from "../lib/defaults";
import { runProgression } from "../lib/progression";
import { Program, UserState } from "../lib/types";

export async function handleProgression(
  _request: Request,
  env: Env,
  auth: { userId: string; username: string }
): Promise<Response> {
  const { userId } = auth;

  const programRaw = await env.KV.get(`program:${userId}`);
  const program: Program = programRaw
    ? JSON.parse(programRaw)
    : structuredClone(DEFAULT_PROGRAM);

  const stateRaw = await env.KV.get(`state:${userId}`);
  if (!stateRaw) {
    return json({ error: "No state found. Request /workout/today first." }, 400);
  }

  const state: UserState = JSON.parse(stateRaw);

  const { state: newState, result } = await runProgression(
    userId,
    program,
    state,
    (uid, days) => fetchLogs(uid, days, env)
  );

  await env.KV.put(`state:${userId}`, JSON.stringify(newState));
  await env.KV.put(`program:${userId}`, JSON.stringify(program));

  return json({
    ok: true,
    progression_date: newState.last_progression,
    result,
  });
}

async function fetchLogs(
  userId: string,
  days: number,
  env: Env
): Promise<{ date: string; exercises: { id: string; sets: number[] }[] }[]> {
  const logs = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const raw = await env.KV.get(`log:${userId}:${dateStr}`);
    if (raw) logs.push(JSON.parse(raw));
  }

  return logs;
}