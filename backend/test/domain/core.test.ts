import { describe, expect, it } from "vitest";
import { filterCatalogForProfile } from "../../src/domain/catalog";
import { generateProgramFromProfile } from "../../src/domain/generator";
import { validateOnboardingAnswers, validateOnboardingDraft } from "../../src/domain/onboarding";
import { normalizeOnboardingAnswers } from "../../src/domain/profile";
import { evaluateProgression, seedProgressionStates } from "../../src/domain/progression";
import { createProgramDraft, validateProgramDefinition } from "../../src/domain/program";
import { parseLogText } from "../../src/domain/session";
import { AppError } from "../../src/lib/app-error";
import { isValidDate } from "../../src/lib/time";
import { ONBOARDING_ANSWERS } from "../helpers/fixtures";

describe("date validation", () => {
  it("rejects calendar-invalid ISO dates", () => {
    expect(isValidDate("2026-02-28")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-04-31")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
  });
});

describe("onboarding validation", () => {
  it("normalizes draft arrays and defaults questionnaire version", () => {
    expect(
      validateOnboardingDraft({
        goals: ["muscle", "strength", "muscle"],
        equipmentAccess: ["bands", "bodyweight", "bands"],
      })
    ).toEqual({
      questionnaireVersion: "onboarding-v1",
      goals: ["muscle", "strength"],
      equipmentAccess: ["bands", "bodyweight"],
    });
  });

  it("rejects incomplete completion payloads", () => {
    expect(() =>
      validateOnboardingAnswers({
        questionnaireVersion: "onboarding-v1",
        goals: ["strength"],
      })
    ).toThrowError(AppError);
  });
});

describe("profile and catalog", () => {
  it("derives normalized profile and filters catalog compatibly", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
    expect(profile.primaryGoal).toBe("strength");
    expect(profile.splitPreference).toBe("three_day");
    expect(profile.preferredWorkoutTags).toContain("strength");

    const selection = filterCatalogForProfile(
      [
        {
          id: "catalog_push_up",
          exerciseKey: "push_up",
          name: "Push Up",
          type: "reps",
          category: "strength",
          difficulty: "beginner",
          equipment: ["bodyweight"],
          workoutTags: ["strength", "upper", "push"],
          goalTags: ["strength"],
          focusAreas: ["upper_body", "core"],
          contraindicationTags: [],
          experienceLevels: ["beginner", "intermediate"],
          maxSets: 4,
          defaultTargetMin: 8,
          defaultTargetMax: 12,
          progressionEnabled: true,
          progressionStep: 1,
          deloadStep: 1,
          seedVersion: "seed-v1",
        },
        {
          id: "catalog_pull_up",
          exerciseKey: "pull_up",
          name: "Pull Up",
          type: "reps",
          category: "strength",
          difficulty: "advanced",
          equipment: ["pullup_bar"],
          workoutTags: ["strength", "upper"],
          goalTags: ["strength"],
          focusAreas: ["upper_body"],
          contraindicationTags: [],
          experienceLevels: ["advanced"],
          maxSets: 4,
          defaultTargetMin: 4,
          defaultTargetMax: 8,
          progressionEnabled: true,
          progressionStep: 1,
          deloadStep: 1,
          seedVersion: "seed-v2",
        },
      ],
      profile
    );

    expect(selection.exercises).toHaveLength(1);
    expect(selection.exercises[0]?.exerciseKey).toBe("push_up");
    expect(selection.seedVersion).toBe("seed-v1");
  });
});

describe("program generation and validation", () => {
  it("generates deterministic plans from the same profile and catalog", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
    const catalog = {
      seedVersion: "seed-v1",
      exercises: Array.from({ length: 6 }, (_, index) => ({
        id: `catalog_${index}`,
        exerciseKey: `exercise_${index}`,
        name: `Exercise ${index}`,
        type: index === 5 ? "time" : "reps",
        category: "strength",
        difficulty: "beginner" as const,
        equipment: ["bodyweight"],
        workoutTags: ["strength", "upper", "push", "core", "balanced", "recovery", "mobility"],
        goalTags: ["strength"],
        focusAreas: ["upper_body", "core"],
        contraindicationTags: [],
        experienceLevels: ["beginner", "intermediate", "advanced"],
        maxSets: 4,
        defaultTargetMin: index === 5 ? 20 : 8,
        defaultTargetMax: index === 5 ? 30 : 12,
        progressionEnabled: true,
        progressionStep: index === 5 ? 5 : 1,
        deloadStep: index === 5 ? 5 : 1,
        seedVersion: "seed-v1",
      })),
    };

    const left = generateProgramFromProfile(profile, catalog);
    const right = generateProgramFromProfile(profile, catalog);

    expect(left).toEqual(right);
    expect(left.definition.schedule.monday).toBe("A");
    expect(Object.keys(left.definition.workouts)).toEqual(["A", "B", "C"]);
  });

  it("rejects schedule references to unknown workouts", () => {
    const definition = validateProgramDefinition({
      id: "program",
      name: "Program",
      schedule: {
        monday: "A",
        tuesday: "rest",
        wednesday: "rest",
        thursday: "rest",
        friday: "rest",
        saturday: "rest",
        sunday: "rest",
      },
      workouts: {},
    });

    expect(() => createProgramDraft(definition)).toThrowError(AppError);
  });
});

