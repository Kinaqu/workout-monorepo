import { ALL_DAY_NAMES, DayName } from "../lib/time";
import { badRequest } from "../lib/app-error";

export type ExerciseType = "reps" | "time" | "cycles";

export interface TargetRange {
  min: number;
  max: number;
}

export interface ProgramExerciseInput {
  id: string;
  name: string;
  type: ExerciseType;
  max_sets: number;
  catalogExerciseId?: string | null;
  reps?: TargetRange;
  duration?: TargetRange;
  cycles?: TargetRange;
}

export interface ProgramWorkoutInput {
  name: string;
  exercises: ProgramExerciseInput[];
}

export interface ProgramDefinitionInput {
  id: string;
  name: string;
  schedule: Record<string, string>;
  workouts: Record<string, ProgramWorkoutInput>;
}

export interface ExerciseDefinition {
  id: string;
  catalogExerciseId: string | null;
  key: string;
  name: string;
  type: ExerciseType;
  progressionEnabled: boolean;
  progressionStep: number;
  deloadStep: number;
}

export interface WorkoutExerciseTemplate {
  id: string;
  sortOrder: number;
  maxSets: number;
  targetMin: number;
  targetMax: number;
  exercise: ExerciseDefinition;
}

export interface WorkoutTemplate {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  exercises: WorkoutExerciseTemplate[];
}

export interface ProgramTemplate {
  versionId: string;
  key: string;
  name: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  schedule: Record<DayName, string | null>;
  workouts: Record<string, WorkoutTemplate>;
}

export interface ProgramDraft {
  key: string;
  name: string;
  schedule: Record<DayName, string | null>;
  workouts: Array<{
    key: string;
    name: string;
    sortOrder: number;
    exercises: Array<{
      catalogExerciseId: string | null;
      exerciseKey: string;
      exerciseName: string;
      exerciseType: ExerciseType;
      maxSets: number;
      targetMin: number;
      targetMax: number;
      progressionEnabled: boolean;
      progressionStep: number;
      deloadStep: number;
      sortOrder: number;
    }>;
  }>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest(`Invalid ${fieldName}`);
  }

  return value.trim();
}

function readPositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    badRequest(`Invalid ${fieldName}`);
  }

  return value;
}

function readRange(value: unknown, fieldName: string): TargetRange {
  if (!isObject(value)) {
    badRequest(`Invalid ${fieldName}`);
  }

  const min = readPositiveInteger(value.min, `${fieldName}.min`);
  const max = readPositiveInteger(value.max, `${fieldName}.max`);
  if (max < min) {
    badRequest(`Invalid ${fieldName}`);
  }

  return { min, max };
}

function readExerciseType(value: unknown): ExerciseType {
  if (value === "reps" || value === "time" || value === "cycles") {
    return value;
  }

  badRequest("Invalid exercise type");
}

export function validateProgramDefinition(input: unknown): ProgramDefinitionInput {
  if (!isObject(input)) {
    badRequest("Program body must be an object");
  }

  const id = readString(input.id, "id");
  const name = readString(input.name, "name");

  if (!isObject(input.schedule)) {
    badRequest("Invalid schedule");
  }
  if (!isObject(input.workouts)) {
    badRequest("Invalid workouts");
  }

  const schedule: Record<string, string> = {};
  for (const day of ALL_DAY_NAMES) {
    const raw = input.schedule[day];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      badRequest(`Invalid schedule.${day}`);
    }
    schedule[day] = raw.trim();
  }

  const workouts: Record<string, ProgramWorkoutInput> = {};
  for (const [workoutKey, workoutValue] of Object.entries(input.workouts)) {
    if (!isObject(workoutValue)) {
      badRequest(`Invalid workouts.${workoutKey}`);
    }

    const workoutName = readString(workoutValue.name, `workouts.${workoutKey}.name`);
    if (!Array.isArray(workoutValue.exercises) || workoutValue.exercises.length === 0) {
      badRequest(`Invalid workouts.${workoutKey}.exercises`);
    }

    workouts[workoutKey] = {
      name: workoutName,
      exercises: workoutValue.exercises.map((exercise, index) => validateProgramExercise(exercise, workoutKey, index)),
    };
  }

  return { id, name, schedule, workouts };
}

