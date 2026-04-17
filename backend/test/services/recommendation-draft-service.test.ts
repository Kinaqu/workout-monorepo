import { describe, expect, it, vi } from "vitest";
import { CatalogSelection } from "../../src/domain/catalog";
import { buildRecommendationDraftFromProfile } from "../../src/domain/generator";
import { normalizeOnboardingAnswers } from "../../src/domain/profile";
import { AppError } from "../../src/lib/app-error";
import { RecommendationDraftService } from "../../src/services/recommendation-draft-service";
import { ONBOARDING_ANSWERS } from "../helpers/fixtures";

function buildCatalog(): CatalogSelection {
  return {
    seedVersion: "seed-v1",
    exercises: [
      {
        id: "catalog_push_up",
        exerciseKey: "push_up",
        name: "Push Up",
        type: "reps",
        category: "strength",
        difficulty: "beginner",
        equipment: ["bodyweight"],
        workoutTags: ["strength", "upper", "push", "core", "balanced"],
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
        id: "catalog_db_press",
        exerciseKey: "dumbbell_press",
        name: "Dumbbell Press",
        type: "reps",
        category: "strength",
        difficulty: "beginner",
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
      {
        id: "catalog_split_squat",
        exerciseKey: "split_squat",
        name: "Split Squat",
        type: "reps",
        category: "strength",
        difficulty: "beginner",
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
        type: "time",
        category: "core",
        difficulty: "beginner",
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
        type: "cycles",
        category: "mobility",
        difficulty: "beginner",
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
    ],
  };
}

function buildDraftRecord() {
  const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
  const draft = buildRecommendationDraftFromProfile(profile, buildCatalog());

  return {
    id: "rd_1",
    userId: "user_1",
    status: "draft" as const,
    sourceOnboardingAnswerId: "onboarding_1",
    sourceProfileId: "profile_1",
    generatorVersion: draft.generator_version,
    catalogSeedVersion: draft.catalog_seed_version,
    selectedStructureId: draft.selected_structure_id,
    draftJson: draft,
    activatedProgramId: null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
    activatedAt: null,
  };
}

function buildActivatedDraftRecord() {
  const base = buildDraftRecord();
  return {
    ...base,
    status: "activated" as const,
    activatedProgramId: "program_2",
    activatedAt: "2026-04-17T12:00:00.000Z",
    updatedAt: "2026-04-17T12:00:00.000Z",
    draftJson: {
      ...base.draftJson,
      status: "activated" as const,
      activation_context: {
        activated_program_id: "program_2",
        activated_at: "2026-04-17T12:00:00.000Z",
      },
    },
  };
}

function buildCreatedProgram() {
  return {
    versionId: "program_2",
    key: "generated_three_day_strength",
    name: "Strength Plan",
    source: "generated",
    createdAt: "2026-04-17T12:00:00.000Z",
    updatedAt: "2026-04-17T12:00:00.000Z",
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
        exercises: [],
      },
      B: {
        id: "workout_b",
        key: "B",
        name: "Workout B",
        sortOrder: 1,
        exercises: [],
      },
      C: {
        id: "workout_c",
        key: "C",
        name: "Workout C",
        sortOrder: 2,
        exercises: [],
      },
    },
  };
}

function buildService(overrides: Partial<ReturnType<typeof buildDependencies>> = {}) {
  const dependencies = {
    ...buildDependencies(),
    ...overrides,
  };

  return {
    service: new RecommendationDraftService(
      dependencies.lifecycle as never,
      dependencies.programGenerator as never,
      dependencies.recommendationDrafts as never,
      dependencies.catalog as never,
      dependencies.programs as never,
      dependencies.metadata as never
    ),
    dependencies,
  };
}

function buildDependencies() {
  return {
    lifecycle: {
      ensureUserExists: vi.fn().mockResolvedValue(undefined),
    },
    programGenerator: {
      buildRecommendationDraftFromStoredProfile: vi.fn(),
      persistGeneratedProgramVersion: vi.fn(),
    },
    recommendationDrafts: {
      getByUserId: vi.fn(),
      upsert: vi.fn(),
      updateDraft: vi.fn(),
      markActivated: vi.fn(),
    },
    catalog: {
      listActiveEntries: vi.fn().mockResolvedValue(buildCatalog().exercises),
    },
    programs: {
      getProgramById: vi.fn(),
    },
    metadata: {
      getLatestByRecommendationDraftId: vi.fn().mockResolvedValue(null),
    },
  };
}

