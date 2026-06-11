import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRAM } from "../../src/domain/default-program";
import { createProgramDraft, type ProgramTemplate } from "../../src/domain/program";
import {
  enrichSessionInput,
  parseLogText,
  sessionToLegacyLogResponse,
  type WorkoutSessionRecord,
} from "../../src/domain/session";

// Build a ProgramTemplate the cheap way: reuse the default program draft and
// give the entries the identifiers the repository would normally assign.
function makeProgram(): ProgramTemplate {
  const draft = createProgramDraft(DEFAULT_PROGRAM);
  const workouts: ProgramTemplate["workouts"] = {};
  for (const workout of draft.workouts) {
    workouts[workout.key] = {
      id: `workout_${workout.key}`,
      key: workout.key,
      name: workout.name,
      sortOrder: workout.sortOrder,
      exercises: workout.exercises.map((exercise, index) => ({
        id: `we_${workout.key}_${index}`,
        sortOrder: exercise.sortOrder,
        maxSets: exercise.maxSets,
        targetMin: exercise.targetMin,
        targetMax: exercise.targetMax,
        exercise: {
          id: `exercise_${exercise.exerciseKey}`,
          catalogExerciseId: exercise.catalogExerciseId,
          key: exercise.exerciseKey,
          name: exercise.exerciseName,
          type: exercise.exerciseType,
          progressionEnabled: exercise.progressionEnabled,
          progressionStep: exercise.progressionStep,
          deloadStep: exercise.deloadStep,
        },
      })),
    };
  }

  return {
    versionId: "program_test",
    key: draft.key,
    name: draft.name,
    source: "api",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    schedule: draft.schedule,
    workouts,
  };
}

describe("parseLogText", () => {
  const program = makeProgram();

  it("matches program exercises by localized name and accumulates repeated lines", () => {
    const parsed = parseLogText("Отжимания 10 9\nОтжимания 8\nПриседания 15х15", program);

    expect(parsed.exercises).toEqual([
      { id: "pushups", name: "Отжимания", sets: [10, 9, 8] },
      { id: "squats", name: "Приседания", sets: [15, 15] },
    ]);
    expect(parsed.unmatched).toEqual([]);
    expect(parsed.note).toBe("");
  });

  it("collects number-free lines as the note and unknown exercises as unmatched", () => {
    const parsed = parseLogText("Чувствовал себя отлично\nBurpees 8 8\nОтжимания 10", program);

    expect(parsed.note).toBe("Чувствовал себя отлично");
    expect(parsed.unmatched).toEqual(["Burpees 8 8"]);
    expect(parsed.exercises).toEqual([{ id: "pushups", name: "Отжимания", sets: [10] }]);
  });

  it("strips unit suffixes when extracting numbers", () => {
    const parsed = parseLogText("Боковая планка 30сек 45sec", program);

    expect(parsed.exercises).toEqual([{ id: "side_plank", name: "Боковая планка", sets: [30, 45] }]);
  });
});

describe("enrichSessionInput", () => {
  const program = makeProgram();

  it("resolves workout name, exercise identity, and sort order; rounds set values", () => {
    const enriched = enrichSessionInput(program, {
      sessionDate: "2026-04-06",
      note: "good",
      workoutType: "A",
      source: "json",
      rawText: null,
      unmatched: [],
      exercises: [
        { id: "squats", sets: [15.4, 14.6] },
        { id: "unknown_move", name: "Mystery", sets: [5] },
      ],
    });

    expect(enriched.workoutName).toBe("Тренировка A");
    expect(enriched.exercises[0]).toMatchObject({
      exerciseKey: "squats",
      exerciseName: "Приседания",
      exerciseType: "reps",
      matched: true,
      sortOrder: 0,
      sets: [15, 15],
    });
    expect(enriched.exercises[1]).toMatchObject({
      exerciseKey: "unknown_move",
      exerciseName: "Mystery",
      exerciseType: null,
      matched: false,
      sortOrder: 1,
    });
  });
});

describe("sessionToLegacyLogResponse", () => {
  it("maps the record and drops exercises without an exercise key", () => {
    const record: WorkoutSessionRecord = {
      id: "session_1",
      sessionDate: "2026-04-06",
      workoutType: "A",
      workoutName: "Тренировка A",
      note: "good",
      source: "legacy-kv",
      rawText: "raw",
      unmatched: ["junk line"],
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
      exercises: [
        {
          id: "se_1",
          programExerciseId: null,
          catalogExerciseId: null,
          exerciseKey: "pushups",
          exerciseName: "Отжимания",
          exerciseType: "reps",
          matched: true,
          sortOrder: 0,
          sets: [10, 9],
        },
        {
          id: "se_2",
          programExerciseId: null,
          catalogExerciseId: null,
          exerciseKey: null,
          exerciseName: "Imported blob",
          exerciseType: null,
          matched: false,
          sortOrder: 1,
          sets: [1],
        },
      ],
    };

    expect(sessionToLegacyLogResponse(record)).toEqual({
      date: "2026-04-06",
      workout_type: "A",
      exercises: [{ id: "pushups", name: "Отжимания", sets: [10, 9] }],
      note: "good",
      unmatched: ["junk line"],
      source: "legacy-kv",
      session_id: "session_1",
      created_at: "2026-04-06T10:00:00.000Z",
    });
  });
});
