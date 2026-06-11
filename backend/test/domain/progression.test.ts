import { describe, expect, it } from "vitest";
import type { ProgramTemplate, WorkoutExerciseTemplate } from "../../src/domain/program";
import { evaluateProgression, type ExerciseProgressionState } from "../../src/domain/progression";

// 2026-04-06 is a Monday; with thursday+monday scheduled, the 7-day window
// 2026-03-31..2026-04-06 contains exactly two planned workout days
// (Thu 2026-04-02 and Mon 2026-04-06).
const NOW = "2026-04-06T12:00:00.000Z";

function exercise(
  key: string,
  type: "reps" | "time" | "cycles",
  targetMin: number,
  targetMax: number,
  maxSets: number,
  progressionEnabled = true
): WorkoutExerciseTemplate {
  return {
    id: `we_${key}`,
    sortOrder: 0,
    maxSets,
    targetMin,
    targetMax,
    exercise: {
      id: `exercise_${key}`,
      catalogExerciseId: null,
      key,
      name: key,
      type,
      progressionEnabled,
      progressionStep: type === "time" ? 5 : 1,
      deloadStep: type === "time" ? 5 : 1,
    },
  };
}

const PUSHUPS = exercise("pushups", "reps", 8, 12, 3);
const PLANK = exercise("plank", "time", 30, 45, 3);
const BREATHING = exercise("breathing", "cycles", 5, 8, 1, false);

function makeProgram(extraWorkouts: Record<string, WorkoutExerciseTemplate[]> = {}, extraSchedule: Record<string, string> = {}): ProgramTemplate {
  const workouts: ProgramTemplate["workouts"] = {
    A: { id: "workout_a", key: "A", name: "Workout A", sortOrder: 0, exercises: [PUSHUPS, PLANK, BREATHING] },
  };
  for (const [key, exercises] of Object.entries(extraWorkouts)) {
    workouts[key] = { id: `workout_${key}`, key, name: `Workout ${key}`, sortOrder: 1, exercises };
  }

  return {
    versionId: "program_test",
    key: "test",
    name: "Test Program",
    source: "api",
    createdAt: NOW,
    updatedAt: NOW,
    schedule: {
      monday: "A",
      tuesday: null,
      wednesday: null,
      thursday: "A",
      friday: null,
      saturday: null,
      sunday: null,
      ...extraSchedule,
    },
    workouts,
  };
}

function state(key: string, overrides: Partial<ExerciseProgressionState> = {}): [string, ExerciseProgressionState] {
  const template = key === "plank" ? PLANK : key === "breathing" ? BREATHING : PUSHUPS;
  return [
    key,
    {
      id: `state_${key}`,
      exerciseId: `exercise_${key}`,
      catalogExerciseId: null,
      exerciseKey: key,
      currentSets: 1,
      currentTargetMin: template.targetMin,
      currentTargetMax: template.targetMax,
      lastProgressionAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    },
  ];
}

function defaultStates(overrides: Partial<Record<string, Partial<ExerciseProgressionState>>> = {}) {
  return new Map([
    state("pushups", overrides.pushups),
    state("plank", overrides.plank),
    state("breathing", overrides.breathing),
  ]);
}

interface PerformanceInput {
  pushups?: number[];
  plank?: number[];
  breathing?: number[];
}

function session(sessionDate: string, sets: PerformanceInput) {
  return {
    sessionDate,
    exercises: Object.entries(sets).map(([exerciseKey, values]) => ({
      exerciseKey,
      catalogExerciseId: null,
      sets: values ?? [],
    })),
  };
}

const FULL_DAY = { plank: [35], breathing: [6] };

