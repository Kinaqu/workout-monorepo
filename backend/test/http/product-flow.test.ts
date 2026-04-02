import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { todayDate } from "../../src/lib/time";
import { installClerkTestAuth } from "../helpers/auth";
import { authHeaders, ONBOARDING_ANSWERS } from "../helpers/fixtures";
import { fetchJson } from "../helpers/runtime";

function addDays(baseDate: string, days: number): string {
  const value = new Date(`${baseDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dateForWeekday(targetDay: number): string {
  const start = new Date(`${todayDate()}T00:00:00.000Z`);
  const delta = (targetDay - start.getUTCDay() + 7) % 7;
  start.setUTCDate(start.getUTCDate() + delta);
  return start.toISOString().slice(0, 10);
}

describe("documented product flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("covers onboarding, program delivery, logging, progression, regenerate, and reset", async () => {
    const { token } = await installClerkTestAuth();
    const headers = (extra: HeadersInit = {}) => authHeaders(extra, token);

    const me = await fetchJson(app.request.bind(app), "/me", { headers: headers() });
    expect(me.response.status).toBe(200);
    expect((me.body as { lifecycle: { onboarding_completed: boolean } }).lifecycle.onboarding_completed).toBe(false);

    const programBeforeOnboarding = await fetchJson(app.request.bind(app), "/program", { headers: headers() });
    expect(programBeforeOnboarding.response.status).toBe(409);
    expect(programBeforeOnboarding.body).toEqual({ error: "Onboarding not completed" });

    const invalidWorkoutDate = await fetchJson(app.request.bind(app), "/workout/today?date=2026-02-30", {
      headers: headers(),
    });
    expect(invalidWorkoutDate.response.status).toBe(400);

    const draft = await fetchJson(app.request.bind(app), "/onboarding", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        questionnaireVersion: ONBOARDING_ANSWERS.questionnaireVersion,
        goals: ONBOARDING_ANSWERS.goals,
        equipmentAccess: ONBOARDING_ANSWERS.equipmentAccess,
      }),
    });
    expect(draft.response.status, JSON.stringify(draft.body)).toBe(200);
    expect((draft.body as { ok: boolean }).ok).toBe(true);

    const completed = await fetchJson(app.request.bind(app), "/onboarding/complete", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(ONBOARDING_ANSWERS),
    });
    expect(completed.response.status, JSON.stringify(completed.body)).toBe(200);

    const completedBody = completed.body as {
      program: {
        version_id: string;
        workouts: Record<string, { exercises: Array<{ id: string; reps?: { min: number; max: number } }> }>;
      };
    };

    const program = await fetchJson(app.request.bind(app), "/program", { headers: headers() });
    expect(program.response.status).toBe(200);

    const programBody = program.body as {
      version_id: string;
      workouts: Record<string, { exercises: Array<{ id: string; reps?: { min: number; max: number } }> }>;
      progressionState: Record<string, { min: number; max: number; sets: number }>;
    };

    expect(programBody.version_id).toBe(completedBody.program.version_id);
    const firstExercise = programBody.workouts.A.exercises[0];
    expect(firstExercise).toBeDefined();
    const bounds = programBody.progressionState[firstExercise.id];
    expect(bounds).toBeDefined();

    const monday = dateForWeekday(1);
    const workout = await fetchJson(app.request.bind(app), `/workout/today?date=${monday}`, { headers: headers() });
    expect(workout.response.status).toBe(200);
    expect((workout.body as { type: string }).type).toBe("A");

    const sessionDateOne = addDays(todayDate(), -1);
    const sessionDateTwo = todayDate();
    const aboveTarget = (bounds.max ?? firstExercise.reps?.max ?? 12) + 2;

    const firstLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: sessionDateOne,
        workout_type: "A",
        note: "first session",
        exercises: [{ id: firstExercise.id, sets: [aboveTarget, aboveTarget] }],
      }),
    });
    expect(firstLog.response.status).toBe(200);

    const secondLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: sessionDateTwo,
        workout_type: "A",
        note: "second session",
        exercises: [{ id: firstExercise.id, sets: [aboveTarget + 1, aboveTarget + 1] }],
      }),
    });
    expect(secondLog.response.status).toBe(200);

    const firstLogBody = firstLog.body as { session: { id: string } };
    const logByDate = await fetchJson(app.request.bind(app), `/log/${sessionDateOne}`, { headers: headers() });
    expect(logByDate.response.status).toBe(200);
    expect((logByDate.body as { session_count: number }).session_count).toBe(1);

    const sessions = await fetchJson(app.request.bind(app), "/sessions?limit=10", { headers: headers() });
    expect(sessions.response.status).toBe(200);
    expect((sessions.body as { count: number }).count).toBe(2);

    const session = await fetchJson(app.request.bind(app), `/sessions/${firstLogBody.session.id}`, {
      headers: headers(),
    });
    expect(session.response.status).toBe(200);
    expect((session.body as { id: string }).id).toBe(firstLogBody.session.id);

    const progression = await fetchJson(app.request.bind(app), "/progression/run", {
      method: "POST",
      headers: headers(),
    });
    expect(progression.response.status).toBe(200);
    expect((progression.body as { result: { changed: unknown[] } }).result.changed.length).toBeGreaterThan(0);

    const regenerated = await fetchJson(app.request.bind(app), "/program/regenerate", {
      method: "POST",
      headers: headers(),
    });
    expect(regenerated.response.status, JSON.stringify(regenerated.body)).toBe(200);
    expect((regenerated.body as { program: { version_id: string } }).program.version_id).not.toBe(programBody.version_id);

    const invalidReset = await fetchJson(app.request.bind(app), "/program/reset", {
      method: "POST",
      headers: headers({ "X-Reset-Token": "wrong-token" }),
    });
    expect(invalidReset.response.status).toBe(403);

    const reset = await fetchJson(app.request.bind(app), "/program/reset", {
      method: "POST",
      headers: headers({ "X-Reset-Token": "test-reset-token" }),
    });
    expect(reset.response.status).toBe(200);
    expect((reset.body as { ok: boolean }).ok).toBe(true);
  });
});
