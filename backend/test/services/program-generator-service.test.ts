import { describe, expect, it, vi } from "vitest";
import { normalizeOnboardingAnswers } from "../../src/domain/profile";
import { AppError } from "../../src/lib/app-error";
import { ProgramGeneratorService } from "../../src/services/program-generator-service";
import { ONBOARDING_ANSWERS } from "../helpers/fixtures";

function buildCatalogEntries() {
  return [
    {
      id: "catalog_push_up",
      exerciseKey: "push_up",
      name: "Push Up",
      type: "reps" as const,
      category: "strength",
      difficulty: "beginner" as const,
      equipment: ["bodyweight"],
      workoutTags: ["strength", "upper", "push", "core", "balanced", "mobility", "recovery"],
      goalTags: ["strength", "muscle"],
      focusAreas: ["upper_body", "core"],
      contraindicationTags: [],
      experienceLevels: ["beginner", "intermediate", "advanced"],
      maxSets: 4,
      defaultTargetMin: 8,
      defaultTargetMax: 12,
      progressionEnabled: true,
      progressionStep: 1,
      deloadStep: 1,
      seedVersion: "seed-v1",
    },
    {
      id: "catalog_split_squat",
      exerciseKey: "split_squat",
      name: "Split Squat",
      type: "reps" as const,
      category: "strength",
      difficulty: "beginner" as const,
      equipment: ["bodyweight"],
      workoutTags: ["strength", "lower", "core", "balanced"],
      goalTags: ["strength", "muscle"],
      focusAreas: ["lower_body", "core"],
      contraindicationTags: [],
      experienceLevels: ["beginner", "intermediate", "advanced"],
      maxSets: 4,
      defaultTargetMin: 10,
      defaultTargetMax: 14,
      progressionEnabled: true,
      progressionStep: 1,
      deloadStep: 1,
      seedVersion: "seed-v1",
    },
    {
      id: "catalog_side_plank",
      exerciseKey: "side_plank",
      name: "Side Plank",
      type: "time" as const,
      category: "core",
      difficulty: "beginner" as const,
      equipment: ["bodyweight"],
      workoutTags: ["core", "balanced", "mobility", "recovery"],
      goalTags: ["general_fitness", "strength"],
      focusAreas: ["core"],
      contraindicationTags: [],
      experienceLevels: ["beginner", "intermediate", "advanced"],
      maxSets: 3,
      defaultTargetMin: 20,
      defaultTargetMax: 30,
      progressionEnabled: true,
      progressionStep: 5,
      deloadStep: 5,
      seedVersion: "seed-v1",
    },
    {
      id: "catalog_bird_dog",
      exerciseKey: "bird_dog",
      name: "Bird Dog",
      type: "cycles" as const,
      category: "mobility",
      difficulty: "beginner" as const,
      equipment: ["bodyweight"],
      workoutTags: ["mobility", "balanced", "recovery", "core"],
      goalTags: ["mobility", "general_fitness"],
      focusAreas: ["core", "mobility"],
      contraindicationTags: [],
      experienceLevels: ["beginner", "intermediate", "advanced"],
      maxSets: 3,
      defaultTargetMin: 2,
      defaultTargetMax: 4,
      progressionEnabled: false,
      progressionStep: 1,
      deloadStep: 1,
      seedVersion: "seed-v1",
    },
    {
      id: "catalog_dumbbell_press",
      exerciseKey: "dumbbell_press",
      name: "Dumbbell Press",
      type: "reps" as const,
      category: "strength",
      difficulty: "beginner" as const,
      equipment: ["dumbbells", "bench"],
      workoutTags: ["strength", "upper", "push"],
      goalTags: ["strength", "muscle"],
      focusAreas: ["upper_body"],
      contraindicationTags: [],
      experienceLevels: ["beginner", "intermediate", "advanced"],
      maxSets: 4,
      defaultTargetMin: 8,
      defaultTargetMax: 10,
      progressionEnabled: true,
      progressionStep: 1,
      deloadStep: 1,
      seedVersion: "seed-v1",
    },
  ];
}

