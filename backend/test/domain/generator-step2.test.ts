import { describe, expect, it } from "vitest";
import { CatalogSelection } from "../../src/domain/catalog";
import {
  buildExerciseOptionsForStructure,
  buildRecommendationDraftFromProfile,
  buildStructureOptions,
  generateProgramFromProfile,
  materializeProgramDefinitionFromDraftSelection,
} from "../../src/domain/generator";
import { validateProgramDefinition } from "../../src/domain/program";
import { normalizeOnboardingAnswers } from "../../src/domain/profile";
import { validateRecommendationDraftJson } from "../../src/domain/recommendation-draft";
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
        workoutTags: ["strength", "upper", "push", "core"],
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
        workoutTags: ["strength", "lower"],
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
        id: "catalog_rdl",
        exerciseKey: "romanian_deadlift",
        name: "Romanian Deadlift",
        type: "reps",
        category: "strength",
        difficulty: "intermediate",
        equipment: ["dumbbells"],
        workoutTags: ["strength", "lower"],
        goalTags: ["strength", "muscle"],
        focusAreas: ["lower_body"],
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
        id: "catalog_dead_bug",
        exerciseKey: "dead_bug",
        name: "Dead Bug",
        type: "cycles",
        category: "core",
        difficulty: "beginner",
        equipment: ["bodyweight"],
        workoutTags: ["core", "balanced", "recovery"],
        goalTags: ["general_fitness", "strength"],
        focusAreas: ["core"],
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
        id: "catalog_side_plank",
        exerciseKey: "side_plank",
        name: "Side Plank",
        type: "time",
        category: "core",
        difficulty: "beginner",
        equipment: ["bodyweight"],
        workoutTags: ["core", "balanced", "mobility"],
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
        defaultTargetMax: 3,
        progressionEnabled: false,
        progressionStep: 1,
        deloadStep: 1,
        seedVersion: "seed-v1",
      },
      {
        id: "catalog_mobility_flow",
        exerciseKey: "mobility_flow",
        name: "Mobility Flow",
        type: "time",
        category: "mobility",
        difficulty: "beginner",
        equipment: ["bodyweight"],
        workoutTags: ["mobility", "balanced", "recovery"],
        goalTags: ["mobility", "general_fitness"],
        focusAreas: ["mobility"],
        contraindicationTags: [],
        experienceLevels: ["beginner", "intermediate", "advanced"],
        maxSets: 3,
        defaultTargetMin: 30,
        defaultTargetMax: 45,
        progressionEnabled: true,
        progressionStep: 5,
        deloadStep: 5,
        seedVersion: "seed-v1",
      },
    ],
  };
}

describe("step 2 generator helpers", () => {
  it("builds deterministic structure options with one recommended entry", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);

    const left = buildStructureOptions(profile);
    const right = buildStructureOptions(profile);

    expect(left).toEqual(right);
    expect(left.map(option => option.id)).toEqual(["3_day", "2_day", "4_day"]);
    expect(left.filter(option => option.recommended)).toHaveLength(1);
    expect(left.find(option => option.recommended)?.id).toBe("3_day");
  });

  it("builds slot options with same-type alternatives only", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
    const structure = buildStructureOptions(profile)[0]!;
    const slots = buildExerciseOptionsForStructure(profile, buildCatalog(), structure);

    expect(slots.length).toBeGreaterThan(0);

    for (const slot of slots) {
      const optionTypes = new Set(slot.options.map(option => option.type));
      expect(optionTypes.size).toBe(1);
      expect(slot.options.some(option => option.exercise_id === slot.recommended_exercise_id)).toBe(true);
      expect(slot.options.some(option => option.exercise_id === slot.selected_exercise_id)).toBe(true);
    }
  });

  it("builds a valid draft and materializes a valid program definition", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
    const catalog = buildCatalog();

    const draft = buildRecommendationDraftFromProfile(profile, catalog);
    const validatedDraft = validateRecommendationDraftJson(draft);
    const generated = materializeProgramDefinitionFromDraftSelection(validatedDraft);

    expect(validatedDraft.selected_structure_id).toBe("3_day");
    expect(validatedDraft.exercise_slots.every(slot => ["A", "B", "C"].includes(slot.workout_key))).toBe(true);
    expect(validateProgramDefinition(generated.definition)).toEqual(generated.definition);
    expect(Object.keys(generated.definition.workouts)).toEqual(["A", "B", "C"]);
  });

  it("keeps generateProgramFromProfile aligned with draft materialization", () => {
    const profile = normalizeOnboardingAnswers(ONBOARDING_ANSWERS);
    const catalog = buildCatalog();

    const draft = buildRecommendationDraftFromProfile(profile, catalog);
    const viaDraft = materializeProgramDefinitionFromDraftSelection(draft);
    const viaWrapper = generateProgramFromProfile(profile, catalog);

    expect(viaWrapper).toEqual(viaDraft);
  });
});
