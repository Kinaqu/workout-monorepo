import { badRequest } from "../lib/app-error";
import { CatalogSelection, ExerciseCatalogEntry } from "./catalog";
import {
  DAY_NAMES,
  RecommendationDraftExerciseOption,
  RecommendationDraftExerciseSlot,
  RecommendationDraftJson,
  RecommendationDraftProfileSnapshot,
  RecommendationDraftStructure,
  RecommendationDraftStructureWorkout,
  validateRecommendationDraftJson,
} from "./recommendation-draft";
import { ProgramDefinitionInput, ProgramExerciseInput, ProgramWorkoutInput, validateProgramDefinition } from "./program";
import { NormalizedUserProfile } from "./profile";

export const GENERATOR_VERSION = "generator-v1";
const MAX_SLOT_OPTIONS = 3;

interface WorkoutBlueprint {
  key: string;
  name: string;
  tags: string[];
}

interface RankedCatalogEntry {
  entry: ExerciseCatalogEntry;
  score: number;
}

export interface GeneratedProgramResult {
  generatorVersion: string;
  catalogSeedVersion: string;
  definition: ProgramDefinitionInput;
}

export function buildStructureOptions(profile: NormalizedUserProfile): RecommendationDraftStructure[] {
  const candidates = buildTrainingDayCandidates(profile.trainingDaysPerWeek);
  return candidates.map(trainingDays => buildStructureOption(profile, trainingDays));
}

export function buildExerciseOptionsForStructure(
  profile: NormalizedUserProfile,
  catalog: CatalogSelection,
  structure: RecommendationDraftStructure
): RecommendationDraftExerciseSlot[] {
  const desiredCount = countDesiredExercises(profile);

  return structure.workouts.flatMap(workout => {
    const blueprint: WorkoutBlueprint = {
      key: workout.key,
      name: workout.name,
      tags: workout.tags,
    };
    const ranked = rankCatalogEntriesForBlueprint(catalog.exercises, blueprint, profile);
    const recommendedEntries = selectRecommendedEntriesForWorkout(ranked, desiredCount);

    return recommendedEntries.map((recommendedEntry, slotIndex) => {
      const options = buildSlotOptionsForRecommendedEntry(recommendedEntry, ranked, profile, MAX_SLOT_OPTIONS);
      const recommendedOption = options.find(option => option.recommended);
      if (!recommendedOption) {
        badRequest(`Missing recommended exercise option for slot ${workout.key}:${slotIndex}`);
      }

      return {
        slot_id: `${workout.key}:${slotIndex}`,
        workout_key: workout.key,
        workout_name: workout.name,
        slot_index: slotIndex,
        blueprint_tags: workout.tags,
        recommended_exercise_id: recommendedOption.exercise_id,
        selected_exercise_id: recommendedOption.exercise_id,
        options,
      } satisfies RecommendationDraftExerciseSlot;
    });
  });
}

export function buildRecommendationDraftFromProfile(
  profile: NormalizedUserProfile,
  catalog: CatalogSelection
): RecommendationDraftJson {
  const structures = buildStructureOptions(profile);
  const selectedStructure = structures.find(structure => structure.recommended);
  if (!selectedStructure) {
    badRequest("Generator could not determine a recommended structure");
  }

  const draft = {
    status: "draft",
    profile_snapshot: profileToRecommendationDraftSnapshot(profile),
    structures,
    selected_structure_id: selectedStructure.id,
    exercise_slots: buildExerciseOptionsForStructure(profile, catalog, selectedStructure),
    generator_version: GENERATOR_VERSION,
    catalog_seed_version: catalog.seedVersion,
  } satisfies RecommendationDraftJson;

  return validateRecommendationDraftJson(draft);
}