describe("log parsing and progression", () => {
  function buildWeeklyProgressionProgram() {
    return {
      versionId: "program_1",
      key: "program",
      name: "Program",
      source: "generated",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      schedule: {
        monday: "A",
        tuesday: null,
        wednesday: "B",
        thursday: null,
        friday: "C",
        saturday: null,
        sunday: null,
      },
      workouts: {
        A: {
          id: "workout_a",
          key: "A",
          name: "Workout A",
          sortOrder: 0,
          exercises: [
            {
              id: "wex_a_1",
              sortOrder: 0,
              maxSets: 3,
              targetMin: 8,
              targetMax: 10,
              exercise: {
                id: "exercise_push_up",
                catalogExerciseId: "catalog_push_up",
                key: "push_up",
                name: "Push Up",
                type: "reps" as const,
                progressionEnabled: true,
                progressionStep: 1,
                deloadStep: 1,
              },
            },
          ],
        },
        B: {
          id: "workout_b",
          key: "B",
          name: "Workout B",
          sortOrder: 1,
          exercises: [
            {
              id: "wex_b_1",
              sortOrder: 0,
              maxSets: 3,
              targetMin: 8,
              targetMax: 10,
              exercise: {
                id: "exercise_push_up_b",
                catalogExerciseId: "catalog_push_up",
                key: "push_up",
                name: "Push Up",
                type: "reps" as const,
                progressionEnabled: true,
                progressionStep: 1,
                deloadStep: 1,
              },
            },
          ],
        },
        C: {
          id: "workout_c",
          key: "C",
          name: "Workout C",
          sortOrder: 2,
          exercises: [
            {
              id: "wex_c_1",
              sortOrder: 0,
              maxSets: 3,
              targetMin: 8,
              targetMax: 10,
              exercise: {
                id: "exercise_push_up_c",
                catalogExerciseId: "catalog_push_up",
                key: "push_up",
                name: "Push Up",
                type: "reps" as const,
                progressionEnabled: true,
                progressionStep: 1,
                deloadStep: 1,
              },
            },
          ],
        },
      },
    };
  }

  it("parses legacy text logs into exercises, notes, and unmatched lines", () => {
    const program = {
      versionId: "program_1",
      key: "program",
      name: "Program",
      source: "generated",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      schedule: {
        monday: "A",
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      },
      workouts: {
        A: {
          id: "workout_a",
          key: "A",
          name: "Workout A",
          sortOrder: 0,
          exercises: [
            {
              id: "wex_1",
              sortOrder: 0,
              maxSets: 4,
              targetMin: 8,
              targetMax: 12,
              exercise: {
                id: "exercise_1",
                catalogExerciseId: "catalog_1",
                key: "push_up",
                name: "Push Up",
                type: "reps",
                progressionEnabled: true,
                progressionStep: 1,
                deloadStep: 1,
              },
            },
          ],
        },
      },
    };

    const parsed = parseLogText("Push Up 10 11\nNeed better tempo\nUnknown 5", program);
    expect(parsed.exercises).toEqual([{ id: "push_up", name: "Push Up", sets: [10, 11] }]);
    expect(parsed.note).toBe("Need better tempo");
    expect(parsed.unmatched).toEqual(["Unknown 5"]);
  });

  it("requires at least half of planned workouts to be completed before increasing load", () => {
    const program = buildWeeklyProgressionProgram();
    const states = seedProgressionStates(program, new Map(), "2026-04-01T00:00:00.000Z", null);
    const targetExercise = states[0];
    expect(targetExercise).toBeDefined();

    const result = evaluateProgression({
      program,
      states: new Map(states.map(state => [state.exerciseKey, state])),
      sessions: [
        {
          sessionDate: "2026-04-06",
          exercises: [{ exerciseKey: "push_up", catalogExerciseId: "catalog_push_up", sets: [10] }],
        },
      ],
      now: "2026-04-12T00:00:00.000Z",
      lookbackDays: 7,
    });

    expect(result.changed).toHaveLength(0);
    expect(result.skipped[0]?.reason).toContain("completed 1/3 planned workouts");
  });

  it("progresses weekly when at least half of planned workouts are fully completed", () => {
    const program = buildWeeklyProgressionProgram();

    const states = seedProgressionStates(program, new Map(), "2026-04-01T00:00:00.000Z", null);
    const targetExercise = states[0];
    expect(targetExercise).toBeDefined();

    const result = evaluateProgression({
      program,
      states: new Map(states.map(state => [state.exerciseKey, state])),
      sessions: [
        {
          sessionDate: "2026-04-06",
          exercises: [{ exerciseKey: targetExercise.exerciseKey, catalogExerciseId: targetExercise.catalogExerciseId, sets: [10] }],
        },
        {
          sessionDate: "2026-04-08",
          exercises: [{ exerciseKey: targetExercise.exerciseKey, catalogExerciseId: targetExercise.catalogExerciseId, sets: [11] }],
        },
      ],
      now: "2026-04-12T00:00:00.000Z",
      lookbackDays: 7,
    });

    expect(result.changed[0]?.id).toBe(targetExercise.exerciseKey);
    expect(result.changed[0]?.after.min).toBe(targetExercise.currentTargetMin + 2);
    expect(result.changed[0]?.after.max).toBe(targetExercise.currentTargetMax + 2);
    expect(result.events.length).toBeGreaterThan(0);
  });
});