function validateProgramExercise(input: unknown, workoutKey: string, index: number): ProgramExerciseInput {
  if (!isObject(input)) {
    badRequest(`Invalid workouts.${workoutKey}.exercises[${index}]`);
  }

  const type = readExerciseType(input.type);
  const exercise: ProgramExerciseInput = {
    id: readString(input.id, `workouts.${workoutKey}.exercises[${index}].id`),
    name: readString(input.name, `workouts.${workoutKey}.exercises[${index}].name`),
    type,
    max_sets: readPositiveInteger(input.max_sets, `workouts.${workoutKey}.exercises[${index}].max_sets`),
  };

  if (type === "reps") {
    exercise.reps = readRange(input.reps, `workouts.${workoutKey}.exercises[${index}].reps`);
  } else if (type === "time") {
    exercise.duration = readRange(input.duration, `workouts.${workoutKey}.exercises[${index}].duration`);
  } else {
    exercise.cycles = readRange(input.cycles, `workouts.${workoutKey}.exercises[${index}].cycles`);
  }

  return exercise;
}

function getTargetRange(exercise: ProgramExerciseInput): TargetRange {
  if (exercise.type === "reps" && exercise.reps) return exercise.reps;
  if (exercise.type === "time" && exercise.duration) return exercise.duration;
  if (exercise.type === "cycles" && exercise.cycles) return exercise.cycles;
  badRequest(`Missing target range for exercise ${exercise.id}`);
}

function defaultProgressionStep(type: ExerciseType): number {
  return type === "time" ? 5 : 1;
}

export function createProgramDraft(program: ProgramDefinitionInput): ProgramDraft {
  const knownWorkoutKeys = new Set(Object.keys(program.workouts));
  const schedule = {} as Record<DayName, string | null>;

  for (const day of ALL_DAY_NAMES) {
    const workoutKey = program.schedule[day];
    if (workoutKey === "rest") {
      schedule[day] = null;
      continue;
    }

    if (!knownWorkoutKeys.has(workoutKey)) {
      badRequest(`schedule.${day} references unknown workout '${workoutKey}'`);
    }

    schedule[day] = workoutKey;
  }

  const workouts = Object.entries(program.workouts).map(([workoutKey, workout], workoutIndex) => ({
    key: workoutKey,
    name: workout.name,
    sortOrder: workoutIndex,
    exercises: workout.exercises.map((exercise, exerciseIndex) => {
      const range = getTargetRange(exercise);
      return {
        catalogExerciseId: exercise.catalogExerciseId ?? null,
        exerciseKey: exercise.id,
        exerciseName: exercise.name,
        exerciseType: exercise.type,
        maxSets: exercise.max_sets,
        targetMin: range.min,
        targetMax: range.max,
        progressionEnabled: exercise.type !== "cycles" && exercise.max_sets > 1,
        progressionStep: defaultProgressionStep(exercise.type),
        deloadStep: defaultProgressionStep(exercise.type),
        sortOrder: exerciseIndex,
      };
    }),
  }));

  return {
    key: program.id,
    name: program.name,
    schedule,
    workouts,
  };
}

export function programTemplateToApi(program: ProgramTemplate): ProgramDefinitionInput {
  const workouts = Object.fromEntries(
    Object.entries(program.workouts).map(([workoutKey, workout]) => [
      workoutKey,
      {
        name: workout.name,
        exercises: workout.exercises.map(template => {
          const base = {
            id: template.exercise.key,
            name: template.exercise.name,
            type: template.exercise.type,
            max_sets: template.maxSets,
          };

          if (template.exercise.type === "reps") {
            return { ...base, reps: { min: template.targetMin, max: template.targetMax } };
          }
          if (template.exercise.type === "time") {
            return { ...base, duration: { min: template.targetMin, max: template.targetMax } };
          }

          return { ...base, cycles: { min: template.targetMin, max: template.targetMax } };
        }),
      },
    ])
  );

  const schedule = Object.fromEntries(
    ALL_DAY_NAMES.map(day => [day, program.schedule[day] ?? "rest"])
  );

  return {
    id: program.key,
    name: program.name,
    schedule,
    workouts,
  };
}