export function materializeProgramDefinitionFromDraftSelection(
  draft: RecommendationDraftJson
): GeneratedProgramResult {
  const validated = validateRecommendationDraftJson(draft);
  assertDraftMaterializationInvariants(validated);

  const selectedStructure = validated.structures.find(
    structure => structure.id === validated.selected_structure_id
  );
  if (!selectedStructure) {
    badRequest("Draft selected_structure_id does not resolve to a structure");
  }

  const workouts = Object.fromEntries(
    selectedStructure.workouts.map(workout => {
      const workoutSlots = validated.exercise_slots
        .filter(slot => slot.workout_key === workout.key)
        .sort((left, right) => left.slot_index - right.slot_index);

      const selectedExerciseIds = new Set<string>();
      const exercises = workoutSlots.map(slot => {
        const selectedOption = slot.options.find(
          option => option.exercise_id === slot.selected_exercise_id
        );
        if (!selectedOption) {
          badRequest(`Selected exercise missing for slot ${slot.slot_id}`);
        }
        if (selectedExerciseIds.has(selectedOption.exercise_id)) {
          badRequest(`Duplicate selected exercise '${selectedOption.exercise_id}' in workout '${workout.key}'`);
        }
        selectedExerciseIds.add(selectedOption.exercise_id);
        return draftOptionToProgramExercise(selectedOption);
      });

      return [
        workout.key,
        {
          name: workout.name,
          exercises,
        } satisfies ProgramWorkoutInput,
      ];
    })
  );

  const definition = validateProgramDefinition({
    id: `generated_${validated.profile_snapshot.splitPreference}_${validated.profile_snapshot.primaryGoal}`,
    name: buildProgramNameFromPrimaryGoal(validated.profile_snapshot.primaryGoal),
    schedule: selectedStructure.schedule,
    workouts,
  });

  return {
    generatorVersion: validated.generator_version,
    catalogSeedVersion: validated.catalog_seed_version,
    definition,
  };
}

export function generateProgramFromProfile(
  profile: NormalizedUserProfile,
  catalog: CatalogSelection
): GeneratedProgramResult {
  const draft = buildRecommendationDraftFromProfile(profile, catalog);
  return materializeProgramDefinitionFromDraftSelection(draft);
}

function buildProgramNameFromPrimaryGoal(primaryGoal: string): string {
  const goal = primaryGoal.replace(/_/g, " ");
  return `${goal.charAt(0).toUpperCase()}${goal.slice(1)} Plan`;
}

function profileToRecommendationDraftSnapshot(
  profile: NormalizedUserProfile
): RecommendationDraftProfileSnapshot {
  return {
    primaryGoal: profile.primaryGoal,
    experienceLevel: profile.experienceLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    splitPreference: profile.splitPreference,
    volumeLevel: profile.volumeLevel,
    equipmentAccess: [...profile.equipmentAccess],
    focusAreas: [...profile.focusAreas],
    limitationTags: [...profile.limitationTags],
    preferredStyles: [...profile.preferredStyles],
    preferredWorkoutTags: [...profile.preferredWorkoutTags],
    excludedWorkoutTags: [...profile.excludedWorkoutTags],
  };
}

function countDesiredExercises(profile: NormalizedUserProfile): number {
  if (profile.sessionDurationMinutes <= 30) {
    return 4;
  }
  if (profile.sessionDurationMinutes >= 55) {
    return 6;
  }
  return 5;
}

function buildTrainingDayCandidates(trainingDaysPerWeek: number): number[] {
  const candidatePool =
    trainingDaysPerWeek <= 2
      ? [2, 3]
      : trainingDaysPerWeek === 3
        ? [3, 2, 4]
        : [4, 3];

  return Array.from(new Set(candidatePool));
}

function buildStructureOption(
  profile: NormalizedUserProfile,
  trainingDays: number
): RecommendationDraftStructure {
  const blueprints = buildWorkoutBlueprintsForTrainingDays(profile, trainingDays);
  return {
    id: `${trainingDays}_day`,
    label: `${trainingDays}-day split`,
    description: buildStructureDescription(trainingDays),
    schedule: buildScheduleForTrainingDays(trainingDays, blueprints.map(item => item.key)),
    workouts: blueprints.map(
      blueprint =>
        ({
          key: blueprint.key,
          name: blueprint.name,
          tags: blueprint.tags,
        }) satisfies RecommendationDraftStructureWorkout
    ),
    recommended: isRecommendedStructure(profile.trainingDaysPerWeek, trainingDays),
  };
}