function buildCreatedProgram() {
  return {
    versionId: "program_version_1",
    key: "generated_three_day_strength",
    name: "Strength Plan",
    source: "generated",
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
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
            id: "exercise_a_1",
            sortOrder: 0,
            maxSets: 4,
            targetMin: 8,
            targetMax: 12,
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
            id: "exercise_b_1",
            sortOrder: 0,
            maxSets: 4,
            targetMin: 10,
            targetMax: 14,
            exercise: {
              id: "exercise_split_squat",
              catalogExerciseId: "catalog_split_squat",
              key: "split_squat",
              name: "Split Squat",
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
            id: "exercise_c_1",
            sortOrder: 0,
            maxSets: 3,
            targetMin: 20,
            targetMax: 30,
            exercise: {
              id: "exercise_side_plank",
              catalogExerciseId: "catalog_side_plank",
              key: "side_plank",
              name: "Side Plank",
              type: "time" as const,
              progressionEnabled: true,
              progressionStep: 5,
              deloadStep: 5,
            },
          },
        ],
      },
    },
  };
}

function buildService() {
  const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);

  const lifecycle = {
    ensureUserExists: vi.fn().mockResolvedValue({
      user_id: "user_1",
      onboarding_completed_at: null,
    }),
  };
  const users = {
    markOnboardingCompleted: vi.fn().mockResolvedValue(undefined),
  };
  const onboarding = {
    getByUserId: vi.fn().mockResolvedValue({
      id: "onboarding_1",
      userId: "user_1",
    }),
  };
  const profiles = {
    getByUserId: vi.fn().mockResolvedValue({
      id: "profile_1",
      userId: "user_1",
      profile,
    }),
    upsert: vi.fn(),
  };
  const catalog = {
    listActiveEntries: vi.fn().mockResolvedValue(buildCatalogEntries()),
  };
  const programs = {
    getActiveProgram: vi.fn().mockResolvedValue(null),
    createProgramVersion: vi.fn().mockResolvedValue(buildCreatedProgram()),
  };
  const progression = {
    getByProgram: vi.fn().mockResolvedValue(new Map()),
    replaceProgramStates: vi.fn().mockResolvedValue(undefined),
  };
  const metadata = {
    save: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new ProgramGeneratorService(
      lifecycle as never,
      users as never,
      onboarding as never,
      profiles as never,
      catalog as never,
      programs as never,
      progression as never,
      metadata as never
    ),
    dependencies: {
      lifecycle,
      users,
      onboarding,
      profiles,
      catalog,
      programs,
      progression,
      metadata,
    },
  };
}

describe("program generator service step 2 compatibility", () => {
  it("builds a recommendation draft from the stored profile", async () => {
    const { service } = buildService();

    const result = await service.buildRecommendationDraftFromStoredProfile("user_1", "demo@example.com");

    expect(result.sourceOnboardingAnswerId).toBe("onboarding_1");
    expect(result.sourceProfileId).toBe("profile_1");
    expect(result.draft.selected_structure_id).toBe("3_day");
    expect(result.draft.exercise_slots.length).toBeGreaterThan(0);
  });

  it("keeps generateFromStoredProfile behavior compatible", async () => {
    const { service, dependencies } = buildService();

    const result = await service.generateFromStoredProfile("user_1", "demo@example.com", "onboarding-complete");

    expect(result.ok).toBe(true);
    expect(result.generator.version).toBe("generator-v1");
    expect(dependencies.programs.createProgramVersion).toHaveBeenCalledOnce();
    expect(dependencies.progression.replaceProgramStates).toHaveBeenCalledOnce();
    expect(dependencies.metadata.save).toHaveBeenCalledOnce();
    expect(dependencies.users.markOnboardingCompleted).toHaveBeenCalledWith("user_1");
  });

  it("rejects draft building when onboarding is incomplete", async () => {
    const { service, dependencies } = buildService();
    dependencies.onboarding.getByUserId.mockResolvedValueOnce(null);

    await expect(
      service.buildRecommendationDraftFromStoredProfile("user_1", "demo@example.com")
    ).rejects.toThrowError(AppError);
  });
});
