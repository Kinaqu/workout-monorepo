import { CatalogSelection, ExerciseCatalogEntry, catalogEntryToProgramExercise } from "./catalog";
import { ProgramDefinitionInput, ProgramWorkoutInput } from "./program";
import { NormalizedUserProfile } from "./profile";

export const GENERATOR_VERSION = "generator-v1";

interface WorkoutBlueprint {
  key: string;
  name: string;
  tags: string[];
}

export interface GeneratedProgramResult {
  generatorVersion: string;
  catalogSeedVersion: string;
  definition: ProgramDefinitionInput;
}

export function generateProgramFromProfile(
  profile: NormalizedUserProfile,
  catalog: CatalogSelection
): GeneratedProgramResult {
  const blueprint = buildWorkoutBlueprints(profile);
  const workouts = Object.fromEntries(
    blueprint.map(item => [item.key, buildWorkout(item, catalog.exercises, profile)])
  );

  return {
    generatorVersion: GENERATOR_VERSION,
    catalogSeedVersion: catalog.seedVersion,
    definition: {
      id: `generated_${profile.splitPreference}_${profile.primaryGoal}`,
      name: buildProgramName(profile),
      schedule: buildSchedule(profile.trainingDaysPerWeek, blueprint.map(item => item.key)),
      workouts,
    },
  };
}

function buildProgramName(profile: NormalizedUserProfile): string {
  const goal = profile.primaryGoal.replace(/_/g, " ");
  return `${goal.charAt(0).toUpperCase()}${goal.slice(1)} Plan`;
}

function buildWorkoutBlueprints(profile: NormalizedUserProfile): WorkoutBlueprint[] {
  const base: WorkoutBlueprint[] =
    profile.trainingDaysPerWeek <= 2
      ? [
          { key: "A", name: "Workout A", tags: ["strength", "upper", "push", "core"] },
          { key: "B", name: "Workout B", tags: ["strength", "lower", "mobility", "core"] },
        ]
      : profile.trainingDaysPerWeek === 3
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

function buildWorkout(
  blueprint: WorkoutBlueprint,
  catalog: ExerciseCatalogEntry[],
  profile: NormalizedUserProfile
): ProgramWorkoutInput {
  const desiredCount = profile.sessionDurationMinutes <= 30 ? 4 : profile.sessionDurationMinutes >= 55 ? 6 : 5;
  const ranked = catalog
    .map(entry => ({
      entry,
      score: scoreEntry(entry, blueprint, profile),
    }))
    .sort((left, right) => right.score - left.score || left.entry.exerciseKey.localeCompare(right.entry.exerciseKey));

  const pool = ranked.length > 0 ? ranked : catalog.map(entry => ({ entry, score: 0 }));
  const selected = pool.slice(0, desiredCount).map(item => {
    const adjustments = adjustTargets(item.entry, profile);
    return catalogEntryToProgramExercise(item.entry, adjustments);
  });

  return {
    name: blueprint.name,
    exercises: selected,
  };
}

function scoreEntry(entry: ExerciseCatalogEntry, blueprint: WorkoutBlueprint, profile: NormalizedUserProfile): number {
  let score = 0;

  for (const tag of blueprint.tags) {
    if (entry.workoutTags.includes(tag)) score += 20;
  }

  if (entry.goalTags.includes(profile.primaryGoal)) {
    score += 18;
  }

  for (const area of profile.focusAreas) {
    if (entry.focusAreas.includes(area)) score += 8;
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
  const difficultyOffset = profile.experienceLevel === "advanced" ? 2 : profile.experienceLevel === "intermediate" ? 1 : 0;
  const goalOffset = profile.primaryGoal === "strength" ? 0 : profile.primaryGoal === "muscle" ? 1 : 0;
  const timeOffset = entry.type === "time" ? difficultyOffset * 5 : difficultyOffset + goalOffset;
  const setAdjustment = profile.volumeLevel === "high" ? 0 : profile.volumeLevel === "low" ? -1 : 0;

  return {
    targetMin: Math.max(1, entry.defaultTargetMin + timeOffset),
    targetMax: Math.max(entry.defaultTargetMin + timeOffset, entry.defaultTargetMax + timeOffset),
    maxSets: Math.max(1, entry.maxSets + setAdjustment),
  };
}

function buildSchedule(trainingDays: number, workoutKeys: string[]): Record<string, string> {
  const rest = {
    monday: "rest",
    tuesday: "rest",
    wednesday: "rest",
    thursday: "rest",
    friday: "rest",
    saturday: "rest",
    sunday: "rest",
  };

  if (trainingDays <= 2) {
    return { ...rest, monday: workoutKeys[0] ?? "rest", thursday: workoutKeys[1] ?? "rest" };
  }

  if (trainingDays === 3) {
    return {
      ...rest,
      monday: workoutKeys[0] ?? "rest",
      wednesday: workoutKeys[1] ?? "rest",
      friday: workoutKeys[2] ?? "rest",
    };
  }

  return {
    ...rest,
    monday: workoutKeys[0] ?? "rest",
    tuesday: workoutKeys[1] ?? "rest",
    thursday: workoutKeys[2] ?? "rest",
    saturday: workoutKeys[3] ?? workoutKeys[2] ?? "rest",
  };
}