function isRecommendedStructure(profileTrainingDays: number, candidateTrainingDays: number): boolean {
  if (profileTrainingDays <= 2) {
    return candidateTrainingDays === 2;
  }
  if (profileTrainingDays === 3) {
    return candidateTrainingDays === 3;
  }
  return candidateTrainingDays === 4;
}

function buildStructureDescription(trainingDays: number): string {
  if (trainingDays <= 2) {
    return "Mon / Thu";
  }
  if (trainingDays === 3) {
    return "Mon / Wed / Fri";
  }
  return "Mon / Tue / Thu / Sat";
}

function buildWorkoutBlueprintsForTrainingDays(
  profile: NormalizedUserProfile,
  trainingDays: number
): WorkoutBlueprint[] {
  const base: WorkoutBlueprint[] =
    trainingDays <= 2
      ? [
          { key: "A", name: "Workout A", tags: ["strength", "upper", "push", "core"] },
          { key: "B", name: "Workout B", tags: ["strength", "lower", "mobility", "core"] },
        ]
      : trainingDays === 3
        ? [
            { key: "A", name: "Workout A", tags: ["strength", "upper", "push", "core"] },
            { key: "B", name: "Workout B", tags: ["strength", "lower", "core"] },
            { key: "C", name: "Workout C", tags: ["mobility", "balanced", "recovery"] },
          ]
        : [
            { key: "A", name: "Workout A", tags: ["strength", "upper", "push"] },
            { key: "B", name: "Workout B", tags: ["strength", "lower"] },
            { key: "C", name: "Workout C", tags: ["balanced", "core", "mobility"] },
            { key: "D", name: "Workout D", tags: ["balanced", "lower", "mobility"] },
          ];

  return base.map(item => ({
    ...item,
    tags: Array.from(new Set([...item.tags, ...profile.preferredWorkoutTags])).sort(),
  }));
}

function buildScheduleForTrainingDays(
  trainingDays: number,
  workoutKeys: string[]
): RecommendationDraftStructure["schedule"] {
  const schedule = Object.fromEntries(DAY_NAMES.map(day => [day, "rest"])) as RecommendationDraftStructure["schedule"];

  if (trainingDays <= 2) {
    schedule.monday = workoutKeys[0] ?? "rest";
    schedule.thursday = workoutKeys[1] ?? "rest";
    return schedule;
  }

  if (trainingDays === 3) {
    schedule.monday = workoutKeys[0] ?? "rest";
    schedule.wednesday = workoutKeys[1] ?? "rest";
    schedule.friday = workoutKeys[2] ?? "rest";
    return schedule;
  }

  schedule.monday = workoutKeys[0] ?? "rest";
  schedule.tuesday = workoutKeys[1] ?? "rest";
  schedule.thursday = workoutKeys[2] ?? "rest";
  schedule.saturday = workoutKeys[3] ?? workoutKeys[2] ?? "rest";
  return schedule;
}

function rankCatalogEntriesForBlueprint(
  catalog: ExerciseCatalogEntry[],
  blueprint: WorkoutBlueprint,
  profile: NormalizedUserProfile
): RankedCatalogEntry[] {
  return catalog
    .map(entry => ({
      entry,
      score: scoreEntry(entry, blueprint, profile),
    }))
    .sort((left, right) => right.score - left.score || left.entry.exerciseKey.localeCompare(right.entry.exerciseKey));
}

function selectRecommendedEntriesForWorkout(
  rankedEntries: RankedCatalogEntry[],
  desiredCount: number
): ExerciseCatalogEntry[] {
  const pool = rankedEntries.length > 0 ? rankedEntries : [];
  return pool.slice(0, desiredCount).map(item => item.entry);
}

function scoreEntry(
  entry: ExerciseCatalogEntry,
  blueprint: WorkoutBlueprint,
  profile: NormalizedUserProfile
): number {
  let score = 0;

  for (const tag of blueprint.tags) {
    if (entry.workoutTags.includes(tag)) {
      score += 20;
    }
  }

  if (entry.goalTags.includes(profile.primaryGoal)) {
    score += 18;
  }

  for (const area of profile.focusAreas) {
    if (entry.focusAreas.includes(area)) {
      score += 8;
    }
  }

  if (profile.preferredStyles.includes("low_impact") && entry.workoutTags.includes("low_impact")) {
    score += 6;
  }

  if (profile.primaryGoal === "mobility" && entry.category === "mobility") {
    score += 12;
  }

  return score;
}