describe("recommendation draft service", () => {
  it("creates a draft from the stored profile and persists it", async () => {
    const draftRecord = buildDraftRecord();
    const { service, dependencies } = buildService();
    dependencies.programGenerator.buildRecommendationDraftFromStoredProfile.mockResolvedValue({
      sourceOnboardingAnswerId: draftRecord.sourceOnboardingAnswerId,
      sourceProfileId: draftRecord.sourceProfileId,
      draft: draftRecord.draftJson,
    });
    dependencies.recommendationDrafts.upsert.mockResolvedValue(draftRecord);

    const result = await service.createFromStoredProfile("user_1", "demo@example.com");

    expect(result.id).toBe("rd_1");
    expect(dependencies.recommendationDrafts.upsert).toHaveBeenCalledOnce();
  });

  it("chooses a valid alternative structure and rebuilds slots", async () => {
    const draftRecord = buildDraftRecord();
    const alternative = draftRecord.draftJson.structures.find(structure => structure.id === "2_day");
    const updatedRecord = {
      ...draftRecord,
      selectedStructureId: "2_day",
      draftJson: {
        ...draftRecord.draftJson,
        selected_structure_id: "2_day",
      },
    };
    const { service, dependencies } = buildService();
    dependencies.recommendationDrafts.getByUserId.mockResolvedValue(draftRecord);
    dependencies.recommendationDrafts.updateDraft.mockResolvedValue(updatedRecord);

    const result = await service.chooseStructure("user_1", "demo@example.com", "rd_1", "2_day");

    expect(result.selected_structure_id).toBe("2_day");
    expect(alternative).toBeDefined();
    expect(dependencies.recommendationDrafts.updateDraft).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        selectedStructureId: "2_day",
        draftJson: expect.objectContaining({
          selected_structure_id: "2_day",
        }),
      })
    );
  });

  it("rejects replacement when the exercise is not available for the slot", async () => {
    const draftRecord = buildDraftRecord();
    const { service, dependencies } = buildService();
    dependencies.recommendationDrafts.getByUserId.mockResolvedValue(draftRecord);

    await expect(
      service.replaceExercise("user_1", "demo@example.com", "rd_1", draftRecord.draftJson.exercise_slots[0]!.slot_id, "missing")
    ).rejects.toThrowError(AppError);
  });

  it("activates a valid draft into a normal program version", async () => {
    const draftRecord = buildDraftRecord();
    const activatedDraft = buildActivatedDraftRecord();
    const createdProgram = buildCreatedProgram();
    const { service, dependencies } = buildService();
    dependencies.recommendationDrafts.getByUserId.mockResolvedValue(draftRecord);
    dependencies.programGenerator.persistGeneratedProgramVersion.mockResolvedValue(createdProgram);
    dependencies.recommendationDrafts.markActivated.mockResolvedValue(activatedDraft);

    const result = await service.activateDraft("user_1", "demo@example.com", "rd_1");

    expect(result.ok).toBe(true);
    expect(result.program.version_id).toBe("program_2");
    expect(dependencies.programGenerator.persistGeneratedProgramVersion).toHaveBeenCalledOnce();
    expect(dependencies.recommendationDrafts.markActivated).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        activatedProgramId: "program_2",
      })
    );
  });

  it("returns an idempotent success for an already activated draft", async () => {
    const activatedDraft = buildActivatedDraftRecord();
    const createdProgram = buildCreatedProgram();
    const { service, dependencies } = buildService();
    dependencies.recommendationDrafts.getByUserId.mockResolvedValue(activatedDraft);
    dependencies.programs.getProgramById.mockResolvedValue(createdProgram);

    const result = await service.activateDraft("user_1", "demo@example.com", "rd_1");

    expect(result.recommendation_draft.activated_program_id).toBe("program_2");
    expect(dependencies.programGenerator.persistGeneratedProgramVersion).not.toHaveBeenCalled();
  });
});
