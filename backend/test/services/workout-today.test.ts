import { afterEach, describe, expect, it, vi } from "vitest";
import { ExerciseProgressionState } from "../../src/domain/progression";
import { ProgramTemplate } from "../../src/domain/program";
import { ProgressionService } from "../../src/services/progression-service";
import { WorkoutService } from "../../src/services/workout-service";

function buildProgram(): ProgramTemplate {
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
}

function buildState(overrides: Partial<ExerciseProgressionState> = {}): ExerciseProgressionState {
  return {
    id: "eps_1",
    exerciseId: "exercise_push_up",
    catalogExerciseId: "catalog_push_up",
    exerciseKey: "push_up",
    currentSets: 1,
    currentTargetMin: 8,
    currentTargetMax: 10,
    lastProgressionAt: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("today progression freshness", () => {
  it("auto-refreshes today when the last progression run is stale", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T00:00:00.000Z"));

    const program = buildProgram();
    const currentState = buildState();
    const lifecycle = {
      ensureUserExists: vi.fn().mockResolvedValue(undefined),
    };
    const programs = {
      getProgramById: vi.fn().mockResolvedValue(program),
    };
    const runtime = {
      getByProgram: vi.fn().mockResolvedValue({
        programId: program.versionId,
        userId: "user_1",
        lastSessionLoggedAt: "2026-04-06T00:00:00.000Z",
        lastProgressionRunAt: "2026-04-01T00:00:00.000Z",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      }),
      initializeForProgram: vi.fn().mockResolvedValue(undefined),
      markProgressionRun: vi.fn().mockResolvedValue(undefined),
    };
    const progression = {
      getByProgram: vi.fn().mockResolvedValue(new Map([[currentState.exerciseKey, currentState]])),
      replaceProgramStates: vi.fn().mockResolvedValue(undefined),
      recordEvents: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = {
      listRecentPerformance: vi.fn().mockResolvedValue([
        {
          sessionDate: "2026-04-06",
          exercises: [{ exerciseKey: "push_up", catalogExerciseId: "catalog_push_up", sets: [10] }],
        },
      ]),
    };

    const service = new ProgressionService(
      lifecycle as never,
      programs as never,
      runtime as never,
      progression as never,
      sessions as never
    );

    const refreshed = await service.ensureFreshForToday("user_1", "demo@example.com", program.versionId);

    expect(refreshed).toBe(true);
    expect(lifecycle.ensureUserExists).toHaveBeenCalledWith("user_1", "demo@example.com");
    expect(progression.replaceProgramStates).toHaveBeenCalledOnce();
    expect(progression.recordEvents).toHaveBeenCalledOnce();
    expect(runtime.markProgressionRun).toHaveBeenCalledWith(
      "user_1",
      program.versionId,
      "2026-04-12T00:00:00.000Z"
    );

    const nextStates = progression.replaceProgramStates.mock.calls[0][2] as ExerciseProgressionState[];
    expect(nextStates[0]?.currentSets).toBe(1);
    expect(nextStates[0]?.currentTargetMin).toBe(10);
    expect(nextStates[0]?.currentTargetMax).toBe(12);
  });

  it("skips refresh when today progression is still fresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T00:00:00.000Z"));

    const program = buildProgram();
    const lifecycle = {
      ensureUserExists: vi.fn().mockResolvedValue(undefined),
    };
    const programs = {
      getProgramById: vi.fn(),
    };
    const runtime = {
      getByProgram: vi.fn().mockResolvedValue({
        programId: program.versionId,
        userId: "user_1",
        lastSessionLoggedAt: "2026-04-10T00:00:00.000Z",
        lastProgressionRunAt: "2026-04-10T00:00:00.000Z",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-10T00:00:00.000Z",
      }),
      initializeForProgram: vi.fn().mockResolvedValue(undefined),
      markProgressionRun: vi.fn().mockResolvedValue(undefined),
    };
    const progression = {
      getByProgram: vi.fn(),
      replaceProgramStates: vi.fn().mockResolvedValue(undefined),
      recordEvents: vi.fn().mockResolvedValue(undefined),
    };
    const sessions = {
      listRecentPerformance: vi.fn(),
    };

    const service = new ProgressionService(
      lifecycle as never,
      programs as never,
      runtime as never,
      progression as never,
      sessions as never
    );

    const refreshed = await service.ensureFreshForToday("user_1", "demo@example.com", program.versionId);

    expect(refreshed).toBe(false);
    expect(programs.getProgramById).not.toHaveBeenCalled();
    expect(progression.replaceProgramStates).not.toHaveBeenCalled();
    expect(progression.recordEvents).not.toHaveBeenCalled();
    expect(runtime.markProgressionRun).not.toHaveBeenCalled();
  });
});

describe("workout today service", () => {
  it("uses the current working sets for today and keeps max_sets as the ceiling", async () => {
    const program = buildProgram();
    const states = new Map([[ "push_up", buildState({ currentSets: 2 }) ]]);
    const lifecycle = {
      requireActiveProgram: vi.fn().mockResolvedValue(program),
    };
    const progression = {
      getByProgram: vi.fn().mockResolvedValue(states),
    };
    const progressionService = {
      ensureFreshForToday: vi.fn().mockResolvedValue(false),
    };

    const service = new WorkoutService(
      lifecycle as never,
      progression as never,
      progressionService as never
    );

    const result = await service.getWorkoutForDate("user_1", "demo@example.com", "2026-04-06");

    expect(progressionService.ensureFreshForToday).toHaveBeenCalledWith(
      "user_1",
      "demo@example.com",
      program.versionId
    );
    expect(result).toMatchObject({
      date: "2026-04-06",
      type: "A",
      name: "Workout A",
      exercises: [
        {
          id: "push_up",
          sets: 2,
          max_sets: 3,
          reps: { min: 8, max: 10 },
        },
      ],
      program_id: program.key,
      program_version_id: program.versionId,
    });
  });
});