function adjustTargets(
  entry: ExerciseCatalogEntry,
  profile: NormalizedUserProfile
): { targetMin: number; targetMax: number; maxSets: number } {
  const difficultyOffset =
    profile.experienceLevel === "advanced" ? 2 : profile.experienceLevel === "intermediate" ? 1 : 0;
  const goalOffset = profile.primaryGoal === "strength" ? 0 : profile.primaryGoal === "muscle" ? 1 : 0;
  const timeOffset = entry.type === "time" ? difficultyOffset * 5 : difficultyOffset + goalOffset;
  const setAdjustment = profile.volumeLevel === "high" ? 0 : profile.volumeLevel === "low" ? -1 : 0;

  return {
    targetMin: Math.max(1, entry.defaultTargetMin + timeOffset),
    targetMax: Math.max(entry.defaultTargetMin + timeOffset, entry.defaultTargetMax + timeOffset),
    maxSets: Math.max(1, entry.maxSets + setAdjustment),
  };
}

function buildSlotOptionsForRecommendedEntry(
  recommendedEntry: ExerciseCatalogEntry,
  rankedEntries: RankedCatalogEntry[],
  profile: NormalizedUserProfile,
  maxOptions: number
): RecommendationDraftExerciseOption[] {
  const sameTypeEntries = rankedEntries
    .filter(item => item.entry.type === recommendedEntry.type)
    .map(item => item.entry);

  const orderedEntries = [
    recommendedEntry,
    ...sameTypeEntries.filter(entry => entry.exerciseKey !== recommendedEntry.exerciseKey),
  ];

  const uniqueEntries = Array.from(
    new Map(orderedEntries.map(entry => [entry.exerciseKey, entry])).values()
  ).slice(0, maxOptions);

  return uniqueEntries.map(entry =>
    buildExerciseOption(entry, profile, entry.exerciseKey === recommendedEntry.exerciseKey)
  );
}

function buildExerciseOption(
  entry: ExerciseCatalogEntry,
  profile: NormalizedUserProfile,
  recommended: boolean
): RecommendationDraftExerciseOption {
  const adjustments = adjustTargets(entry, profile);
  return {
    catalog_exercise_id: entry.id,
    exercise_id: entry.exerciseKey,
    name: entry.name,
    type: entry.type,
    target_min: adjustments.targetMin,
    target_max: adjustments.targetMax,
    max_sets: adjustments.maxSets,
    recommended,
  };
}

function draftOptionToProgramExercise(option: RecommendationDraftExerciseOption): ProgramExerciseInput {
  const range = {
    min: option.target_min,
    max: option.target_max,
  };

  if (option.type === "reps") {
    return {
      id: option.exercise_id,
      name: option.name,
      type: option.type,
      max_sets: option.max_sets,
      catalogExerciseId: option.catalog_exercise_id,
      reps: range,
    };
  }

  if (option.type === "time") {
    return {
      id: option.exercise_id,
      name: option.name,
      type: option.type,
      max_sets: option.max_sets,
      catalogExerciseId: option.catalog_exercise_id,
      duration: range,
    };
  }

  return {
    id: option.exercise_id,
    name: option.name,
    type: option.type,
    max_sets: option.max_sets,
    catalogExerciseId: option.catalog_exercise_id,
    cycles: range,
  };
}

function assertDraftMaterializationInvariants(draft: RecommendationDraftJson): void {
  const selectedStructure = draft.structures.find(structure => structure.id === draft.selected_structure_id);
  if (!selectedStructure) {
    badRequest("Draft selected structure is missing");
  }

  for (const workout of selectedStructure.workouts) {
    const slotCount = draft.exercise_slots.filter(slot => slot.workout_key === workout.key).length;
    if (slotCount === 0) {
      badRequest(`Draft selected structure workout '${workout.key}' has no exercise slots`);
    }
  }
}
