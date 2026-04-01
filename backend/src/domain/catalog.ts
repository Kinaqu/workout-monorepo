import { ExerciseType, ProgramExerciseInput } from "./program";
import { NormalizedUserProfile } from "./profile";

export interface ExerciseCatalogEntry {
  id: string;
  exerciseKey: string;
  name: string;
  type: ExerciseType;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  workoutTags: string[];
  goalTags: string[];
  focusAreas: string[];
  contraindicationTags: string[];
  experienceLevels: string[];
  maxSets: number;
  defaultTargetMin: number;
  defaultTargetMax: number;
  progressionEnabled: boolean;
  progressionStep: number;
  deloadStep: number;
  seedVersion: string;
}

export interface CatalogSelection {
  seedVersion: string;
  exercises: ExerciseCatalogEntry[];
}

export function filterCatalogForProfile(
  entries: ExerciseCatalogEntry[],
  profile: NormalizedUserProfile
): CatalogSelection {
  const exercises = entries.filter(entry => isEntryCompatible(entry, profile));
  const seedVersion = Array.from(new Set(exercises.map(entry => entry.seedVersion))).sort().join(",") || "unknown";

  return {
    seedVersion,
    exercises,
  };
}

export function catalogEntryToProgramExercise(
  entry: ExerciseCatalogEntry,
  options: {
    targetMin?: number;
    targetMax?: number;
    maxSets?: number;
  } = {}
): ProgramExerciseInput {
  const min = options.targetMin ?? entry.defaultTargetMin;
  const max = Math.max(min, options.targetMax ?? entry.defaultTargetMax);
  const maxSets = options.maxSets ?? entry.maxSets;

  const base = {
    id: entry.exerciseKey,
    name: entry.name,
    type: entry.type,
    max_sets: maxSets,
  } satisfies Pick<ProgramExerciseInput, "id" | "name" | "type" | "max_sets">;

  if (entry.type === "reps") {
    return { ...base, reps: { min, max } };
  }
  if (entry.type === "time") {
    return { ...base, duration: { min, max } };
  }

  return { ...base, cycles: { min, max } };
}

function isEntryCompatible(entry: ExerciseCatalogEntry, profile: NormalizedUserProfile): boolean {
  const allowedEquipment = new Set(profile.equipmentAccess);
  if (!entry.equipment.every(item => item === "bodyweight" || allowedEquipment.has(item))) {
    return false;
  }

  if (entry.contraindicationTags.some(tag => profile.limitationTags.includes(tag as (typeof profile.limitationTags)[number]))) {
    return false;
  }

  if (profile.excludedWorkoutTags.some(tag => entry.workoutTags.includes(tag))) {
    return false;
  }

  return entry.experienceLevels.includes(profile.experienceLevel);
}
