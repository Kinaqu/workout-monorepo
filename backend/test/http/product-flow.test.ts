import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { installClerkTestAuth } from "../helpers/auth";
import { authHeaders, ONBOARDING_ANSWERS } from "../helpers/fixtures";
import { fetchJson } from "../helpers/runtime";

function resolveTargetMax(
  exercise: { reps?: { max: number }; duration?: { max: number }; cycles?: { max: number } },
  progressionState: Record<string, { min: number; max: number; sets: number }>,
  exerciseId: string
): number {
  return (
    progressionState[exerciseId]?.max ??
    exercise.reps?.max ??
    exercise.duration?.max ??
    exercise.cycles?.max ??
    10
  );
}

function buildWorkoutLogExercises(
  workoutExercises: Array<{ id: string; reps?: { max: number }; duration?: { max: number }; cycles?: { max: number } }>,
  progressionState: Record<string, { min: number; max: number; sets: number }>,
  extra = 2
) {
  return workoutExercises.map(exercise => {
    const target = resolveTargetMax(exercise, progressionState, exercise.id);
    const setCount = progressionState[exercise.id]?.sets ?? 1;
    return {
      id: exercise.id,
      sets: Array.from({ length: setCount }, (_, index) => target + extra + index),
    };
  });
}

describe("documented product flow", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("covers onboarding, program delivery, logging, progression, regenerate, and reset", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));

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
      generator_metadata: { version: string; catalog_seed_version: string } | null;
      generated_program_metadata: {
        generation_reason: string;
        profile_version: string | null;
        created_at: string;
        input_summary: {
          primaryGoal?: string;
          trainingDaysPerWeek?: number;
          sessionDurationMinutes?: number;
        };
      } | null;
      program_runtime_state: {
        last_progression_run_at: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      active_version: {
        status: "active";
        version_number: number;
        previous_version_id: string | null;
      };
      current_version_changes: {
        summary: string;
        highlights: string[];
      };
      progression_events: Array<{ exercise_key: string; direction: "up" | "down" }>;
      workouts: Record<
        string,
        {
          exercises: Array<{
            id: string;
            max_sets: number;
            reps?: { min: number; max: number };
            duration?: { min: number; max: number };
            cycles?: { min: number; max: number };
          }>;
        }
      >;
      progressionState: Record<string, { min: number; max: number; sets: number }>;
    };

    expect(programBody.version_id).toBe(completedBody.program.version_id);
    expect(programBody.generator_metadata).toEqual({
      version: "generator-v1",
      catalog_seed_version: "catalog-v1",
    });
    expect(programBody.generated_program_metadata?.generation_reason).toBe("onboarding-complete");
    expect(programBody.generated_program_metadata?.input_summary.trainingDaysPerWeek).toBe(
      ONBOARDING_ANSWERS.trainingDaysPerWeek
    );
    expect(programBody.program_runtime_state?.last_progression_run_at).toBeTruthy();
    expect(programBody.active_version.status).toBe("active");
    expect(programBody.active_version.version_number).toBe(1);
    expect(programBody.current_version_changes.summary).toMatch(/initial version created/i);
    expect(programBody.current_version_changes.highlights).toContain(
      "This is the first version in the current plan family."
    );
    const firstExercise = programBody.workouts.A.exercises[0];
    const secondWeekExercise = programBody.workouts.B.exercises[0];
    expect(firstExercise).toBeDefined();
    expect(secondWeekExercise).toBeDefined();
    const bounds = programBody.progressionState[firstExercise.id];
    expect(bounds).toBeDefined();

    const monday = "2026-04-06";
    const workout = await fetchJson(app.request.bind(app), `/workout/today?date=${monday}`, { headers: headers() });
    expect(workout.response.status).toBe(200);
    const workoutBody = workout.body as {
      type: string;
      exercises: Array<{ id: string; sets: number; max_sets: number; reps?: { min: number; max: number } }>;
    };
    expect(workoutBody.type).toBe("A");
    expect(workoutBody.exercises[0]).toMatchObject({
      id: firstExercise.id,
      sets: programBody.progressionState[firstExercise.id]?.sets ?? 1,
      max_sets: firstExercise.max_sets,
      reps: {
        min: programBody.progressionState[firstExercise.id]?.min ?? firstExercise.reps?.min,
        max: programBody.progressionState[firstExercise.id]?.max ?? firstExercise.reps?.max,
      },
    });

    const sessionDateOne = "2026-04-06";
    const sessionDateTwo = "2026-04-08";
    const firstLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: sessionDateOne,
        workout_type: "A",
        note: "first session",
        exercises: buildWorkoutLogExercises(programBody.workouts.A.exercises, programBody.progressionState),
      }),
    });
    expect(firstLog.response.status).toBe(200);

    const duplicateLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: sessionDateOne,
        workout_type: "A",
        note: "duplicate session",
        exercises: buildWorkoutLogExercises(programBody.workouts.A.exercises, programBody.progressionState),
      }),
    });
    expect(duplicateLog.response.status).toBe(409);
    expect(duplicateLog.body).toEqual({ error: "Workout already logged for this date" });

    const secondLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: sessionDateTwo,
        workout_type: "B",
        note: "second session",
        exercises: buildWorkoutLogExercises(programBody.workouts.B.exercises, programBody.progressionState),
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

    const unchangedWorkout = await fetchJson(app.request.bind(app), `/workout/today?date=${monday}`, {
      headers: headers(),
    });
    expect(unchangedWorkout.response.status).toBe(200);

    const unchangedBody = unchangedWorkout.body as {
      exercises: Array<{ id: string; reps?: { min: number; max: number } }>;
    };
    expect(unchangedBody.exercises[0]?.reps?.max).toBe(bounds.max);

    const progression = await fetchJson(app.request.bind(app), "/progression/run", {
      method: "POST",
      headers: headers(),
    });
    expect(progression.response.status).toBe(200);

    const progressedProgram = await fetchJson(app.request.bind(app), "/program", { headers: headers() });
    expect(progressedProgram.response.status).toBe(200);
    const progressedState = (
      progressedProgram.body as {
        progressionState: Record<string, { min: number; max: number; sets: number }>;
        progression_events: Array<{ exercise_key: string; direction: "up" | "down" }>;
        program_runtime_state: { last_progression_run_at: string | null } | null;
      }
    );
    const progressedStateMap = progressedState.progressionState;
    const progressedBounds = progressedStateMap[firstExercise.id];
    expect(progressedBounds).toBeDefined();
    expect(progressedBounds.max).toBeGreaterThan(bounds.max);
    expect(progressedState.progression_events.length).toBeGreaterThan(0);
    expect(progressedState.progression_events[0]?.exercise_key).toBe(firstExercise.id);
    expect(progressedState.program_runtime_state?.last_progression_run_at).toBeTruthy();

    const weeklySessionOne = "2026-04-15";
    const weeklySessionTwo = "2026-04-17";

    const thirdLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: weeklySessionOne,
        workout_type: "B",
        note: "third session",
        exercises: buildWorkoutLogExercises(programBody.workouts.B.exercises, progressedStateMap),
      }),
    });
    expect(thirdLog.response.status).toBe(200);

    const fourthLog = await fetchJson(app.request.bind(app), "/log", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        session_date: weeklySessionTwo,
        workout_type: "C",
        note: "fourth session",
        exercises: buildWorkoutLogExercises(programBody.workouts.C.exercises, progressedStateMap),
      }),
    });
    expect(fourthLog.response.status).toBe(200);

    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));
    const { token: refreshedToken } = await installClerkTestAuth();
    const refreshedHeaders = (extra: HeadersInit = {}) => authHeaders(extra, refreshedToken);

    const autoRefreshedWorkout = await fetchJson(app.request.bind(app), `/workout/today?date=2026-04-20`, {
      headers: refreshedHeaders(),
    });
    expect(autoRefreshedWorkout.response.status).toBe(200);

    const autoRefreshedProgram = await fetchJson(app.request.bind(app), "/program", { headers: refreshedHeaders() });
    expect(autoRefreshedProgram.response.status).toBe(200);
    const autoRefreshedProgramBody = (
      autoRefreshedProgram.body as {
        progressionState: Record<string, { min: number; max: number; sets: number }>;
        active_version: { version_number: number };
        current_version_changes: { highlights: string[]; summary: string };
      }
    );
    const autoRefreshedBounds = autoRefreshedProgramBody.progressionState[secondWeekExercise.id];
    expect(autoRefreshedBounds).toBeDefined();
    const previousSecondWeekBounds = progressedStateMap[secondWeekExercise.id];
    expect(
      autoRefreshedBounds.max > (previousSecondWeekBounds?.max ?? 0) ||
        autoRefreshedBounds.sets > (previousSecondWeekBounds?.sets ?? 0)
    ).toBe(true);
    expect(autoRefreshedProgramBody.active_version.version_number).toBe(1);
    expect(autoRefreshedProgramBody.current_version_changes.summary).toMatch(/initial version created/i);

    const regenerated = await fetchJson(app.request.bind(app), "/program/regenerate", {
      method: "POST",
      headers: refreshedHeaders(),
    });
    expect(regenerated.response.status, JSON.stringify(regenerated.body)).toBe(200);
    expect((regenerated.body as { program: { version_id: string } }).program.version_id).not.toBe(programBody.version_id);

    const invalidReset = await fetchJson(app.request.bind(app), "/program/reset", {
      method: "POST",
      headers: refreshedHeaders({ "X-Reset-Token": "wrong-token" }),
    });
    expect(invalidReset.response.status).toBe(403);

    const reset = await fetchJson(app.request.bind(app), "/program/reset", {
      method: "POST",
      headers: refreshedHeaders({ "X-Reset-Token": "test-reset-token" }),
    });
    expect(reset.response.status).toBe(200);
    expect((reset.body as { ok: boolean }).ok).toBe(true);
  });
});
