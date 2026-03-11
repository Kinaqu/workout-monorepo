import { Program, Exercise, ExerciseType } from "./types";

const DAY_NAMES: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export interface ExerciseWithSets {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  max_sets: number;
  reps?:     { min: number; max: number };
  duration?: { min: number; max: number };
  cycles?:   { min: number; max: number };
}

export interface WorkoutResult {
  type: string;
  name: string;
  exercises: ExerciseWithSets[];
}

export type TodayResult =
  | { type: "rest" }
  | WorkoutResult;

export function getTodayWorkout(
  program: Program,
  sets: Record<string, number>
): TodayResult {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const workoutKey = program.schedule[dayName];

  if (!workoutKey || workoutKey === "rest") {
    return { type: "rest" };
  }

  const workout = program.workouts[workoutKey];
  if (!workout) {
    return { type: "rest" };
  }

  const exercises: ExerciseWithSets[] = workout.exercises.map(exercise => {
    const currentSets = sets[exercise.id] ?? 1;
    return buildExerciseResponse(exercise, currentSets);
  });

  return {
    type: workoutKey,
    name: workout.name,
    exercises,
  };
}

function buildExerciseResponse(exercise: Exercise, currentSets: number): ExerciseWithSets {
  const base = {
    id: exercise.id,
    name: exercise.name,
    type: exercise.type,
    sets: currentSets,
    max_sets: exercise.max_sets,
  };

  if (exercise.type === "reps" && exercise.reps) {
    return { ...base, reps: exercise.reps };
  }
  if (exercise.type === "time" && exercise.duration) {
    return { ...base, duration: exercise.duration };
  }
  if (exercise.type === "cycles" && exercise.cycles) {
    return { ...base, cycles: exercise.cycles };
  }

  return base;
}