describe("evaluateProgression", () => {
  it("skips everything when fewer than half of planned workouts were completed", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates(),
      sessions: [],
      now: NOW,
    });

    expect(result.changed).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.skipped).toHaveLength(3);
    for (const entry of result.skipped) {
      expect(entry.reason).toBe("completed 0/2 planned workouts in last 7 days");
    }
    // States are only touched, not changed.
    const pushups = result.nextStates.find(s => s.exerciseKey === "pushups");
    expect(pushups).toMatchObject({ currentSets: 1, currentTargetMin: 8, currentTargetMax: 12, updatedAt: NOW });
  });

  it("does not count sessions that miss an exercise or required set count", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates({ pushups: { currentSets: 2 } }),
      sessions: [
        // Missing plank entirely.
        session("2026-04-02", { pushups: [12, 12], breathing: [6] }),
        // Pushups logged with fewer sets than the current requirement of 2.
        session("2026-04-06", { pushups: [12], ...FULL_DAY }),
      ],
      now: NOW,
    });

    expect(result.changed).toEqual([]);
    expect(result.skipped.every(entry => entry.reason.startsWith("completed 0/2"))).toBe(true);
  });

  it("bumps the target range on an above-target session and reports skips per exercise", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates(),
      sessions: [
        session("2026-04-02", { pushups: [12], ...FULL_DAY }),
        session("2026-04-06", { pushups: [9], ...FULL_DAY }),
      ],
      now: NOW,
    });

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0]).toMatchObject({
      id: "pushups",
      direction: "up",
      before: { sets: 1, min: 8, max: 12 },
      // reps step resolves to max(progressionStep, 2) = 2
      after: { sets: 1, min: 10, max: 14 },
    });

    const reasons = Object.fromEntries(result.skipped.map(entry => [entry.id, entry.reason]));
    expect(reasons.plank).toBe("performance stayed within target range");
    expect(reasons.breathing).toBe("progression disabled for this exercise");

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ exerciseKey: "pushups", direction: "up" });

    const pushups = result.nextStates.find(s => s.exerciseKey === "pushups");
    expect(pushups?.lastProgressionAt).toBe("2026-04-06");
  });

  it("adds a set instead of raising targets once the initial ceiling is reached", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      // Ceiling for pushups = template max 12 + step 2 = 14.
      states: defaultStates({ pushups: { currentTargetMin: 10, currentTargetMax: 14 } }),
      sessions: [
        session("2026-04-02", { pushups: [14], ...FULL_DAY }),
        session("2026-04-06", { pushups: [10], ...FULL_DAY }),
      ],
      now: NOW,
    });

    expect(result.changed[0]).toMatchObject({
      id: "pushups",
      direction: "up",
      before: { sets: 1, min: 10, max: 14 },
      after: { sets: 2, min: 10, max: 14 },
    });
  });

  it("keeps raising targets when sets are already at max_sets", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates({ pushups: { currentSets: 3, currentTargetMin: 10, currentTargetMax: 14 } }),
      sessions: [
        session("2026-04-02", { pushups: [14, 14, 14], ...FULL_DAY }),
        session("2026-04-06", { pushups: [10, 10, 10], ...FULL_DAY }),
      ],
      now: NOW,
    });

    expect(result.changed[0]).toMatchObject({
      id: "pushups",
      direction: "up",
      after: { sets: 3, min: 12, max: 16 },
    });
  });

  it("removes a set after two below-target sessions", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates({ pushups: { currentSets: 2 } }),
      sessions: [
        session("2026-04-02", { pushups: [5, 5], ...FULL_DAY }),
        session("2026-04-06", { pushups: [6, 5], ...FULL_DAY }),
      ],
      now: NOW,
    });

    expect(result.changed[0]).toMatchObject({
      id: "pushups",
      direction: "down",
      reason: "performed below target in 2 sessions",
      before: { sets: 2, min: 8, max: 12 },
      after: { sets: 1, min: 8, max: 12 },
    });
  });

  it("deloads the target range, floored at the template minimum, when already at one set", () => {
    const result = evaluateProgression({
      program: makeProgram(),
      states: defaultStates(),
      sessions: [
        session("2026-04-02", { pushups: [5], ...FULL_DAY }),
        session("2026-04-06", { pushups: [5], ...FULL_DAY }),
      ],
      now: NOW,
    });

    // deloadStep = 1: min floors at template min 8, max drops 12 -> 11.
    expect(result.changed[0]).toMatchObject({
      id: "pushups",
      direction: "down",
      after: { sets: 1, min: 8, max: 11 },
    });
  });

  it("reports exercises from untrained workouts as having no recent data", () => {
    const ROWS = exercise("rows", "reps", 8, 12, 3);
    const result = evaluateProgression({
      // Workout B on Saturday 2026-04-04 is planned (3 planned days total)
      // but only A sessions were logged.
      program: makeProgram({ B: [ROWS] }, { saturday: "B" }),
      states: new Map([...defaultStates(), state("rows")]),
      sessions: [
        session("2026-04-02", { pushups: [9], ...FULL_DAY }),
        session("2026-04-06", { pushups: [9], ...FULL_DAY }),
      ],
      now: NOW,
    });

    const reasons = Object.fromEntries(result.skipped.map(entry => [entry.id, entry.reason]));
    expect(reasons.rows).toBe("no recent session data");
  });

  it("skips exercises without a progression state", () => {
    const states = defaultStates();
    states.delete("plank");

    const result = evaluateProgression({
      program: makeProgram(),
      states,
      sessions: [
        session("2026-04-02", { pushups: [9], ...FULL_DAY }),
        session("2026-04-06", { pushups: [9], ...FULL_DAY }),
      ],
      now: NOW,
    });

    const reasons = Object.fromEntries(result.skipped.map(entry => [entry.id, entry.reason]));
    expect(reasons.plank).toBe("missing progression state");
  });
});
